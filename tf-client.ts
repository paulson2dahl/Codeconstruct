#!/usr/bin/env node
/**
 * tf-client.ts — TrueForge SDK client for the Generic Data Operations Agent
 *
 * Drives the Generic Data Operations Agent through the TrueForge HTTP API + TypeScript SDK.
 * Handles:
 *   - Session creation (inline agent spec or saved agent name)
 *   - Turn streaming with full event handling
 *   - Tool approval gates (tool.approval_required → user.tool_approval)
 *   - Ask-user-question flows (tool.response_required → user.tool_response)
 *   - Subagent thread management (parallel DB queries)
 *   - MCP OAuth (if Google Classroom/Sheets connected)
 *   - Session log integration (writes to session_log table via sandbox)
 *   - Reconnect/resilience pattern
 *
 * Install:  npm i @truefoundry/trueforge-sdk
 * Run:      npx tsx tf-client.ts "Ingest the spreadsheet and check for anomalies"
 *
 * Prerequisites:
 *   - TrueForge server running at localhost:8790
 *   - OPENROUTER_API_KEY set in ~/.env or TrueForge Settings → Models
 */

import { TrueForge, TrueForgeApi, isEventDelta, mergeEventDelta } from '@truefoundry/trueforge-sdk';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ───────────────────────────────────────────────────────────

const client = new TrueForge({
  baseUrl: process.env.TRUEFORGE_BASE_URL ?? 'http://localhost:8790',
  timeoutInSeconds: 600,
});

// The full agent manifest — matches agent.json exactly
function getAgentSpec(): TrueForgeApi.AgentSpec {
  const specPath = resolve(__dirname, 'agent.json');
  if (existsSync(specPath)) {
    return JSON.parse(readFileSync(specPath, 'utf-8'));
  }
  // Fallback inline spec - generic, schema-discovering agent
  return {
    model: { name: 'openrouter/meta/llama-4-maverick', params: { max_tokens: 4096, temperature: 0.2 } },
    instructions: 'You are a Generic Data Operations Agent for TrueForge. You discover schemas, ingest Excel/CSV files, validate data, run analytics, and propose corrections - all paused for human approval. You work with ANY domain (school, college, business, coaching, employee management, tuition, etc.) by discovering the user\'s data structure at runtime.',
    mcp_servers: [
      { name: 'sqlite-local', enable_tools: ['@all'], require_approval_for_tools: ['@write', '@destructive'], preload: false },
      { name: 'google-sheets', enable_tools: ['@read', '@write'], require_approval_for_tools: ['@write'], preload: false },
      { name: 'google-classroom', enable_tools: ['@read'], require_approval_for_tools: [], preload: false },
      { name: 'web-search', enable_tools: ['@read'], require_approval_for_tools: [], preload: false },
    ],
    config: {
      sandbox: { enabled: true, file_downloads: true },
      generative_ui: { enabled: true },
      ask_user_questions: { enabled: true },
      dynamic_sub_agents: { enabled: true },
      context_management: {
        compaction: { enabled: true, trigger: { type: 'input_tokens', value: 80000 } },
        large_tool_response: { enabled: true },
      },
      iteration_limit: 50,
    },
  };
}

// ─── Event Processing ────────────────────────────────────────────────────────

interface SessionContext {
  events: Map<string, TrueForgeApi.TurnStreamingEvent>;
  pendingApprovals: TrueForgeApi.ToolApprovalRequiredEvent[];
  pendingQuestions: TrueForgeApi.ToolResponseRequiredEvent[];
  turnId: string | undefined;
  lastSequenceNumber: number;
  threads: Map<string, Map<string, TrueForgeApi.TurnStreamingEvent>>; // threadId → eventMap
}

function createSessionContext(): SessionContext {
  return {
    events: new Map(),
    pendingApprovals: [],
    pendingQuestions: [],
    turnId: undefined,
    lastSequenceNumber: 0,
    threads: new Map(),
  };
}

function processEvent(event: TrueForgeApi.TurnStreamingEvent, ctx: SessionContext): string | null {
  // Track sequence number for reconnection
  // Note: sequenceNumber comes from stream metadata, not the event itself

  if (isEventDelta(event)) {
    // Merge delta into base event
    const base = ctx.events.get(event.id);
    if (base) {
      mergeEventDelta(base, event);
    }
    // For model.message deltas, we stream content to stdout
    if (event.type === 'model.message.delta') {
      return event.content ?? null;
    }
    return null;
  }

  // Base events
  ctx.events.set(event.id, event);

  switch (event.type) {
    case 'turn.created':
      ctx.turnId = event.turnId;
      console.log(`\n[turn created: ${event.turnId}]`);
      break;

    case 'mcp.initialize':
      for (const server of event.mcpServers ?? []) {
        console.log(`[mcp] connected to ${server.name}`);
      }
      break;

    case 'sandbox.created':
      console.log(`[sandbox] provisioned: ${event.sandboxId}`);
      break;

    case 'model.message':
      // Check for tool calls
      if (event.toolCalls && event.toolCalls.length > 0) {
        for (const tc of event.toolCalls) {
          console.log(`\n[tool] ${tc.toolInfo?.name ?? tc.function?.name}`);
          if (tc.function?.arguments && tc.toolInfo?.name !== 'ask_user_question') {
            console.log(`  args: ${tc.function.arguments.slice(0, 200)}`);
          }
        }
      }
      // Reset pending deltas for this message
      if (event.finishReason === 'stop') {
        // Message complete
      }
      break;

    case 'tool.approval_required':
      ctx.pendingApprovals.push(event);
      break;

    case 'tool.response_required':
      ctx.pendingQuestions.push(event);
      break;

    case 'thread.created': {
      const threadId = event.threadId;
      if (threadId) {
        ctx.threads.set(threadId, new Map());
        console.log(`\n[subagent] ↳ ${event.title} (thread: ${threadId})`);
      }
      break;
    }

    case 'thread.done': {
      const threadId = event.threadId;
      if (threadId && ctx.threads.has(threadId)) {
        const threadEvents = ctx.threads.get(threadId)!;
        console.log(`\n[subagent] ${event.title} done (${threadEvents.size} events)`);
        ctx.threads.delete(threadId);
      }
      break;
    }

    case 'turn.done':
      console.log(`\n[turn done] status: ${event.state.status}`);
      if (event.state.status === 'done' && event.state.output) {
        console.log(`[output] ${event.state.output.content}`);
      }
      if (event.state.status === 'error') {
        console.error(`[error] ${event.state.error?.message ?? 'unknown error'}`);
      }
      break;

    case 'mcp.auth_required':
      for (const server of event.mcpServers ?? []) {
        console.log(`[auth] ${server.name}: ${server.authUrl}`);
      }
      break;

    default:
      // Unknown event type — log for visibility
      console.log(`[event] ${event.type}`);
      break;
  }

  // Route to thread bucket if subagent thread
  if (event.threadId && event.threadId !== 'main' && ctx.threads.has(event.threadId)) {
    ctx.threads.get(event.threadId)!.set(event.id, event);
  }

  return null;
}

// ─── Human Interaction Handlers ──────────────────────────────────────────────

async function handleApprovals(ctx: SessionContext): Promise<TrueForgeApi.UserToolApprovalEvent[]> {
  const approvals: TrueForgeApi.UserToolApprovalEvent[] = [];

  for (const pending of ctx.pendingApprovals) {
    for (const ref of pending.toolCalls) {
      const msg = ctx.events.get(ref.sourceEventId);
      if (msg?.type !== 'model.message') continue;

      const call = (msg as any).toolCalls?.find((tc: any) => tc.id === ref.id);
      if (!call) continue;

      const toolName = call.toolInfo?.name ?? call.function?.name ?? 'unknown';
      const args = call.function?.arguments ?? '';

      if (toolName === 'ask_user_question') {
        // Questions are handled separately; skip here
        continue;
      }

      // Generic approval logic — works for any MCP tool, any domain
      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`🔒 APPROVAL REQUIRED: ${toolName}`);
      console.log(`═══════════════════════════════════════════════════════════`);

      // Check for DB write tools (sqlite, supabase, etc.) — auto-approve read-only
      const dbWriteToolPattern = /^mcp__(sqlite-local|supabase)__(execute|query)$/;
      if (dbWriteToolPattern.test(toolName)) {
        const parsed = JSON.parse(args);
        const sql = parsed.query || parsed.sql || parsed.statement || '';

        const readOnly = /^(SELECT|PRAGMA|WITH|EXPLAIN)/i.test(sql.trim());
        if (readOnly) {
          console.log(`\n[auto-approve] Read-only query`);
          approvals.push({
            type: 'user.tool_approval',
            threadId: pending.threadId,
            toolCallId: ref.id,
            approval: { status: 'allow' },
          });
          continue;
        }

        console.log(`Thread: ${pending.threadId}`);
        console.log(`SQL: ${sql.slice(0, 500)}${sql.length > 500 ? '...' : ''}`);
        console.log(`\n`);
      } else {
        // Non-DB tools — show args for review
        console.log(`Thread: ${pending.threadId}`);
        console.log(`Args: ${(args || '').slice(0, 500)}`);
        console.log(`\n`);
      }

      // Auto-approve session log writes
      if (/INSERT INTO session_log/i.test(args)) {
        console.log(`[auto-approve] Session log write`);
        approvals.push({
          type: 'user.tool_approval',
          threadId: pending.threadId,
          toolCallId: ref.id,
          approval: { status: 'allow' },
        });
        continue;
      }

      // Auto-approve sandbox.exec read-only operations (no DB writes inside)
      if (toolName === 'sandbox.exec' || toolName === 'mcp__sandbox__exec') {
        const parsed = JSON.parse(args);
        const code = parsed.code || '';
        // Check if code contains write operations
        const hasWriteOps = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE)\b/i.test(code);
        if (!hasWriteOps) {
          console.log(`[auto-approve] Read-only sandbox execution`);
          approvals.push({
            type: 'user.tool_approval',
            threadId: pending.threadId,
            toolCallId: ref.id,
            approval: { status: 'allow' },
          });
          continue;
        }
      }

      console.log(`Approve? (y/n): `);
      const answer = await promptUser();
      const approved = answer.trim().toLowerCase() === 'y';
      approvals.push({
        type: 'user.tool_approval',
        threadId: pending.threadId,
        toolCallId: ref.id,
        approval: approved
          ? { status: 'allow' }
          : { status: 'deny', reason: 'Denied by human operator' },
      });

      if (approved) {
        console.log(`✅ Approved`);
      } else {
        console.log(`❌ Rejected`);
      }
    }
  }

  return approvals;
}

async function handleQuestions(ctx: SessionContext): Promise<TrueForgeApi.UserToolResponseEvent[]> {
  const responses: TrueForgeApi.UserToolResponseEvent[] = [];
  const prompts: Record<string, { question: string; options?: string[] }> = {};

  for (const pending of ctx.pendingQuestions) {
    for (const ref of pending.toolCalls) {
      const msg = ctx.events.get(ref.sourceEventId);
      if (msg?.type !== 'model.message') continue;

      const call = (msg as any).toolCalls?.find((tc: any) => tc.id === ref.id);
      if (!call) continue;

      const toolName = call.toolInfo?.name ?? call.function?.name;
      if (toolName !== 'ask_user_question') continue;

      const parsed = JSON.parse(call.function?.arguments || '{}');
      const { question, options } = parsed;

      prompts[ref.id] = { question, options };
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`❓ AGENT ASKED: ${question}`);
      if (options && options.length > 0) {
        options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
      }
      console.log('─'.repeat(50));
    }
  }

  if (Object.keys(prompts).length === 0) return responses;

  for (const pending of ctx.pendingQuestions) {
    for (const ref of pending.toolCalls) {
      const prompt = prompts[ref.id];
      if (!prompt) continue;

      console.log(`\nQuestion: ${prompt.question}`);
      if (prompt.options?.length) {
        prompt.options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
        console.log(`Select (enter text or number): `);
      } else {
        console.log(`Your answer: `);
      }

      const answer = await promptUser();
      responses.push({
        type: 'user.tool_response',
        threadId: pending.threadId,
        toolCallId: ref.id,
        content: answer.trim() || 'default',
      });
    }
  }

  return responses;
}

// ─── CLI Prompt ──────────────────────────────────────────────────────────────

function promptUser(): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    readline.question('', (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// ─── Main Execution Loop ─────────────────────────────────────────────────────

async function runAgentTurn(prompt: string): Promise<void> {
  // 1. Create session (inline agent spec — no persistence needed)
  console.log('Creating session with Data Operations Agent...\n');
  const { data: session } = await client.sessions.create({
    agent: { spec: getAgentSpec() },
  });
  console.log(`Session: ${session.id}`);

  // 2. Stream the turn
  const ctx = createSessionContext();

  let stream = await client.sessions.createTurnStream(session.id, {
    input: [{ type: 'user.message', content: prompt }],
  });

  // 3. Process events, handling pauses
  while (true) {
    let needsResume = false;

    for await (const { data: event } of stream.withMetadata()) {
      const content = processEvent(event, ctx);
      if (content) process.stdout.write(content);

      if (event.type === 'turn.done') {
        if (event.state.status === 'done' || event.state.status === 'error') {
          break;
        }
      }

      // Check if we need to pause for approval or questions
      if (event.type === 'tool.approval_required' || event.type === 'tool.response_required') {
        needsResume = true;
        break;
      }
    }

    if (!needsResume || !ctx.turnId) {
      // Turn completed
      break;
    }

    // 4. Handle approvals and questions
    const approvals = await handleApprovals(ctx);
    const questions = await handleQuestions(ctx);

    // 5. Resume with approvals/questions
    const resumeInput: TrueForgeApi.UserInputItem[] = [];
    resumeInput.push(...approvals);
    resumeInput.push(...questions);

    if (resumeInput.length === 0) {
      // No approvals or questions pending — but turn was still running
      // This shouldn't happen, but handle gracefully
      console.log('\n[warning] Turn paused but no actions to resume with');
      break;
    }

    ctx.pendingApprovals = [];
    ctx.pendingQuestions = [];

    // Resume the turn with approvals/responses (same turn ID)
    stream = await client.sessions.createTurnStream(session.id, {
      input: resumeInput,
    });

    // Note: TrueForge chains turns automatically, so the new stream
    // continues the same conversation context
  }

  // 6. Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Session complete: ${session.id}`);
  console.log(`Turn: ${ctx.turnId}`);
  console.log(`${'═'.repeat(60)}`);
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
  const prompt = process.argv.slice(2).join(' ');
  if (!prompt) {
    console.error('Usage: npx tsx tf-client.ts "<prompt>"');
    console.error('Example: npx tsx tf-client.ts "Ingest the spreadsheet and check for anomalies"');
    process.exit(1);
  }

  try {
    await runAgentTurn(prompt);
  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message ?? err}`);
    if (err.status === 404) {
      console.error('TrueForge server not reachable. Run: npx @truefoundry/trueforge@latest');
    }
    process.exit(1);
  }
}

main();

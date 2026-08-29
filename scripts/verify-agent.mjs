#!/usr/bin/env node
/**
 * verify-agent.mjs — Verifies that agent.json matches the TrueForge agent spec.
 * Output: agent_ok on success.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_PATH = resolve(__dirname, '..', 'agent.json');

function main() {
  if (!existsSync(AGENT_PATH)) {
    console.error('agent.json not found');
    process.exit(1);
  }

  const agent = JSON.parse(readFileSync(AGENT_PATH, 'utf-8'));

  // Check model (required field)
  if (!agent.model || !agent.model.name) {
    console.error('Missing model.name');
    process.exit(1);
  }

  // Check instructions
  if (!agent.instructions || agent.instructions.length < 50) {
    console.error('Missing or too short instructions');
    process.exit(1);
  }

  // Check instructions mention the core capabilities
  if (!agent.instructions.includes('SCHEMA DISCOVERY') && !agent.instructions.includes('schema discovery')) {
    console.error('Instructions missing schema discovery');
    process.exit(1);
  }
  if (!agent.instructions.includes('DATA INGESTION') && !agent.instructions.includes('data ingestion')) {
    console.error('Instructions missing data ingestion');
    process.exit(1);
  }
  if (!agent.instructions.includes('ANOMALY') && !agent.instructions.includes('anomaly')) {
    console.error('Instructions missing anomaly detection');
    process.exit(1);
  }
  if (!agent.instructions.includes('MATCHING') && !agent.instructions.includes('matching')) {
    console.error('Instructions missing matching/optimization');
    process.exit(1);
  }
  if (!agent.instructions.includes('ANALYTICS') && !agent.instructions.includes('analytics')) {
    console.error('Instructions missing analytics');
    process.exit(1);
  }

  // Check for approval gating language
  if (!agent.instructions.toLowerCase().includes('approval')) {
    console.error('Instructions missing approval language');
    process.exit(1);
  }

  // Check mcp_servers (optional but should reference sqlite-local)
  if (!Array.isArray(agent.mcp_servers)) {
    console.error('Missing mcp_servers array');
    process.exit(1);
  }
  const mcpNames = agent.mcp_servers.map(s => s.name);
  if (!mcpNames.includes('sqlite-local')) {
    console.error('Missing sqlite-local MCP server reference');
    process.exit(1);
  }

  // Check config
  if (!agent.config) {
    console.error('Missing config');
    process.exit(1);
  }
  if (!agent.config.sandbox || !agent.config.sandbox.enabled) {
    console.error('Missing sandbox config');
    process.exit(1);
  }
  if (!agent.config.dynamic_sub_agents || !agent.config.dynamic_sub_agents.enabled) {
    console.error('Missing dynamic_sub_agents config');
    process.exit(1);
  }
  if (!agent.config.generative_ui || !agent.config.generative_ui.enabled) {
    console.error('Missing generative_ui config');
    process.exit(1);
  }
  if (!agent.config.ask_user_questions || !agent.config.ask_user_questions.enabled) {
    console.error('Missing ask_user_questions config');
    process.exit(1);
  }

  // Check model uses OpenRouter format
  if (!agent.model.name.includes('openrouter/')) {
    console.error('Model should use OpenRouter format: openrouter/anthropic/claude-sonnet-4-6');
    process.exit(1);
  }

  console.log('agent_ok');
}

main();

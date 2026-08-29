#!/usr/bin/env node
/**
 * gate-check.mjs — Runs each gate's CHECK: command and verifies against EXPECT:.
 * Usage:
 *   node scripts/gate-check.mjs GATES.md              (status — parse + show, no execution)
 *   node scripts/gate-check.mjs --approve GATES.md    (execute CHECK: commands, requires approval)
 *   node scripts/gate-check.mjs --reverify GATES.md   (re-run all gates, including completed ones)
 *   node scripts/gate-check.mjs --status GATES.md     (alias for no-flag status mode)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const args = process.argv.slice(2);
const isApprove = args.includes('--approve');
const isReverify = args.includes('--reverify');
const gatesPath = args.find(a => !a.startsWith('--'));

if (!gatesPath || !existsSync(gatesPath)) {
  console.error('Usage: node scripts/gate-check.mjs [--approve|--reverify] <GATES.md>');
  process.exit(1);
}

const content = readFileSync(resolve(gatesPath), 'utf-8');
const gatePattern = /^-\s*\[(\s|x)\]\s+(G\d+):\s*(.+)$/;

// Parse gates from the unlazy checkbox format
let gates = [];
let currentGate = null;

for (const line of content.split('\n')) {
  const trimmed = line.trim();

  // Skip code blocks
  if (trimmed.startsWith('```')) continue;

  const gateMatch = trimmed.match(gatePattern);
  if (gateMatch) {
    if (currentGate) {
      gates.push(currentGate);
    }
    currentGate = {
      id: gateMatch[2],
      title: gateMatch[3],
      isChecked: gateMatch[1].toLowerCase() === 'x',
      command: null,
      expected: null,
      evidence: null,
      cwd: null,
    };
  }

  if (currentGate && line.startsWith('  ')) {
    const attrLine = line.slice(2);
    if (attrLine.startsWith('CHECK:')) {
      currentGate.command = attrLine.slice(6).trim();
    }
    if (attrLine.startsWith('EXPECT:')) {
      currentGate.expected = attrLine.slice(7).trim();
    }
    if (attrLine.startsWith('EVIDENCE:')) {
      currentGate.evidence = attrLine.slice(9).trim();
    }
    if (attrLine.startsWith('CWD:')) {
      currentGate.cwd = attrLine.slice(4).trim();
    }
  }
}
if (currentGate) {
  gates.push(currentGate);
}

if (gates.length === 0) {
  console.error('No gates found in GATES.md');
  process.exit(1);
}

// Approval tracking
const approvalDir = resolve(process.env.HOME || '.', '.unlazy');
if (!existsSync(approvalDir)) {
  mkdirSync(approvalDir, { recursive: true });
}
const approvalFile = resolve(approvalDir, 'approved.json');
let approved = {};
if (existsSync(approvalFile)) {
  approved = JSON.parse(readFileSync(approvalFile, 'utf-8'));
}

const gatesFile = resolve(gatesPath);

console.log(`\n=== Gate Check: ${gatesPath} ===\n`);

let allPassed = true;

for (const gate of gates) {
  const gateKey = `${gatesFile}:${gate.id}`;

  // Skip manual gates (no CHECK/EXPECT)
  if (!gate.command || !gate.expected) {
    console.log(`[${gate.id}] ${gate.title}`);
    console.log(`  (manual gate — no CHECK:/EXPECT:)`);
    console.log(`  Evidence: ${gate.evidence || 'none'}`);
    console.log();
    continue;
  }

  console.log(`[${gate.id}] ${gate.title}`);

  // Status mode: show what would run, don't execute
  if (!isApprove && !isReverify) {
    console.log(`  CHECK: ${gate.command}`);
    console.log(`  EXPECT: ${gate.expected}`);
    const isGateApproved = approved[gateKey];
    console.log(`  Status: ${isGateApproved ? 'approved' : 'not approved'}`);
    console.log();
    continue;
  }

  // Reverify mode: re-run all, including approved gates
  // Approve mode: execute and record approval

  const gateApproved = approved[gateKey];
  if (!gateApproved) {
    // Record approval for this gate
    approved[gateKey] = {
      command: gate.command,
      expected: gate.expected,
      cwd: gate.cwd || projectRoot,
      approvedAt: new Date().toISOString(),
      shell: 'sh',
    };
  }

  // Execute the CHECK command
  const cwd = gate.cwd || projectRoot;
  try {
    const output = execSync(gate.command, {
      cwd,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const trimmedOutput = output.trim();

    // Check if output matches expectation
    // Support /pattern/ regex format or plain substring
    let matches;
    if (gate.expected.startsWith('/') && gate.expected.endsWith('/')) {
      const pattern = gate.expected.slice(1, -1);
      matches = new RegExp(pattern).test(trimmedOutput);
    } else {
      matches = trimmedOutput.includes(gate.expected) || trimmedOutput === gate.expected;
    }

    if (matches) {
      console.log(`  ✓ PASS  (output: "${trimmedOutput.slice(0, 100)}")`);
    } else {
      console.log(`  ✗ FAIL  (expected: "${gate.expected.slice(0, 60)}", got: "${trimmedOutput.slice(0, 80)}")`);
      allPassed = false;
    }
  } catch (err) {
    const stdout = err.stdout ? err.stdout.toString().trim() : '';
    const stderr = err.stderr ? err.stderr.toString().trim() : '';
    const errMsg = (stderr || stdout || err.message).slice(0, 120);
    console.log(`  ✗ FAIL  (error: "${errMsg}")`);
    allPassed = false;
  }

  console.log();
}

// Save approvals
if (isApprove || isReverify) {
  writeFileSync(approvalFile, JSON.stringify(approved, null, 2));
}

if (allPassed) {
  console.log('=== All gates PASSED ===');
} else {
  console.log('=== Some gates FAILED ===');
  process.exit(1);
}

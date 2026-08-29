#!/usr/bin/env node
/**
 * gate-lint.mjs — Lints a GATES.md ledger for structural correctness.
 * Usage: node scripts/gate-lint.mjs GATES.md
 *
 * Parses the unlazy gate format:
 *   - [ ] G1: outcome
 *     CHECK: command
 *     EXPECT: expected
 *     EVIDENCE: pending
 *
 * Requires: each runnable gate has CHECK: + EXPECT: + EVIDENCE:
 *           manual gates have only EVIDENCE:
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const args = process.argv.slice(2);
const gatesPath = args[0];

if (!gatesPath || !existsSync(gatesPath)) {
  console.error('Usage: node scripts/gate-lint.mjs <GATES.md>');
  process.exit(1);
}

const content = readFileSync(resolve(gatesPath), 'utf-8');
const lines = content.split('\n');

let errors = [];
let warnings = [];
let gateCount = 0;
let currentGate = null;
let seenIds = new Set();

const gatePattern = /^-\s*\[(\s|x)\]\s+(G\d+):\s*(.+)$/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Skip code blocks
  if (trimmed.startsWith('```')) continue;

  const gateMatch = trimmed.match(gatePattern);
  if (gateMatch) {
    // Check previous gate for completeness
    if (currentGate) {
      if (currentGate.hasCheck && !currentGate.hasExpect) {
        errors.push(`Gate ${currentGate.id}: has CHECK: but missing EXPECT:`);
      }
      if (currentGate.hasExpect && !currentGate.hasCheck) {
        errors.push(`Gate ${currentGate.id}: has EXPECT: but missing CHECK:`);
      }
      if (!currentGate.hasEvidence) {
        warnings.push(`Gate ${currentGate.id}: missing EVIDENCE:`);
      }
    }

    gateCount++;
    const isChecked = gateMatch[1].toLowerCase() === 'x';

    currentGate = {
      id: gateMatch[2],
      title: gateMatch[3],
      hasCheck: false,
      hasExpect: false,
      hasEvidence: false,
      isChecked: isChecked,
      lineNum: i + 1,
    };

    if (seenIds.has(currentGate.id)) {
      errors.push(`Gate ${currentGate.id}: duplicate gate ID`);
    }
    seenIds.add(currentGate.id);
  }

  // Indented attributes belong to the current gate
  if (currentGate && line.startsWith('  ')) {
    const attrLine = line.slice(2);
    if (attrLine.startsWith('CHECK:')) {
      currentGate.hasCheck = true;
      const cmd = attrLine.slice(6).trim();
      if (!cmd) {
        errors.push(`Gate ${currentGate.id}: CHECK: is empty`);
      }
    }
    if (attrLine.startsWith('EXPECT:')) {
      currentGate.hasExpect = true;
      const exp = attrLine.slice(7).trim();
      if (!exp) {
        errors.push(`Gate ${currentGate.id}: EXPECT: is empty`);
      }
    }
    if (attrLine.startsWith('EVIDENCE:')) {
      currentGate.hasEvidence = true;
    }
    if (attrLine.startsWith('CWD:')) {
      // CWD is fine, no error
    }
  }
}

// Check last gate
if (currentGate) {
  if (currentGate.hasCheck && !currentGate.hasExpect) {
    errors.push(`Gate ${currentGate.id}: has CHECK: but missing EXPECT:`);
  }
  if (currentGate.hasExpect && !currentGate.hasCheck) {
    errors.push(`Gate ${currentGate.id}: has EXPECT: but missing CHECK:`);
  }
  if (!currentGate.hasEvidence) {
    warnings.push(`Gate ${currentGate.id}: missing EVIDENCE:`);
  }
}

// Check for ABANDON lines
if (content.includes('ABANDON:')) {
  warnings.push('ABANDON: directives found — these end execution honestly but are not success');
}

// Report
console.log(`GATES.md lint: ${gateCount} gate(s) found`);

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ⚠ ${w}`));
}

if (errors.length > 0) {
  console.log(`Errors (${errors.length}):`);
  errors.forEach(e => console.log(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ GATES.md is structurally valid');

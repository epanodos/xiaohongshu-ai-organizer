#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const MODE = 'favorites-organizer';
export const CONFIRMATION_PHRASE = 'CONFIRM XHS DESTRUCTIVE ACTIONS';
const ALLOWED_ACTIONS = new Set(['remove-favorite', 'delete-album']);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function planHash(plan) {
  const unsigned = structuredClone(plan);
  delete unsigned.confirmation;
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(unsigned)))
    .digest('hex');
}

function requireStringArray(value, field, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return [];
  }
  if (value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push(`${field} must contain only non-empty strings`);
  }
  if (new Set(value).size !== value.length) errors.push(`${field} contains duplicates`);
  return value;
}

export function validatePlan(plan, { requireConfirmed = false } = {}) {
  const errors = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return { ok: false, errors: ['plan must be a JSON object'] };
  }
  if (plan.version !== 1) errors.push('version must be 1');
  if (plan.mode !== MODE) errors.push(`mode must be ${MODE}`);
  if (typeof plan.createdAt !== 'string' || Number.isNaN(Date.parse(plan.createdAt))) {
    errors.push('createdAt must be an ISO-style date string');
  }

  requireStringArray(plan.keepRules, 'keepRules', errors);
  const protectedNoteIds = new Set(requireStringArray(plan.protectedNoteIds, 'protectedNoteIds', errors));
  const protectedBoardIds = new Set(requireStringArray(plan.protectedBoardIds, 'protectedBoardIds', errors));
  const unresolved = requireStringArray(plan.unresolvedItems, 'unresolvedItems', errors);

  if (!Array.isArray(plan.plannedActions)) {
    errors.push('plannedActions must be an array');
  } else {
    const targets = new Set();
    let albumDeletionStarted = false;
    for (const [index, action] of plan.plannedActions.entries()) {
      const prefix = `plannedActions[${index}]`;
      if (!action || typeof action !== 'object' || Array.isArray(action)) {
        errors.push(`${prefix} must be an object`);
        continue;
      }
      if (!ALLOWED_ACTIONS.has(action.type)) errors.push(`${prefix}.type is not allowed`);
      if (action.type === 'delete-album') albumDeletionStarted = true;
      if (action.type === 'remove-favorite' && albumDeletionStarted) {
        errors.push(`${prefix} removes a favorite after album deletion has started`);
      }
      if (typeof action.targetId !== 'string' || action.targetId.trim() === '') {
        errors.push(`${prefix}.targetId must be a non-empty string`);
        continue;
      }
      const targetKey = `${action.type}:${action.targetId}`;
      if (targets.has(targetKey)) errors.push(`${prefix} duplicates target ${action.targetId}`);
      targets.add(targetKey);
      if (action.type === 'remove-favorite' && protectedNoteIds.has(action.targetId)) {
        errors.push(`${prefix} targets protected note ${action.targetId}`);
      }
      if (action.type === 'delete-album' && protectedBoardIds.has(action.targetId)) {
        errors.push(`${prefix} targets protected album ${action.targetId}`);
      }
    }
  }

  if (requireConfirmed) {
    if (unresolved.length > 0) errors.push('unresolvedItems must be empty before execution');
    const confirmation = plan.confirmation;
    if (!confirmation || confirmation.confirmed !== true) errors.push('plan is not confirmed');
    if (confirmation?.phrase !== CONFIRMATION_PHRASE) errors.push('confirmation phrase does not match');
    if (confirmation?.planHash !== planHash(plan)) errors.push('confirmation hash is missing or stale');
  }

  return { ok: errors.length === 0, errors, hash: planHash(plan) };
}

async function loadPlan(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function main(argv) {
  const [command, file, ...rest] = argv;
  if (!command || !file || !['validate', 'hash', 'confirm'].includes(command)) {
    throw new Error('Usage: plan_guard.mjs <validate|hash|confirm> <plan.json> [--require-confirmed] [--phrase TEXT]');
  }
  const plan = await loadPlan(file);
  if (command === 'hash') {
    console.log(planHash(plan));
    return;
  }
  if (command === 'validate') {
    const result = validatePlan(plan, { requireConfirmed: rest.includes('--require-confirmed') });
    if (!result.ok) throw new Error(result.errors.join('\n'));
    console.log(`valid ${MODE} plan ${result.hash}`);
    return;
  }
  const phraseIndex = rest.indexOf('--phrase');
  const phrase = phraseIndex >= 0 ? rest[phraseIndex + 1] : undefined;
  if (phrase !== CONFIRMATION_PHRASE) throw new Error('exact confirmation phrase required');
  const result = validatePlan(plan);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  if (plan.unresolvedItems.length > 0) throw new Error('cannot confirm a plan with unresolvedItems');
  plan.confirmation = { confirmed: true, phrase, planHash: result.hash };
  await writeFile(file, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(`confirmed ${MODE} plan ${result.hash}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

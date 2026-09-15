#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'PRIVACY.md',
  'docs/case-study.md',
  'skills/xhs-published-cleanup/SKILL.md',
  'skills/xhs-published-cleanup/agents/openai.yaml',
  'skills/xhs-published-cleanup/scripts/plan_guard.mjs',
  'skills/xhs-favorites-organizer/SKILL.md',
  'skills/xhs-favorites-organizer/agents/openai.yaml',
  'skills/xhs-favorites-organizer/scripts/plan_guard.mjs',
  'examples/published-plan.example.json',
  'examples/favorites-plan.example.json',
];

const ignoredDirectories = new Set(['.git', 'node_modules', '.xhs-organizer']);
const textExtensions = new Set(['.md', '.json', '.mjs', '.js', '.yaml', '.yml', '.txt']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (textExtensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const errors = [];
for (const relative of required) {
  try {
    await access(path.join(root, relative));
  } catch {
    errors.push(`missing required file: ${relative}`);
  }
}

const placeholder = new RegExp(`\\[${'TO' + 'DO'}(?::[^\\]]*)?\\]|\\[待填写\\]|Briefly describe what this skill does`, 'i');
const credentialAssignment = /(?:web_session|xsec_token|access_token|refresh_token|authorization)\s*[=:]\s*["']?[A-Za-z0-9._-]{12,}/i;
const sharedXhsUrl = /xiaohongshu\.com\/[^\s)]+\?(?=[^\s)]*(?:xsec_token|web_session|shareRedId)=)/i;

for (const file of await walk(root)) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const content = await readFile(file, 'utf8');
  if (relative !== 'tools/check-repository.mjs' && placeholder.test(content)) {
    errors.push(`placeholder text found: ${relative}`);
  }
  if (credentialAssignment.test(content)) errors.push(`possible credential assignment found: ${relative}`);
  if (sharedXhsUrl.test(content)) errors.push(`share URL with private query data found: ${relative}`);
}

for (const relative of ['examples/published-plan.example.json', 'examples/favorites-plan.example.json']) {
  const value = JSON.parse(await readFile(path.join(root, relative), 'utf8'));
  const ids = [
    ...(value.protectedNoteIds ?? []),
    ...(value.protectedBoardIds ?? []),
    ...(value.plannedActions ?? []).map((action) => action.targetId),
  ];
  if (ids.some((id) => !/^(note|board)_demo_[a-z0-9_]+$/.test(id))) {
    errors.push(`example contains an ID that is not visibly synthetic: ${relative}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`repository check passed (${required.length} required files)`);
}

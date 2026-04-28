#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('../..', import.meta.url).pathname);
const frontxoxoRoot = path.join(repoRoot, 'frontxoxo');
const checklistPath = path.join(frontxoxoRoot, 'checklist.md');

const GENERATED_FILES = new Set([
  'AGENT.md',
  'README.md',
  'TASK_TEMPLATE.md',
  'checklist.md',
]);

const taskPattern = /^- ([A-Z0-9]+(?:-[A-Z0-9]+)*-S([23])-\d{3}):\s*(.+)$/;
const existingPattern =
  /^- \[([ X!\-])\] ([A-Z0-9]+(?:-[A-Z0-9]+)*-S[23]-\d{3}) \| area: ([^|]+) \| kind: ([^|]+) \| task: ([^|]+) \| owner: ([^|]+) \| claimed: ([^|]+) \| evidence: ([^|]+) \| files: ([^|]+) \| verified: ([^|]+) \| notes: (.*)$/;

function walkMarkdownFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(frontxoxoRoot, absolutePath);

    if (entry.isDirectory()) {
      if (entry.name === 'tools') {
        continue;
      }
      files.push(...walkMarkdownFiles(absolutePath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    if (GENERATED_FILES.has(relativePath) || GENERATED_FILES.has(entry.name)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files.sort((a, b) =>
    path.relative(frontxoxoRoot, a).localeCompare(path.relative(frontxoxoRoot, b)),
  );
}

function readExistingMetadata() {
  if (!fs.existsSync(checklistPath)) {
    return new Map();
  }

  const metadata = new Map();
  const lines = fs.readFileSync(checklistPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(existingPattern);
    if (!match) {
      continue;
    }

    const [
      ,
      status,
      id,
      ,
      ,
      ,
      owner,
      claimed,
      evidence,
      files,
      verified,
      notes,
    ] = match;

    metadata.set(id, {
      status,
      owner: owner.trim(),
      claimed: claimed.trim(),
      evidence: evidence.trim(),
      files: files.trim(),
      verified: verified.trim(),
      notes: notes.trim(),
    });
  }

  return metadata;
}

function parseTasks() {
  const tasks = [];
  const seen = new Set();

  for (const absolutePath of walkMarkdownFiles(frontxoxoRoot)) {
    const relativePath = path.relative(frontxoxoRoot, absolutePath);
    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
      const match = line.match(taskPattern);
      if (!match) {
        continue;
      }

      const [, id, stage, text] = match;
      if (seen.has(id)) {
        throw new Error(`Duplicate task ID found: ${id}`);
      }
      seen.add(id);

      tasks.push({
        id,
        area: relativePath,
        kind: stage === '2' ? 'screen' : 'bug-check',
        task: text.trim(),
      });
    }
  }

  return tasks;
}

function groupTasks(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    if (!groups.has(task.area)) {
      groups.set(task.area, []);
    }
    groups.get(task.area).push(task);
  }

  return groups;
}

function metadataFor(id, existingMetadata) {
  return (
    existingMetadata.get(id) ?? {
      status: ' ',
      owner: 'unassigned',
      claimed: '-',
      evidence: '-',
      files: '-',
      verified: '-',
      notes: '-',
    }
  );
}

function renderChecklist(tasks, existingMetadata) {
  const groups = groupTasks(tasks);
  const lines = [
    '# Frontxoxo UI/UX Task Board',
    '',
    'This is the live synchronized task board for UI/UX bug-hunt agents.',
    'Agents must read `/Users/test/Code/V/frontxoxo/AGENT.md` before claiming or updating any task.',
    '',
    '## Status Legend',
    '',
    '- `[ ]` Unclaimed',
    '- `[-]` In progress',
    '- `[X]` Complete',
    '- `[!]` Blocked',
    '',
    '## Rules',
    '',
    '- Claim exactly one numbered ID per turn.',
    '- Do not claim a whole file, platform, or folder.',
    '- Claim work only by changing `[ ]` to `[-]` and filling `owner:` and `claimed:`.',
    '- Mark `[X]` only after direct inspection and verification.',
    '- Mark `[!]` with blocker notes when work cannot continue.',
    '- Do not reorder tasks manually; regenerate with `node frontxoxo/tools/build-checklist.mjs` when scope files change.',
    '',
    '## Tasks',
    '',
  ];

  for (const [area, areaTasks] of groups.entries()) {
    lines.push(`### ${area}`);
    lines.push('');

    for (const task of areaTasks) {
      const metadata = metadataFor(task.id, existingMetadata);
      lines.push(
        `- [${metadata.status}] ${task.id} | area: ${task.area} | kind: ${task.kind} | task: ${task.task} | owner: ${metadata.owner} | claimed: ${metadata.claimed} | evidence: ${metadata.evidence} | files: ${metadata.files} | verified: ${metadata.verified} | notes: ${metadata.notes}`,
      );
    }

    lines.push('');
  }

  lines.push(`Total tasks: ${tasks.length}`);
  lines.push('');

  return `${lines.join('\n')}`;
}

const existingMetadata = readExistingMetadata();
const tasks = parseTasks();
const checklist = renderChecklist(tasks, existingMetadata);

fs.writeFileSync(checklistPath, checklist, 'utf8');
console.log(`Generated ${tasks.length} Frontxoxo tasks at ${checklistPath}`);

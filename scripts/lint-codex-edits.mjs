import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let raw = '';
for await (const chunk of process.stdin) raw += String(chunk);

let input;
try {
  input = JSON.parse(raw.replace(/^\uFEFF/, ''));
} catch {
  process.exit(0);
}

const paths = new Set();
if (typeof input?.tool_input?.file_path === 'string') paths.add(input.tool_input.file_path);
const patch = input?.tool_input?.command;
if (typeof patch === 'string') {
  for (const line of patch.split(/\r?\n/)) {
    const match = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/.exec(line);
    if (match) paths.add(match[1]);
  }
}

for (const path of paths) {
  const absolute = resolve(input.cwd ?? root, path);
  const target = relative(root, absolute);
  if (
    isAbsolute(target) ||
    target === '..' ||
    target.startsWith('../') ||
    target.startsWith('..\\')
  )
    continue;
  if (!existsSync(absolute)) continue;
  const result = spawnSync(
    process.execPath,
    [resolve(root, '.claude/hooks/lint-edited-file.mjs')],
    {
      cwd: root,
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      input: JSON.stringify({ tool_input: { file_path: absolute } }),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error || result.status !== 0) {
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.exitCode = 2;
  }
}

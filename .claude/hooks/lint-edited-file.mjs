// Claude Code PostToolUse hook: lint the file an agent just edited and block on errors.
// Exit code 2 sends stderr back to the agent so it fixes the root cause in the same turn.
import { ESLint } from 'eslint';
import { relative } from 'node:path';

const lintable = /\.(ts|tsx|js|mjs)$/;

const readStdin = async () => {
  let data = '';
  for await (const chunk of process.stdin) data += String(chunk);
  return data;
};

/** @returns {unknown} */
const parseInput = (raw) => {
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch {
    return undefined;
  }
};

const input = parseInput(await readStdin());
const filePath = input?.tool_input?.file_path;

if (typeof filePath !== 'string' || !lintable.test(filePath)) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const target = relative(cwd, filePath);
if (target.startsWith('..')) process.exit(0);

const eslint = new ESLint({ cwd });
if (await eslint.isPathIgnored(target)) process.exit(0);

const results = await eslint.lintFiles([target]);
const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
if (errorCount === 0) process.exit(0);

const formatter = await eslint.loadFormatter('stylish');
process.stderr.write(
  `ESLint found ${errorCount} error(s) in ${target}. Fix the cause the message points to; do not disable the rule.\n`,
);
process.stderr.write(await formatter.format(results));
process.exit(2);

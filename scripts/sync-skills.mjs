import { cp, mkdir, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, '.agents/skills');
const targets = ['.claude/skills', '.codex/skills'];
const check = process.argv.includes('--check');
if (process.argv.slice(2).some((arg) => arg !== '--check')) {
  throw new Error('Usage: node scripts/sync-skills.mjs [--check]');
}

async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are unsupported: ${relative}`);
    if (entry.isDirectory())
      result.push(...(await files(path.join(directory, entry.name), relative)));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

const sourceFiles = await files(source);
if (!sourceFiles.some((file) => path.basename(file) === 'SKILL.md')) {
  throw new Error('No source skills found in .agents/skills');
}
for (const destination of targets) {
  const target = path.join(root, destination);
  if (!check) await mkdir(target, { recursive: true });
  const targetFiles = await files(target).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  console.log(destination);
  let differences = 0;
  for (const file of sourceFiles) {
    const from = path.join(source, file);
    const to = path.join(target, file);
    const exists = targetFiles.includes(file);
    if (exists && (await readFile(from)).equals(await readFile(to))) continue;
    differences++;
    console.log(`${check ? 'Different' : 'Sync'}: ${file}`);
    if (!check) {
      await mkdir(path.dirname(to), { recursive: true });
      await cp(from, to);
    }
  }
  const extras = targetFiles.filter((file) => !sourceFiles.includes(file));
  for (const file of extras) console.error(`Destination-only file (preserved): ${file}`);
  if (extras.length || (check && differences)) process.exitCode = 1;
  console.log(
    `${differences} file(s) ${check ? 'different' : 'updated'}; ${extras.length} destination-only file(s).`,
  );
}

// Reads the ID prefixes that the STLC documents use (docs/testing/test-scopes/README.md#quy-ước).
// Used by check-test-scope-ids.mjs and by the testware lint rules in eslint.config.js.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const TEMPLATE_DIR = 'docs/testing/stlc-template';
export const SCOPES_DIR = 'docs/testing/test-scopes';
export const READINESS = '01-requirement-analysis/output/01-requirement-readiness.md';
export const PREFIX_HEADER = /^\|\s*Tiền tố\s*\|/;
const TEMPLATE_ID = /\b([A-Z][A-Z0-9]*)-(?:\d{2}|XX|xx)\b/g;

/** @param {string} dir @returns {string[]} */
export function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdown(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** Rows of the first table whose header matches, as arrays of trimmed cells. */
export function tableRows(/** @type {string[]} */ lines, /** @type {RegExp} */ header) {
  const start = lines.findIndex((line) => header.test(line));
  if (start === -1) return null;
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    rows.push(
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    );
  }
  return rows;
}

/** @returns {Map<string, string>} prefix -> first template file that uses it */
export function templatePrefixes() {
  const prefixes = new Map();
  for (const file of listMarkdown(TEMPLATE_DIR)) {
    for (const match of readFileSync(file, 'utf8').matchAll(TEMPLATE_ID)) {
      const prefix = match[1];
      if (prefix !== undefined && !prefixes.has(prefix)) prefixes.set(prefix, file);
    }
  }
  return prefixes;
}

/** Requirement ID prefixes declared in the "Tiền tố" table of every test scope. */
export function requirementPrefixes() {
  const prefixes = new Set();
  for (const entry of readdirSync(SCOPES_DIR, { withFileTypes: true })) {
    const file = join(SCOPES_DIR, entry.name, READINESS);
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const rows = tableRows(readFileSync(file, 'utf8').split(/\r?\n/), PREFIX_HEADER) ?? [];
    for (const [cell = ''] of rows) prefixes.add(cell.replaceAll('`', ''));
  }
  return prefixes;
}

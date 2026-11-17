// Checks the requirement IDs in each test scope (docs/testing/test-scopes/README.md#quy-ước):
// every prefix is declared in the prefix table of Requirement Readiness, no prefix is also
// an ID prefix of an STLC template, and no requirement ID occurs twice.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE_DIR = 'docs/testing/stlc-template';
const SCOPES_DIR = 'docs/testing/test-scopes';
const READINESS = '01-requirement-analysis/output/01-requirement-readiness.md';
const GUIDE = 'docs/testing/test-scopes/README.md#quy-ước';
const PREFIX_HEADER = /^\|\s*Tiền tố\s*\|/;
const STATUS_HEADER = /^\|\s*Requirement ID \/ version\s*\|/;
const TEMPLATE_ID = /\b([A-Z][A-Z0-9]*)-(?:\d{2}|XX|xx)\b/g;
const REQUIREMENT_ID = /^`?([A-Z][A-Z0-9]*)-(\d{2,}|\d+(?:\.\d+)+)`?\b/;

/** @param {string} dir @returns {string[]} */
function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdown(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

/** Rows of the first table whose header matches, as arrays of trimmed cells. */
function tableRows(/** @type {string[]} */ lines, /** @type {RegExp} */ header) {
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
function templatePrefixes() {
  const prefixes = new Map();
  for (const file of listMarkdown(TEMPLATE_DIR)) {
    for (const match of readFileSync(file, 'utf8').matchAll(TEMPLATE_ID)) {
      const prefix = match[1];
      if (prefix !== undefined && !prefixes.has(prefix)) prefixes.set(prefix, file);
    }
  }
  return prefixes;
}

/** @param {string} file @param {Map<string, string>} reserved @returns {string[]} */
function checkReadiness(file, reserved) {
  const errors = [];
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  const prefixRows = tableRows(lines, PREFIX_HEADER);
  if (prefixRows === null) {
    return [
      `${file}: no "| Tiền tố | Nhóm | Nguồn |" table. Declare every requirement ID prefix in this table, as in ${TEMPLATE_DIR}/${READINESS}. See ${GUIDE}.`,
    ];
  }
  const declared = new Set();
  for (const [cell = ''] of prefixRows) {
    const prefix = cell.replaceAll('`', '');
    if (declared.has(prefix)) errors.push(`${file}: prefix "${prefix}" is declared twice.`);
    declared.add(prefix);
    const template = reserved.get(prefix);
    if (template !== undefined) {
      errors.push(
        `${file}: prefix "${prefix}" is also an ID prefix in ${template}. Choose a prefix that no STLC template uses. See ${GUIDE}.`,
      );
    }
  }

  const statusRows = tableRows(lines, STATUS_HEADER) ?? [];
  const seen = new Set();
  for (const [cell = ''] of statusRows) {
    const match = REQUIREMENT_ID.exec(cell);
    if (match === null) {
      errors.push(`${file}: row "${cell.slice(0, 40)}" does not start with a requirement ID.`);
      continue;
    }
    const [id, prefix] = match;
    if (!declared.has(prefix)) {
      errors.push(
        `${file}: ${id} uses the undeclared prefix "${prefix}". Add it to the "Tiền tố" table with its group and source section.`,
      );
    }
    if (seen.has(id)) errors.push(`${file}: requirement ID ${id} occurs twice.`);
    seen.add(id);
  }
  return errors;
}

const reserved = templatePrefixes();
const errors = readdirSync(SCOPES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(SCOPES_DIR, entry.name, READINESS))
  .filter((file) => existsSync(file))
  .flatMap((file) => checkReadiness(file, reserved));

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

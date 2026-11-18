// Checks the requirement IDs in each test scope (docs/testing/test-scopes/README.md#quy-ước):
// every prefix is declared in the prefix table of Requirement Readiness, no prefix is also
// an ID prefix of an STLC template, and no requirement ID occurs twice.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  PREFIX_HEADER,
  READINESS,
  SCOPES_DIR,
  TEMPLATE_DIR,
  tableRows,
  templatePrefixes,
} from './test-scope-ids.mjs';

const GUIDE = 'docs/testing/test-scopes/README.md#quy-ước';
const STATUS_HEADER = /^\|\s*Requirement ID \/ version\s*\|/;
const REQUIREMENT_ID = /^`?([A-Z][A-Z0-9]*)-(\d{2,}|\d+(?:\.\d+)+)`?\b/;

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

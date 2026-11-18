// Checks three rules of the STLC documents that let a test pass when the product is wrong
// (docs/development/coding-guidelines.md#testware):
// 1. An expected result in Test Cases tells what the result is, not only what it is not
//    ("không phải 429" also passes for a 500).
// 2. Each mock, stub or driver in Test Environment that passed its readiness check was checked
//    once with the fault that the real event causes ("Kiểm bằng lỗi:" in the readiness check).
// 3. A review of dependency code that a test cannot replace (for example, the random source of
//    session tokens) is for the versions that pnpm-lock.yaml installs. The row "Dependency đã
//    review" of Implementation Status gives the versions that the review read.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCOPES_DIR, tableRows } from './test-scope-ids.mjs';

export const TEST_CASES = '03-design/output/04-test-cases.md';
export const ENVIRONMENT = '04-implementation/output/04-test-environment.md';
export const IMPLEMENTATION_STATUS = '04-implementation/output/01-implementation-status.md';
export const REVIEWED = 'Dependency đã review';
const LOCKFILE = resolve(import.meta.dirname, '..', 'pnpm-lock.yaml');
const GUIDE = 'docs/development/coding-guidelines.md#testware';
/** `better-auth@1.7.25`, `@better-auth/utils@0.5.1` */
const PACKAGE_VERSION = /`((?:@[\w.-]+\/)?[\w.-]+)@(\d+\.\d+\.\d+[\w.-]*)`/g;
/** A package key of the lockfile: `  better-auth@1.7.25:` or `  '@better-auth/utils@0.5.1':`. */
const LOCK_KEY = /^ {2}'?((?:@[\w.-]+\/)?[\w.-]+@[^'\s(:]+)/;

/** "không phải 429", "khác 200", "not 500": a status that the result must not have. */
const NEGATED_STATUS = /(?:không phải|không là|khác|\bnot)\s+`?[1-5]\d{2}\b/i;
const COMPONENT_HEADER = /^\|\s*Env ID\s*\|\s*Thành phần\s*\|/;
const READINESS_HEADER = /^\|\s*Env ID\s*\|\s*Cách kiểm tra\s*\|/;
export const FAULT_CHECK = 'Kiểm bằng lỗi:';

/**
 * Violations that existed when the check was added. Each one has a debt item in Implementation
 * Status. The check fails when a listed violation is gone, so that the list only gets shorter.
 */
/** @type {{ scope: string, key: string, debt: string }[]} */
export const KNOWN = [];

/**
 * @typedef {{ file: string, line: number, key: string, message: string }} Violation
 */

/** @param {string} file @param {string[]} lines @returns {Violation[]} */
export function negatedOracles(file, lines) {
  return lines.flatMap((text, index) => {
    if (!text.startsWith('|')) return [];
    const match = NEGATED_STATUS.exec(text);
    if (!match) return [];
    const key = text.slice(1).split('|')[0]?.trim() ?? '';
    return [
      {
        file,
        line: index + 1,
        key,
        message: `"${match[0]}" tells only what the result is not, so a test of it also passes for a 500 or a 404. Write the result that the request gets, e.g. "401" for a wrong password, with its source. See ${GUIDE}.`,
      },
    ];
  });
}

/** @param {string} file @param {string[]} lines @returns {Violation[]} */
export function uncheckedSimulations(file, lines) {
  const kinds = new Map(
    (tableRows(lines, COMPONENT_HEADER) ?? []).map((cells) => [cells[0], cells[3] ?? '']),
  );
  const start = lines.findIndex((text) => READINESS_HEADER.test(text));
  return (tableRows(lines, READINESS_HEADER) ?? []).flatMap((cells, index) => {
    const [id = '', check = '', result = ''] = cells.map((cell) => cell.normalize('NFC'));
    const kind = (kinds.get(id) ?? '').normalize('NFC');
    // "Thật (Docker)" is real; "Đạt (một phần)" still claims that the component is ready.
    if (kind === '' || kind.startsWith('Thật') || !result.startsWith('Đạt')) return [];
    if (check.includes(FAULT_CHECK)) return [];
    return [
      {
        file,
        line: start + 3 + index,
        key: id,
        message: `${id} is a ${kind} and passed its readiness check, but the check does not show that the ${kind} fails like the real component. A ${kind} that keeps the state the real event loses lets a test pass when the product is wrong. Break the behavior once (a mutant or a known defect), run the tests that use ${id}, and write "${FAULT_CHECK} <the fault>; <which test failed>" in the readiness check. If you did not do this, write "Không đạt". See ${GUIDE}.`,
      },
    ];
  });
}

/**
 * @param {string} file @param {string[]} lines @param {string} lockText
 * @returns {Violation[]}
 */
export function staleReviews(file, lines, lockText) {
  const installed = new Set(
    lockText.split(/\r?\n/).flatMap((text) => {
      const key = LOCK_KEY.exec(text)?.[1];
      return key ? [key] : [];
    }),
  );
  return lines.flatMap((text, index) => {
    const cells = text.split('|').map((cell) => cell.trim().normalize('NFC'));
    if (cells[1] !== REVIEWED) return [];
    const versions = [...(cells[2] ?? '').matchAll(PACKAGE_VERSION)].map(
      ([, name = '', version = '']) => `${name}@${version}`,
    );
    if (versions.length === 0) {
      if (cells[2]?.startsWith('Không có')) return [];
      return [
        {
          file,
          line: index + 1,
          key: REVIEWED,
          message: `The row "${REVIEWED}" gives no version. Write each package that the review read as \`name@version\`, e.g. \`better-auth@1.7.25\`. See ${GUIDE}.`,
        },
      ];
    }
    return versions
      .filter((version) => !installed.has(version))
      .map((version) => ({
        file,
        line: index + 1,
        key: version,
        message: `${version} is not in pnpm-lock.yaml. The review in this row read that version, so its result can be wrong for the installed version. Do the review again on the installed version (SR-05 and SR-06 of the Entry/Exit Criteria), then write the installed version in the row. See ${GUIDE}.`,
      }));
  });
}

/**
 * @param {string} scopesDir
 * @param {string} [lockText]
 * @param {{ scope: string, key: string, debt: string }[]} [knownList] violations to skip (KNOWN)
 * @returns {string[]}
 */
export function checkScopes(
  scopesDir,
  lockText = readFileSync(LOCKFILE, 'utf8'),
  knownList = KNOWN,
) {
  const errors = [];
  for (const entry of readdirSync(scopesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const scope = entry.name;
    const found = [];
    /** @type {[string, (file: string, lines: string[]) => Violation[]][]} */
    const checks = [
      [TEST_CASES, negatedOracles],
      [ENVIRONMENT, uncheckedSimulations],
      [IMPLEMENTATION_STATUS, (file, lines) => staleReviews(file, lines, lockText)],
    ];
    for (const [document, check] of checks) {
      const file = join(scopesDir, scope, document);
      if (!existsSync(file)) continue;
      found.push(...check(file, readFileSync(file, 'utf8').split(/\r?\n/)));
    }
    const known = knownList.filter((item) => item.scope === scope);
    for (const violation of found) {
      if (known.some((item) => item.key === violation.key)) continue;
      errors.push(`${violation.file}:${String(violation.line)}: ${violation.message}`);
    }
    for (const item of known) {
      if (found.some((violation) => violation.key === item.key)) continue;
      errors.push(
        `${scope}: "${item.key}" (${item.debt}) now follows the rule. Remove it from KNOWN in scripts/check-stlc-docs.mjs and close ${item.debt}.`,
      );
    }
  }
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const errors = checkScopes(SCOPES_DIR);
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exit(1);
}

// Checks four rules of the STLC documents that let a test pass when the product is wrong
// (docs/development/coding-guidelines.md#testware):
// 1. An expected result in Test Cases tells what the result is, not only what it is not
//    ("không phải 429" also passes for a 500).
// 2. Each mock, stub or driver in Test Environment that passed its readiness check was checked
//    once with the fault that the real event causes ("Kiểm bằng lỗi:" in the readiness check).
// 3. A review of dependency code that a test cannot replace (for example, the random source of
//    session tokens) is for the versions that pnpm-lock.yaml installs. The row "Dependency đã
//    review" of Implementation Status gives the versions that the review read.
// 4. The conclusion of Execution Readiness follows the definition of the template: "Sẵn sàng một
//    phần" needs RC-01 and RC-05 fully met, and "Sẵn sàng" needs every RC fully met.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCOPES_DIR, tableRows } from './test-scope-ids.mjs';

export const TEST_CASES = '03-design/output/04-test-cases.md';
export const ENVIRONMENT = '04-implementation/output/04-test-environment.md';
export const IMPLEMENTATION_STATUS = '04-implementation/output/01-implementation-status.md';
export const READINESS = '05-execution/input/01-execution-readiness.md';
export const EXECUTION_OUTPUTS = [
  '05-execution/output/01-execution-status.md',
  '05-execution/output/02-test-log.md',
  '05-execution/output/03-defect-reports.md',
];
export const REVIEWED = 'Dependency đã review';
const LOCKFILE = resolve(import.meta.dirname, '..', 'pnpm-lock.yaml');
const GUIDE = 'docs/development/coding-guidelines.md#testware';
/** `better-auth@1.7.25`, `@better-auth/utils@0.5.1` */
const PACKAGE_VERSION = /`((?:@[\w.-]+\/)?[\w.-]+)@(\d+\.\d+\.\d+[\w.-]*)`/g;
/** A package key of the lockfile: `  better-auth@1.7.25:` or `  '@better-auth/utils@0.5.1':`. */
const LOCK_KEY = /^ {2}'?((?:@[\w.-]+\/)?[\w.-]+@[^'\s(:]+)/;

/** "không phải 429", "khác 200", "not 500": a status that the result must not have. */
const NEGATED_STATUS = /(?:không phải|không là|khác|\bnot)\s+`?[1-5]\d{2}\b/i;
const RC_ROW = /^\|\s*(RC-\d+)\s*\|/;
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

/** "Đạt" with no "một phần" or "Không đạt" in the cell. @param {string} result */
const fullyMet = (result) => result.startsWith('Đạt') && !/một phần|Không đạt/.test(result);

/**
 * Results of the RC rows in Execution Readiness. @param {string[]} lines
 * @returns {Map<string, string>}
 */
export function readinessResults(lines) {
  return new Map(
    lines.flatMap((text) => {
      const id = RC_ROW.exec(text)?.[1];
      return id ? [[id, (text.split('|')[4] ?? '').normalize('NFC').trim()]] : [];
    }),
  );
}

/**
 * A criterion of a Phase 05 output that is "Đạt" while an RC in its input column is not fully
 * met. The template says: when the input condition is not met, the criterion is not met.
 * @param {string} file @param {string[]} lines @param {Map<string, string>} rc
 * @returns {Violation[]}
 */
export function criteriaWithUnmetInput(file, lines, rc) {
  return lines.flatMap((text, index) => {
    const cells = text.split('|').map((cell) => cell.normalize('NFC').trim());
    const id = cells[1] ?? '';
    if (!/^Q\d-\d+$/.test(id) || !fullyMet(cells[4] ?? '')) return [];
    const unmet = [...(cells[3] ?? '').matchAll(/RC-\d+/g)]
      .map(([ref]) => ref)
      .filter((ref) => rc.has(ref) && !fullyMet(rc.get(ref) ?? ''));
    if (unmet.length === 0) return [];
    return [
      {
        file,
        line: index + 1,
        key: id,
        message: `${id} is "Đạt", but its input condition ${unmet.join(', ')} is not fully met in Execution Readiness. The template says a criterion is not met when its input condition is not met. Write "Đạt một phần" or "Không đạt" with the part that the input condition affects, or make ${unmet.join(', ')} met with a source. See docs/testing/stlc-template/05-execution/README.md.`,
      },
    ];
  });
}

/** @param {string} file @param {string[]} lines @returns {Violation[]} */
export function readinessConclusion(file, lines) {
  const at = lines.findIndex((text) => text.startsWith('**Trạng thái:**'));
  if (at < 0) return [];
  const conclusion = (lines[at] ?? '')
    .replace('**Trạng thái:**', '')
    .normalize('NFC')
    .trim()
    .replace(/[.\s]+$/, '');
  const partial = conclusion === 'Sẵn sàng một phần';
  if (!partial && conclusion !== 'Sẵn sàng') return [];
  const needed = partial ? ['RC-01', 'RC-05'] : null;
  return lines.flatMap((text) => {
    const id = RC_ROW.exec(text)?.[1];
    if (!id || (needed && !needed.includes(id))) return [];
    const result = (text.split('|')[4] ?? '').normalize('NFC').trim();
    if (fullyMet(result) || result.startsWith('N/A')) return [];
    return [
      {
        file,
        line: lines.indexOf(text) + 1,
        key: id,
        message: `The conclusion is "${conclusion}", but ${id} is not fully met ("${result.slice(0, 40)}"). The template gives "Sẵn sàng một phần" only when RC-01 and RC-05 are met, and "Sẵn sàng" only when every RC is met. Write "Chưa sẵn sàng", or make ${id} met with a source. See docs/testing/stlc-template/05-execution/input/01-execution-readiness.md section 4.`,
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
      [READINESS, readinessConclusion],
    ];
    for (const [document, check] of checks) {
      const file = join(scopesDir, scope, document);
      if (!existsSync(file)) continue;
      found.push(...check(file, readFileSync(file, 'utf8').split(/\r?\n/)));
    }
    const readiness = join(scopesDir, scope, READINESS);
    if (existsSync(readiness)) {
      const rc = readinessResults(readFileSync(readiness, 'utf8').split(/\r?\n/));
      for (const document of EXECUTION_OUTPUTS) {
        const file = join(scopesDir, scope, document);
        if (!existsSync(file)) continue;
        found.push(...criteriaWithUnmetInput(file, readFileSync(file, 'utf8').split(/\r?\n/), rc));
      }
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

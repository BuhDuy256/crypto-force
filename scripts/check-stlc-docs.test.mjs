// Tests of scripts/check-stlc-docs.mjs. The bad rows come from the TS-001 documents before the
// test quality audit. Run with `pnpm check:stlc`.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import {
  ENVIRONMENT,
  IMPLEMENTATION_STATUS,
  REPORT_PHASE,
  REPORT_READINESS,
  TEST_CASES,
  checkScopes,
  criteriaWithUnmetInput,
  negatedOracles,
  readinessConclusion,
  readinessResults,
  staleReviews,
  textAboveTitle,
  uncheckedSimulations,
} from './check-stlc-docs.mjs';

const componentHeader = [
  '| Env ID | Thành phần | Version / cấu hình thực tế | Loại | Hành vi | Dựng và reset | Nơi truy cập | Owner |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
];
const readinessHeader = [
  '| Env ID | Cách kiểm tra | Kết quả | Evidence / ngày |',
  '| --- | --- | --- | --- |',
];
const restartDriver =
  '| ENV-10 | Khởi động lại API | `createHarness()` lần hai | Driver | Mô phỏng: process API mới với bộ nhớ trống | Không cần reset | Trong process test | Agent |';
const database =
  '| ENV-01 | PostgreSQL | PostgreSQL 17.10 | Thật | N/A | Tạo lại mỗi lần chạy | localhost | Agent |';

const mailerStub =
  '| ENV-03 | Mailer | Mailer ghi vào bộ nhớ | Stub | Ghi email thay vì gửi | Xóa mỗi test | Trong process test | Agent |';
const mailerCheck = '| ENV-03 | Test đọc được email đã gửi | Đạt | VF-02 |';
const lock = ['  better-auth@1.7.25:', "  '@better-auth/utils@0.5.1':", '  zod@4.6.7:'].join('\n');
/** @param {string} versions */
const reviewed = (versions) => [
  '| Trường | Nội dung |',
  '| --- | --- |',
  `| Dependency đã review | ${versions}. Nội dung đã review: nguồn ngẫu nhiên của token phiên |`,
];

/** @param {string[]} components @param {string[]} checks */
const environment = (components, checks) => [
  ...componentHeader,
  ...components,
  '',
  ...readinessHeader,
  ...checks,
];

test('a negated status as the definition of an accepted request (Test Cases before the audit)', () => {
  const lines = ['| Request được chấp nhận | Response không phải 429 |'];
  const [violation] = negatedOracles('cases.md', lines);
  assert.equal(violation?.key, 'Request được chấp nhận');
  assert.match(violation?.message ?? '', /"không phải 429" tells only what the result is not/);
});

test('negated statuses in other words', () => {
  for (const cell of ['status khác 200', 'not 500', 'không là `404`']) {
    assert.equal(negatedOracles('cases.md', [`| TC-001; v1 | ${cell} |`]).length, 1, cell);
  }
});

test('an exact status and a negated non-status pass', () => {
  const lines = [
    '| TC-001; v1 | `t`=0: 401. `t`=3: 429, `X-Retry-After: 9`. `t`=5: không tạo phiên |',
    '| TC-033; v1 | Token cũ không còn được chấp nhận; khác 2 phiên trước |',
    'Ghi chú: response không phải 429 ở đoạn văn không nằm trong bảng.',
  ];
  assert.deepEqual(negatedOracles('cases.md', lines), []);
});

test('a restart driver that passed with no fault check (ENV-10 before the audit)', () => {
  const lines = environment(
    [restartDriver],
    ['| ENV-10 | TC-005 tạo instance mới và đọc được bộ đếm từ database | Đạt | VF-02 |'],
  );
  const [violation] = uncheckedSimulations('env.md', lines);
  assert.equal(violation?.key, 'ENV-10');
  assert.equal(violation?.line, 7);
  assert.match(violation?.message ?? '', /ENV-10 is a Driver and passed its readiness check/);
});

test('a driver with a fault check, a failed check and a real component pass', () => {
  const lines = environment(
    [restartDriver, database],
    [
      '| ENV-10 | Kiểm bằng lỗi: mutant M3 để bộ đếm trong bộ nhớ; TC-005 fail | Đạt | VF-10 |',
      '| ENV-01 | Smoke pass | Đạt | VF-02 |',
    ],
  );
  assert.deepEqual(uncheckedSimulations('env.md', lines), []);
  const notReady = environment([restartDriver], ['| ENV-10 | Chưa kiểm | Không đạt | — |']);
  assert.deepEqual(uncheckedSimulations('env.md', notReady), []);
});

/** @param {Record<string, string[]>} files @returns {string} */
function scopesWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'stlc-docs-'));
  for (const [path, lines] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, lines.join('\n'));
  }
  return root;
}

// The known list of these tests, so that they do not depend on the real KNOWN list.
const knownList = [{ scope: 'TS-001-auth', key: 'ENV-03', debt: 'TD-99' }];

test('a new violation fails, and a known violation is skipped', () => {
  const root = scopesWith({
    // The definition before CH-07 was fixed. It is not in the known list, so it fails.
    [join('TS-001-auth', TEST_CASES)]: ['| Request được chấp nhận | Response không phải 429 |'],
    [join('TS-001-auth', ENVIRONMENT)]: environment([mailerStub], [mailerCheck]),
  });
  const errors = checkScopes(root, lock, knownList);
  assert.equal(errors.filter((error) => error.includes('"không phải 429"')).length, 1);
  assert.equal(errors.filter((error) => error.includes('ENV-03 is a Stub')).length, 0);
});

test('a known violation that was fixed must leave the list', () => {
  const root = scopesWith({
    [join('TS-001-auth', ENVIRONMENT)]: [],
  });
  const errors = checkScopes(root, lock, knownList);
  assert.ok(errors.some((error) => error.includes('"ENV-03" (TD-99) now follows')));
});

test('a partial pass and a real component with a note', () => {
  const lines = environment(
    [restartDriver, database.replace('| Thật |', '| Thật (Docker) |')],
    [
      '| ENV-10 | TC-005 đọc được bộ đếm | Đạt (một phần) | VF-02 |',
      '| ENV-01 | Smoke pass | Đạt | VF-02 |',
    ],
  );
  assert.deepEqual(
    uncheckedSimulations('env.md', lines).map((violation) => violation.key),
    ['ENV-10'],
  );
});

test('decomposed Vietnamese text (NFD) is read like composed text', () => {
  const lines = environment(
    [restartDriver],
    ['| ENV-10 | TC-005 đọc được bộ đếm | Đạt | VF-02 |'.normalize('NFD')],
  );
  assert.equal(uncheckedSimulations('env.md', lines).length, 1);
});

test('a review of the installed dependency versions passes', () => {
  const lines = reviewed('`better-auth@1.7.25`, `@better-auth/utils@0.5.1`');
  assert.deepEqual(staleReviews('status.md', lines, lock), []);
});

test('a review of a version that the lockfile no longer has fails', () => {
  const upgraded = lock.replace('better-auth@1.7.25', 'better-auth@1.8.0');
  const lines = reviewed('`better-auth@1.7.25`, `@better-auth/utils@0.5.1`');
  const violations = staleReviews('status.md', lines, upgraded);
  assert.deepEqual(
    violations.map((violation) => [violation.key, violation.line]),
    [['better-auth@1.7.25', 3]],
  );
  assert.match(violations[0]?.message ?? '', /better-auth@1\.7\.25 is not in pnpm-lock\.yaml/);
});

test('a scoped package name, a row with no version, and a scope with no review', () => {
  const upgraded = lock.replace('@better-auth/utils@0.5.1', '@better-auth/utils@0.6.0');
  const lines = reviewed('`@better-auth/utils@0.5.1`');
  assert.equal(staleReviews('status.md', lines, upgraded)[0]?.key, '@better-auth/utils@0.5.1');
  assert.equal(staleReviews('status.md', reviewed('chưa có'), lock).length, 1);
  assert.deepEqual(staleReviews('status.md', reviewed('Không có'), lock), []);
});

test('the scope check reads the review row of Implementation Status', () => {
  const root = scopesWith({
    [join('TS-001-auth', IMPLEMENTATION_STATUS)]: reviewed('`better-auth@1.7.24`'),
    [join('TS-001-auth', ENVIRONMENT)]: environment([mailerStub], [mailerCheck]),
  });
  const errors = checkScopes(root, lock);
  assert.ok(errors.some((error) => error.includes('better-auth@1.7.24 is not in pnpm-lock.yaml')));
});

// The first version of the TS-001 Execution Readiness: RC-05 "Đạt một phần" with the conclusion
// "Sẵn sàng một phần". The template needs RC-01 and RC-05 met for that conclusion.
test('readiness: "Sẵn sàng một phần" with RC-05 only partly met fails', () => {
  const lines = [
    '| RC-01 | Build đã xác định | IN-01 | Đạt | |',
    '| RC-05 | Quy ước ghi kết quả đã thống nhất | IN-08 | Đạt một phần: thiếu priority | |',
    '**Trạng thái:** Sẵn sàng một phần.',
  ];
  const found = readinessConclusion('readiness.md', lines);
  assert.deepEqual(
    found.map((violation) => violation.key),
    ['RC-05'],
  );
  assert.match(found[0]?.message ?? '', /Chưa sẵn sàng/);
});

test('readiness: "Chưa sẵn sàng", or RC-01 and RC-05 met, passes', () => {
  const rows = [
    '| RC-01 | Build | IN-01 | Đạt: commit ghi | |',
    '| RC-03 | Môi trường | IN-06 | Đạt một phần | |',
    '| RC-05 | Quy ước | IN-08 | Đạt | |',
  ];
  assert.deepEqual(readinessConclusion('r.md', [...rows, '**Trạng thái:** Chưa sẵn sàng.']), []);
  assert.deepEqual(
    readinessConclusion('r.md', [...rows, '**Trạng thái:** Sẵn sàng một phần.']),
    [],
  );
});

test('readiness: "Sẵn sàng" needs every RC met', () => {
  const rows = [
    '| RC-01 | Build | IN-01 | Đạt | |',
    '| RC-04 | Instance | IN-03 | Đạt một phần | |',
  ];
  const found = readinessConclusion('r.md', [...rows, '**Trạng thái:** Sẵn sàng']);
  assert.deepEqual(
    found.map((violation) => violation.key),
    ['RC-04'],
  );
});

// Q2-01 of the TS-001 Test Log was "Đạt" while its input RC-05 was "Đạt một phần".
test('criteria: "Đạt" with an input RC that is only partly met fails', () => {
  const rc = readinessResults([
    '| RC-01 | Build | IN-01 | Đạt | |',
    '| RC-05 | Quy ước | IN-08 | Đạt một phần: thiếu priority | |',
  ]);
  const lines = [
    '| Q2-01 | Mỗi lượt chạy xác định instance | RC-05 | Đạt |',
    '| Q2-03 | Build khớp | RC-01 | Đạt |',
    '| Q2-04 | Có phân tích | RC-05 | Đạt một phần: thiếu priority |',
  ];
  assert.deepEqual(
    criteriaWithUnmetInput('log.md', lines, rc).map((violation) => violation.key),
    ['Q2-01'],
  );
});

// Phase 06 Reporting Readiness: "Sẵn sàng một phần" needs RC-01 and RC-02, not RC-05.
test('report readiness: "Sẵn sàng một phần" needs RC-01 and RC-02 met', () => {
  const rows = [
    '| RC-01 | Đối tượng | IN-01 | Đạt | |',
    '| RC-02 | Kết quả đúng đối tượng | IN-06 | Đạt một phần: working tree chưa kiểm | |',
    '| RC-05 | Đơn vị đếm | IN-06 | Đạt một phần | |',
  ];
  const found = readinessConclusion(
    'report.md',
    [...rows, '**Trạng thái:** Sẵn sàng một phần'],
    REPORT_PHASE,
  );
  assert.deepEqual(
    found.map((violation) => violation.key),
    ['RC-02'],
  );
  assert.match(found[0]?.message ?? '', /RC-01 and RC-02/);
  assert.deepEqual(
    readinessConclusion('report.md', [...rows, '**Trạng thái:** Chưa sẵn sàng'], REPORT_PHASE),
    [],
  );
});

test('criteria: an input range "RC-01 → RC-05" reviews the RC rows and does not depend on them', () => {
  const rc = readinessResults(['| RC-05 | Đơn vị đếm | IN-06 | Đạt một phần | |']);
  const lines = [
    '| Q4-02 | Mọi điều kiện không đạt đã được xem xét | IN-01 → IN-13, RC-01 → RC-05 | Đạt |',
    '| Q1-05 | Số liệu khớp | RC-05 | Đạt |',
    '| Q2-03 | Tỷ lệ có mẫu số | IN-06 → IN-08, RC-05 | Đạt |',
  ];
  const found = criteriaWithUnmetInput('summary.md', lines, rc, REPORT_PHASE);
  assert.deepEqual(
    found.map((violation) => violation.key),
    ['Q1-05', 'Q2-03'],
  );
  assert.match(found[0]?.message ?? '', /06-report\/input\/01-reporting-readiness\.md/);
  assert.match(found[0]?.message ?? '', /stlc-template\/06-report\/README\.md/);
});

// The TS-001 Execution Status at ce5e35c: three table rows were added above the title.
test('a scope file with text above its title fails', () => {
  const broken = [
    '| TD-23 | Đã xử lý ngày 2026-11-19 || TD-22 | Đã xử lý |# Test Execution Status',
    '',
  ];
  assert.deepEqual(
    textAboveTitle('status.md', broken, 'status.md').map((violation) => violation.line),
    [1],
  );
  // A blank first line: the title was deleted with the rows above it.
  assert.equal(textAboveTitle('status.md', ['', '# Test Execution Status'], 's').length, 1);
  assert.deepEqual(textAboveTitle('status.md', ['# Test Execution Status', ''], 's'), []);
});

test('the scope check reads the Phase 06 readiness and every Markdown file of a scope', () => {
  const root = mkdtempSync(join(tmpdir(), 'stlc-'));
  const readiness = join(root, 'TS-900', REPORT_READINESS);
  mkdirSync(dirname(readiness), { recursive: true });
  writeFileSync(
    readiness,
    [
      '# Test Summary: Readiness',
      '| RC-01 | Đối tượng | IN-01 | Đạt | |',
      '| RC-02 | Kết quả | IN-06 | Không đạt | |',
      '**Trạng thái:** Sẵn sàng một phần',
    ].join('\n'),
  );
  const nested = join(root, 'TS-900', '06-report', 'output', '04-residual-risks.md');
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(nested, 'Text\n# Residual Risks\n| Q4-04 | Có owner | RC-02 | Đạt |\n');
  const errors = checkScopes(root, '', []).join('\n');
  assert.match(errors, /RC-02 is not fully met/);
  assert.match(errors, /04-residual-risks\.md:1: The first line is not a "# " title/);
  assert.match(errors, /04-residual-risks\.md:3: Q4-04 is "Đạt"/);
  assert.equal(errors.split('\n').length, 3);
});

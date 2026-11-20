// Tests of scripts/check-docs.mjs. Each rule has a case that must fail and a case that must pass.
// Bad inputs come from real mistakes where one exists: the broken docs/README.md link after
// docs/requirements moved, the "hết hạn theo RP-05" sentence, an unused References entry.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  anchors,
  checkCodeLinks,
  checkCodeTrace,
  checkFile,
  checkRetainedIds,
  checkTestTrace,
  slug,
  useCaseIds,
} from './check-docs.mjs';

const UC = 'docs/UCs/example.md';
const files = new Map([
  ['docs/conventions/docs.md', '# Documentation Conventions\n\n## ID\n'],
  ['docs/UCs/README.md', '# Use Cases\n'],
]);
const io = {
  exists: (/** @type {string} */ path) => files.has(path.split('\\').join('/')),
  read: (/** @type {string} */ path) => files.get(path.split('\\').join('/')) ?? '',
};
const messages = (/** @type {string} */ file, /** @type {string} */ text) =>
  checkFile(file, text, io).map((problem) => problem.message);
const has = (/** @type {string[]} */ list, /** @type {RegExp} */ pattern) =>
  list.some((message) => pattern.test(message));

const prefixTable = [
  '| Tiền tố | Nhóm | Nguồn |',
  '| --- | --- | --- |',
  '| `RP` | Reset password | Product owner |',
  '',
];
const ruleHeader = [
  '| ID | Rule | Giá trị | Đo tại | Nguồn | Trạng thái |',
  '| --- | --- | --- | --- | --- | --- |',
];
const gap = [
  '## Gap analysis',
  '',
  '| ID | Gap | Baseline | Quyết định | Trạng thái |',
  '| --- | --- | --- | --- | --- |',
  '| RP-90 | Không có MFA | ASVS 6.3.3 | Chấp nhận rủi ro | Accepted |',
  '',
];
const diagram = [
  '```mermaid',
  'sequenceDiagram',
  '    actor K as Khách',
  '    participant S as Crypto Force',
  '    K->>S: Send reset link',
  '```',
  '',
];
/** A use case file that passes every rule, with extra lines in place of the rule table rows. */
const useCase = (/** @type {string[]} */ rows, /** @type {string[]} */ extra = []) =>
  [
    '# Example',
    '',
    'Đọc file này để biết ví dụ.',
    '',
    '## Tổng quan',
    '',
    ...prefixTable,
    ...diagram,
    '## Reset password',
    '',
    ...ruleHeader,
    ...rows,
    '',
    ...extra,
    ...gap,
  ].join('\n');
const goodRow =
  '| RP-04 | Link reset hết hiệu lực | 3.600 giây | Từ lúc gửi email tới lúc mở link | Product owner | Confirmed |';

test('slug follows GitHub: lower case, punctuation dropped, one hyphen per space', () => {
  assert.equal(
    slug('Frontend: React, Router và server state'),
    'frontend-react-router-và-server-state',
  );
  assert.equal(slug('Giá trị cụ thể có nguồn'), 'giá-trị-cụ-thể-có-nguồn');
  assert.ok(anchors('## A\n## A\n<a id="ref-1"></a>').has('a-1'));
});

test('a valid use case file has no problem', () => {
  assert.deepEqual(messages(UC, useCase([goodRow])), []);
});

test('broken relative link fails (docs/README.md after docs/requirements moved)', () => {
  const text =
    '# Docs\n\nĐọc file này để biết.\n\n| [requirements/](requirements/README.md) | x |\n';
  assert.ok(has(messages('docs/README.md', text), /does not exist/));
  assert.ok(
    !has(
      messages('docs/README.md', text.replace('requirements/README.md', 'UCs/README.md')),
      /does not exist/,
    ),
  );
});

test('link to a missing heading fails', () => {
  assert.ok(
    has(messages('docs/x.md', '# X\n\n[ID](conventions/docs.md#không-có)\n'), /no heading/),
  );
  assert.ok(!has(messages('docs/x.md', '# X\n\n[ID](conventions/docs.md#id)\n'), /no heading/));
});

test('citation without entry and entry without citation fail', () => {
  const cited =
    '# A\n\nĐọc file này để biết A.\n\nCâu [[1]](#ref-1).\n\n## References\n\n1. <a id="ref-1"></a>[B](../UCs/README.md)\n';
  assert.deepEqual(
    messages('docs/architecture/a.md', cited).filter((m) => /ref-/.test(m)),
    [],
  );
  assert.ok(
    has(
      messages('docs/architecture/a.md', cited.replace('Câu [[1]](#ref-1).', 'Câu.')),
      /not cited/,
    ),
  );
  assert.ok(
    has(
      messages('docs/architecture/a.md', cited.replace('<a id="ref-1"></a>', '')),
      /has no entry/,
    ),
  );
  assert.ok(
    has(
      messages('docs/architecture/a.md', cited.replace('## References', '## References\n\n## Sau')),
      /not the last section/,
    ),
  );
});

test('missing purpose line fails in structured folders', () => {
  assert.ok(has(messages('docs/conventions/x.md', '# X\n\nQuy tắc.\n'), /purpose line/));
  assert.ok(
    !has(
      messages('docs/conventions/x.md', '# X\n\nĐọc file này để biết quy tắc.\n'),
      /purpose line/,
    ),
  );
});

test('an ID as the object of "theo" fails ("hết hạn theo RP-05")', () => {
  assert.ok(
    has(
      messages(UC, useCase([goodRow], ['Link reset hết hạn theo RP-04.', ''])),
      /uses an ID as the object/,
    ),
  );
  assert.ok(
    !has(
      messages(UC, useCase([goodRow], ['Link reset hết hạn sau thời hạn hiệu lực (RP-04).', ''])),
      /as the object/,
    ),
  );
});

test('a cell with only an ID outside the ID column fails', () => {
  const row =
    '| RP-04 | Link reset hết hiệu lực | 3.600 giây | Từ lúc gửi email | RP-01 | Confirmed |';
  assert.ok(has(messages(UC, useCase([row])), /has only an ID/));
});

test('rule row without source, with a value without number, or without a measure point fails', () => {
  assert.ok(
    has(messages(UC, useCase([goodRow.replace('| Product owner |', '| — |')])), /no source/),
  );
  assert.ok(
    has(messages(UC, useCase([goodRow.replace('3.600 giây', 'một giờ')])), /has no number/),
  );
  assert.ok(
    has(
      messages(UC, useCase([goodRow.replace('Từ lúc gửi email tới lúc mở link', '—')])),
      /"Đo tại" is empty/,
    ),
  );
  assert.ok(
    has(
      messages(UC, useCase([goodRow.replace('Confirmed', 'Done')])),
      /not Confirmed, Inferred, Proposed or Dropped/,
    ),
  );
});

test('a dropped rule keeps its row with the status Dropped', () => {
  const row = goodRow.replace('Confirmed', 'Dropped (product owner bỏ rule, 2026-11-20)');
  assert.ok(!has(messages(UC, useCase([row])), /not Confirmed/));
});

test('vague term in a rule fails', () => {
  const row = '| RP-04 | Link reset hết hiệu lực nhanh | — | — | Product owner | Confirmed |';
  assert.ok(has(messages(UC, useCase([row])), /vague term "nhanh"/));
  assert.ok(!has(messages(UC, useCase([goodRow])), /vague/));
});

test('undeclared prefix and duplicate ID fail', () => {
  assert.ok(
    has(messages(UC, useCase([goodRow.replace('RP-04', 'XX-04')])), /not in the prefix table/),
  );
  assert.ok(has(messages(UC, useCase([goodRow, goodRow])), /defined twice/));
});

test('use case file without gap analysis, prefix table or sequence diagram fails', () => {
  const full = useCase([goodRow]);
  assert.ok(has(messages(UC, full.replace('## Gap analysis', '## Khác')), /No "## Gap analysis"/));
  assert.ok(
    has(
      messages(UC, full.replace('| Tiền tố | Nhóm | Nguồn |', '| Nhóm | Tên | Nguồn |')),
      /No prefix table/,
    ),
  );
  assert.ok(
    has(messages(UC, full.replace('sequenceDiagram', 'flowchart LR')), /No sequenceDiagram/),
  );
});

test('internal part in a use case diagram fails', () => {
  const full = useCase([goodRow]).replace(
    '    K->>S: Send reset link',
    '    K->>S: POST /api/auth/request-password-reset\n    S->>DB: Lưu token',
  );
  assert.ok(has(messages(UC, full), /internal part/));
});

test('quality attribute measure without a number fails', () => {
  const table = [
    '# QA',
    '',
    'Đọc file này để biết QA.',
    '',
    '| ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  const row =
    '| QA-05 | Binance | Candle mới | Bình thường | Market data | Màn hình cập nhật | Dưới 1 giây | Đề bài | Proposed |';
  assert.deepEqual(messages('docs/UCs/quality-attributes.md', [...table, row].join('\n')), []);
  assert.ok(
    has(
      messages(
        'docs/UCs/quality-attributes.md',
        [...table, row.replace('Dưới 1 giây', 'Độ trễ thấp')].join('\n'),
      ),
      /"Số đo" has no number/,
    ),
  );
});

test('architecture file with content but no Drivers fails', () => {
  const text = '# Security\n\nĐọc file này để biết bảo mật.\n\n## Quyết định\n\nCookie HttpOnly.\n';
  assert.ok(has(messages('docs/architecture/23-security.md', text), /no "## Drivers"/));
  assert.ok(
    !has(
      messages('docs/architecture/23-security.md', text.replace('## Quyết định', '## Drivers')),
      /Drivers/,
    ),
  );
});

test('a convention path in a lint message must exist (old coding-guidelines path)', () => {
  const old = "const testwareDoc = 'See docs/development/coding-guidelines.md#testware.';";
  assert.equal(checkCodeLinks('eslint.config.js', old, io.exists, io.read).length, 1);
  assert.equal(
    checkCodeLinks('eslint.config.js', "'See docs/conventions/docs.md#id.'", io.exists, io.read)
      .length,
    0,
  );
});

test('a rule table without "Giá trị" fails, and a status with extra text after the word fails', () => {
  const row = '| RP-04 | Link reset hết hiệu lực | Product owner | Confirmed |';
  const noValue = useCase([]).replace(
    ruleHeader.join('\n'),
    '| ID | Rule | Nguồn | Trạng thái |\n| --- | --- | --- | --- |\n' + row,
  );
  assert.ok(has(messages(UC, noValue), /no column "Giá trị"/));
  assert.ok(
    has(
      messages(UC, useCase([goodRow.replace('Confirmed', 'Confirmed?')])),
      /not Confirmed, Inferred, Proposed or Dropped/,
    ),
  );
  assert.ok(
    !has(
      messages(
        UC,
        useCase([goodRow.replace('Confirmed', 'Confirmed (theo ủy quyền của product owner)')]),
      ),
      /not Confirmed/,
    ),
  );
});

test('Binance API in a use case diagram is allowed; "chậm nhất" is not a vague term', () => {
  const full = useCase([goodRow]).replace(
    '    K->>S: Send reset link',
    '    participant B as Binance API\n    B->>S: Candle mới',
  );
  assert.ok(!has(messages(UC, full), /internal part/));
  const row =
    '| RP-04 | Link reset hết hiệu lực chậm nhất sau thời hạn | 3.600 giây | Từ lúc gửi email | Product owner | Confirmed |';
  assert.ok(!has(messages(UC, useCase([row])), /vague/));
});

test('a malformed % escape in a link gives a message, not a crash', () => {
  assert.ok(has(messages('docs/x.md', '# X\n\n[a](b%zz.md)\n'), /malformed % escape/));
});

const ids = useCaseIds(
  new Map([
    [
      'docs/UCs/authentication.md',
      '| ID | Rule |\n| --- | --- |\n| SS-05 | Thời hạn tuyệt đối |\n| SI-06 | Giới hạn Sign in |\n| ASVS-7.2.3 | Token |\n',
    ],
  ]),
);

test('previously committed rule IDs survive a merge or a move between use case files', () => {
  const baseline = new Map([[UC, new Set(['CM-04', 'CM-05', 'CM-06', 'RP-09'])]]);
  const removed = new Map([[UC, new Set(['SI-02', 'RP-04', 'SEC-07'])]]);
  assert.deepEqual(
    checkRetainedIds(removed, baseline).map((problem) => problem.message.split(' ')[3]),
    ['CM-04', 'CM-05', 'CM-06', 'RP-09'],
  );
  assert.deepEqual(checkRetainedIds(new Map(), baseline).length, 4);
  const moved = new Map([['docs/UCs/another.md', new Set(['CM-04', 'CM-05', 'CM-06', 'RP-09'])]]);
  assert.deepEqual(checkRetainedIds(moved, baseline), []);
});

test('a code comment that cites a missing rule ID or a bare document name fails', () => {
  const old = '/** A session ends after 30 days (security.md, sessions). */';
  assert.ok(checkCodeTrace('auth.ts', old, ids).some((p) => /without its path/.test(p.message)));
  const wrong = '/** A session ends after 30 days (docs/UCs/authentication.md, SS-09). */';
  assert.ok(
    checkCodeTrace('auth.ts', wrong, ids).some((p) => /SS-09 is not defined/.test(p.message)),
  );
  const good = '/** A session ends after 30 days (docs/UCs/authentication.md, SS-05). */';
  assert.deepEqual(checkCodeTrace('auth.ts', good, ids), []);
  const wrapped =
    '// limit is accepted (docs/UCs/authentication.md,\n// SS-09): store the end earlier.';
  assert.ok(checkCodeTrace('auth.ts', wrapped, ids).some((p) => /SS-09/.test(p.message)));
});

test('a test condition that points to a requirement ID missing from docs/UCs fails', () => {
  const header =
    '| Condition ID | Test basis item / version | Điều cần kiểm tra |\n| --- | --- | --- |\n';
  const missing = `${header}| COND-01 | SI-09; \`705a1ad\` | Dùng trực tiếp |\n`;
  assert.ok(
    checkTestTrace('c.md', missing, ids).some((p) => /SI-09 is not defined/.test(p.message)),
  );
  const present = `${header}| COND-01 | SI-06; \`705a1ad\` | Dùng trực tiếp |\n| COND-02 | ASVS-7.2.3 | x |\n`;
  assert.deepEqual(checkTestTrace('c.md', present, ids), []);
  const otherPrefix = `${header}| COND-03 | PR-01 | Rủi ro |\n`;
  assert.deepEqual(checkTestTrace('c.md', otherPrefix, ids), []);
});

// Checks the documentation conventions that a machine can check (docs/conventions/docs.md,
// docs/conventions/use-cases.md, docs/conventions/architecture.md, docs/conventions/mermaid.md).
// Each message tells the fix and links to the convention. Run with `pnpm check:docs`.
// The Claude hook .claude/hooks/lint-edited-file.mjs runs checkFile on each edited docs/**/*.md.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DOCS = 'docs/conventions/docs.md';
const USE_CASES = 'docs/conventions/use-cases.md';
const ARCHITECTURE = 'docs/conventions/architecture.md';
const MERMAID = 'docs/conventions/mermaid.md';

/** Folders that are not documentation written by the team (generated, vendored or raw evidence). */
const SKIPPED = [
  /^docs\/build\//,
  /\/evidence\//,
  /^docs\/design\/prototype\/(vendor|assets)\//,
  // Templates hold placeholders such as [[n]](#ref-n); check:stlc checks them.
  /^docs\/testing\/stlc-template\//,
];
/** Folders where the structure rules apply (title line, purpose line, ID rules). */
const STRUCTURED = /^docs\/(UCs|architecture|conventions|knowledge)\//;
const UC_DIR = /^docs\/UCs\/(?!sources\/)/;
const ARCH_DIR = /^docs\/architecture\//;

const ID = String.raw`[A-Z][A-Z0-9]{0,5}-\d{2,3}`;
const ID_ONLY_CELL = new RegExp(String.raw`^\`?${ID}\`?(\s*,\s*\`?${ID}\`?)*$`);
const ID_AS_OBJECT = new RegExp(
  String.raw`(?<![\p{L}])(theo|xem)\s+` + '`?' + ID + String.raw`\b`,
  'giu',
);
const PURPOSE = /^Đọc file này (để biết|để|giúp) /;
const STATUSES = ['Confirmed', 'Inferred', 'Proposed', 'Dropped'];
const GAP_STATUSES = ['Closed', 'Accepted', 'Open'];
const VAGUE = [
  'nhanh',
  'kịp thời',
  'hợp lý',
  'phù hợp',
  'vài',
  'một số',
  'tối ưu',
  'thân thiện',
  'dễ dùng',
  'linh hoạt',
  'nếu cần',
  'khi cần',
  'v.v.',
  'đáng kể',
];
/** Names of internal parts that a use case diagram must not show (the system is a black box). */
const INTERNAL_NAMES = [
  'API',
  'Web',
  'Worker',
  'PostgreSQL',
  'Postgres',
  'database',
  'Database',
  'DB',
  'Better Auth',
  'Drizzle',
  'Express',
  'pg-boss',
  'Redis',
  'Resend',
  'WebSocket',
  'endpoint',
  'HTTP',
  '/api/',
];

/** @typedef {{ file: string, line: number, message: string }} Problem */

/** GitHub heading anchor: lower case, drop punctuation, one hyphen for each space. */
export function slug(/** @type {string} */ heading) {
  return heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll('`', '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** Lines of the file with the text in fenced code blocks replaced by empty strings. */
function proseLines(/** @type {string[]} */ lines) {
  let fenced = false;
  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line;
  });
}

/** Anchors of a Markdown text: one for each heading (with GitHub duplicate suffixes) and each <a id>. */
export function anchors(/** @type {string} */ text) {
  const result = new Set();
  const counts = new Map();
  for (const line of proseLines(text.split(/\r?\n/))) {
    const heading = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      const base = slug(heading[1] ?? '');
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      result.add(count === 0 ? base : `${base}-${count}`);
    }
    for (const match of line.matchAll(/<a\s+id="([^"]+)"/g)) result.add(match[1] ?? '');
  }
  return result;
}

/**
 * @typedef {{ line: number, header: string[], rows: { line: number, cells: string[] }[] }} Table
 */

/** Every Markdown table outside code blocks. A cell keeps its text; `\|` is not a cell border. */
export function tables(/** @type {string[]} */ lines) {
  const prose = proseLines(lines);
  /** @type {Table[]} */
  const result = [];
  const split = (/** @type {string} */ row) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim());
  for (let index = 0; index < prose.length; index += 1) {
    const line = prose[index] ?? '';
    const next = prose[index + 1] ?? '';
    if (!line.trim().startsWith('|') || !/^\s*\|?\s*:?-{3,}/.test(next)) continue;
    /** @type {Table} */
    const table = { line: index + 1, header: split(line), rows: [] };
    let row = index + 2;
    while ((prose[row] ?? '').trim().startsWith('|')) {
      table.rows.push({ line: row + 1, cells: split(prose[row] ?? '') });
      row += 1;
    }
    result.push(table);
    index = row - 1;
  }
  return result;
}

/** Text of each ```mermaid block, with the line of its fence. */
function mermaidBlocks(/** @type {string[]} */ lines) {
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s*```mermaid\s*$/.test(lines[index] ?? '')) continue;
    const end = lines.findIndex((line, at) => at > index && /^\s*```/.test(line));
    blocks.push({ line: index + 1, text: lines.slice(index + 1, end === -1 ? undefined : end) });
    if (end !== -1) index = end;
  }
  return blocks;
}

/** Sections by H2 heading: name and the line range of its content. */
function sections(/** @type {string[]} */ lines) {
  const prose = proseLines(lines);
  const starts = prose.flatMap((line, index) => (/^##\s/.test(line) ? [index] : []));
  return starts.map((start, at) => ({
    name: (prose[start] ?? '').replace(/^##\s+/, '').trim(),
    start,
    end: starts[at + 1] ?? lines.length,
  }));
}

const column = (/** @type {Table} */ table, /** @type {string} */ name) =>
  table.header.findIndex((cell) => cell.replaceAll('`', '') === name);
/** The status word before any note, e.g. "Confirmed (theo ủy quyền …)" gives "Confirmed". */
const firstWord = (/** @type {string} */ cell) => cell.split(/[\s(]/)[0] ?? '';
const isEmpty = (/** @type {string | undefined} */ cell) => cell === undefined || cell === '';
const isDash = (/** @type {string | undefined} */ cell) => cell === '—' || cell === '-';
const word = (/** @type {string} */ term) =>
  new RegExp(
    String.raw`(?<![\p{L}\p{N}])${term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![\p{L}\p{N}])`,
    'u',
  );

/** @param {string} file @param {string} text @param {{ exists?: (path: string) => boolean, read?: (path: string) => string }} [io] */
export function checkFile(file, text, io = {}) {
  const exists = io.exists ?? existsSync;
  const read = io.read ?? ((/** @type {string} */ path) => readFileSync(path, 'utf8'));
  const path = file.split(sep).join('/');
  /** @type {Problem[]} */
  const problems = [];
  const add = (/** @type {number} */ line, /** @type {string} */ message) =>
    problems.push({ file: path, line, message });
  if (SKIPPED.some((pattern) => pattern.test(path))) return problems;

  const lines = text.split(/\r?\n/);
  const prose = proseLines(lines);
  const ownAnchors = anchors(text);

  // Links: every relative link points to a file that exists, and every #anchor to a heading or <a id>.
  prose.forEach((line, index) => {
    const withoutCode = line.replace(/`[^`]*`/g, '');
    for (const match of withoutCode.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1] ?? '';
      if (/^[a-z]+:/i.test(target)) continue;
      const [rawPath = '', anchor] = target.split('#');
      let linkPath;
      try {
        linkPath = decodeURIComponent(rawPath);
      } catch {
        add(
          index + 1,
          `Link "${target}" has a malformed % escape. Write the path without % or with a valid escape. See ${DOCS}#trích-dẫn-nguồn.`,
        );
        continue;
      }
      if (linkPath === '') {
        if (anchor !== undefined && !ownAnchors.has(anchor)) {
          add(
            index + 1,
            `Link "#${anchor}" points to no heading or <a id> in this file. Fix the anchor. See ${DOCS}#trích-dẫn-nguồn.`,
          );
        }
        continue;
      }
      const resolved = normalize(join(dirname(path), linkPath));
      if (!exists(resolved)) {
        add(
          index + 1,
          `Link "${target}" points to "${resolved.split(sep).join('/')}", which does not exist. Fix the path. See ${DOCS}#trích-dẫn-nguồn.`,
        );
        continue;
      }
      if (anchor !== undefined && resolved.endsWith('.md') && !statSync(resolved).isDirectory()) {
        if (!anchors(read(resolved)).has(anchor)) {
          add(
            index + 1,
            `Link "${target}" points to no heading or <a id> "${anchor}" in ${resolved.split(sep).join('/')}. Fix the anchor. See ${DOCS}#trích-dẫn-nguồn.`,
          );
        }
      }
    }
  });

  // Citations: each [[n]](#ref-n) has a References entry, and each entry is cited.
  const proseText = prose.map((line) => line.replace(/`[^`]*`/g, '')).join('\n');
  const cited = new Set(
    [...proseText.matchAll(/\[\[(\d+)[^\]]*\]\]\(#ref-(\d+)\)/g)].map((match) => match[2]),
  );
  const defined = [...proseText.matchAll(/<a id="ref-(\d+)"><\/a>/g)].map((match) => match[1]);
  if (cited.size > 0 || defined.length > 0) {
    const headings = prose.flatMap((line, index) => (/^##\s/.test(line) ? [{ line, index }] : []));
    const last = headings.at(-1);
    if (last === undefined || last.line.trim() !== '## References') {
      add(
        last ? last.index + 1 : 1,
        `"## References" is not the last section. Move it to the end of the file. See ${DOCS}#trích-dẫn-nguồn.`,
      );
    }
    for (const number of cited) {
      if (!defined.includes(number))
        add(
          1,
          `Citation [[${number}]](#ref-${number}) has no entry <a id="ref-${number}"></a> in References. Add the source. See ${DOCS}#trích-dẫn-nguồn.`,
        );
    }
    for (const number of defined) {
      if (STRUCTURED.test(path) && !cited.has(number))
        add(
          1,
          `References entry ref-${number} is not cited in the text. Cite it or remove it. See ${DOCS}#trích-dẫn-nguồn.`,
        );
    }
  }

  if (!STRUCTURED.test(path) || /^docs\/UCs\/sources\//.test(path)) return problems;

  // Title and purpose line.
  if (!/^# \S/.test(lines[0] ?? ''))
    add(1, `Line 1 is not a "# " title. Start the file with its title. See ${DOCS}#cấu-trúc-file.`);
  const purpose = lines.slice(1).find((line) => line.trim() !== '');
  if (purpose === undefined || !PURPOSE.test(purpose)) {
    add(
      2,
      `The first line after the title is not a purpose line. Write one sentence that starts with "Đọc file này để biết", "Đọc file này để" or "Đọc file này giúp". See ${DOCS}#cấu-trúc-file.`,
    );
  }

  if (path.startsWith('docs/conventions/')) return problems;

  // ID rules: an ID is not the object of "theo", and a cell outside an ID column is not only an ID.
  prose.forEach((line, index) => {
    for (const match of line
      .replace(/`[^`]*`/g, (code) => (new RegExp('^`' + ID + '`$').test(code) ? code : ''))
      .matchAll(ID_AS_OBJECT)) {
      add(
        index + 1,
        `"${match[0]}" uses an ID as the object. Write a phrase that tells the content, then the ID in parentheses, e.g. "hết hạn sau thời hạn của link reset (RP-04)". See ${DOCS}#id.`,
      );
    }
  });
  const allTables = tables(lines);
  for (const table of allTables) {
    table.header.forEach((name, at) => {
      if (/\bID\b/.test(name) || name === 'Tiền tố' || name === 'Driver') return;
      for (const row of table.rows) {
        const cell = row.cells[at] ?? '';
        if (ID_ONLY_CELL.test(cell)) {
          add(
            row.line,
            `Cell "${cell}" in column "${name}" has only an ID. Write a phrase that tells the content, then the ID in parentheses. See ${DOCS}#id.`,
          );
        }
      }
    });
  }

  if (ARCH_DIR.test(path)) {
    const name = path.slice('docs/architecture/'.length);
    const hasContent = lines.slice(1).filter((line) => line.trim() !== '').length > 1;
    if (
      hasContent &&
      name !== 'README.md' &&
      name !== '30-decisions.md' &&
      !/^##\s+Drivers\s*$/m.test(text)
    ) {
      add(
        1,
        `This file has content but no "## Drivers" section. Add a table of the use cases, rules or quality attributes (phrase + ID) that this file answers, and the mechanism for each. See ${ARCHITECTURE}#khung-của-file-architecture.`,
      );
    }
    return problems;
  }

  if (!UC_DIR.test(path)) return problems;
  const name = path.slice('docs/UCs/'.length);
  if (name === 'README.md') return problems;

  // Rule tables, flow tables, gap tables and quality attribute tables.
  for (const table of allTables) {
    const at = (/** @type {string} */ header) => column(table, header);
    const isRule = at('Giá trị') !== -1 || (at('ID') === 0 && at('Rule') !== -1);
    const isFlow = at('Điều kiện') !== -1;
    const isQuality = at('Số đo') !== -1;
    const isGap = at('Baseline') !== -1;
    if (isRule) {
      for (const header of ['ID', 'Rule', 'Giá trị', 'Đo tại', 'Nguồn', 'Trạng thái']) {
        if (at(header) === -1)
          add(
            table.line,
            `Rule table has no column "${header}". Use the columns ID | Rule | Giá trị | Đo tại | Nguồn | Trạng thái. See ${USE_CASES}#rule-có-số-đo.`,
          );
      }
    }
    if (isRule || isFlow || isQuality) {
      for (const row of table.rows) {
        const source = row.cells[at('Nguồn')];
        if (at('Nguồn') === -1 || isEmpty(source) || isDash(source)) {
          add(
            row.line,
            `Row has no source. Write in "Nguồn" where the value or behavior comes from: a requirement, the prototype, a standard with its section, a library default with its version, or "agent đề xuất" with the reason. See ${DOCS}#giá-trị-cụ-thể-có-nguồn.`,
          );
        }
        const status = row.cells[at('Trạng thái')] ?? '';
        if (!STATUSES.includes(firstWord(status))) {
          add(
            row.line,
            `Status "${status}" is not Confirmed, Inferred, Proposed or Dropped. See ${USE_CASES}#rule-có-số-đo.`,
          );
        }
      }
    }
    if (isRule) {
      for (const row of table.rows) {
        const value = row.cells[at('Giá trị')];
        const point = row.cells[at('Đo tại')];
        if (isEmpty(value)) {
          add(
            row.line,
            `"Giá trị" is empty. Write a number with its unit, or "—" when the rule has no quantity. See ${USE_CASES}#rule-có-số-đo.`,
          );
        } else if (!isDash(value) && !/\d/.test(value ?? '')) {
          add(
            row.line,
            `"Giá trị" "${value}" has no number. Write a number with its unit, or "—" when the rule has no quantity. See ${USE_CASES}#rule-có-số-đo.`,
          );
        } else if (!isDash(value) && (isEmpty(point) || isDash(point))) {
          add(
            row.line,
            `"Đo tại" is empty for the value "${value}". Write where the measurement starts and ends, or where the value is read. See ${USE_CASES}#rule-có-số-đo.`,
          );
        }
        const rule = row.cells[at('Rule')] ?? '';
        for (const term of VAGUE) {
          if (word(term).test(rule.toLowerCase())) {
            add(
              row.line,
              `Rule uses the vague term "${term}". Replace it with a measure in "Giá trị" and "Đo tại". See ${USE_CASES}#rule-có-số-đo.`,
            );
          }
        }
      }
    }
    if (isQuality) {
      for (const row of table.rows) {
        if (!/\d/.test(row.cells[at('Số đo')] ?? '')) {
          add(
            row.line,
            `"Số đo" has no number. Write the value, the unit and where it is measured. See ${USE_CASES}#quality-attribute-scenario.`,
          );
        }
      }
    }
    if (isGap) {
      for (const row of table.rows) {
        const status = row.cells[at('Trạng thái')] ?? '';
        if (!GAP_STATUSES.includes(firstWord(status))) {
          add(
            row.line,
            `Gap status "${status}" is not Closed, Accepted or Open. See ${USE_CASES}#gap-analysis.`,
          );
        }
      }
    }
  }

  if (name === 'quality-attributes.md') return problems;

  // Use case file: prefix table, IDs with declared prefixes, gap analysis, a sequence diagram.
  const prefixTable = allTables.find((table) => column(table, 'Tiền tố') !== -1);
  if (prefixTable === undefined) {
    add(
      1,
      `No prefix table. Add a table with the columns Tiền tố | Nhóm | Nguồn in "## Tổng quan". See ${DOCS}#id.`,
    );
  } else {
    const declared = new Set(
      prefixTable.rows.map((row) => (row.cells[0] ?? '').replaceAll('`', '')),
    );
    const seen = new Map();
    for (const table of allTables) {
      if (table === prefixTable || column(table, 'ID') !== 0) continue;
      for (const row of table.rows) {
        const id = (row.cells[0] ?? '').replaceAll('`', '');
        const prefix = /^([A-Z][A-Z0-9]*)-/.exec(id)?.[1];
        if (prefix === undefined) continue;
        if (!declared.has(prefix))
          add(
            row.line,
            `ID ${id} uses the prefix "${prefix}", which is not in the prefix table. Declare it with its group and source. See ${DOCS}#id.`,
          );
        if (seen.has(id))
          add(
            row.line,
            `ID ${id} is defined twice (line ${seen.get(id)}). Give the new item the next number in its group. See ${DOCS}#id.`,
          );
        seen.set(id, row.line);
      }
    }
  }
  const gap = sections(lines).find((section) => section.name === 'Gap analysis');
  if (gap === undefined) {
    add(
      1,
      `No "## Gap analysis" section. Compare the use cases with an independent baseline and list the gaps. See ${USE_CASES}#gap-analysis.`,
    );
  } else if (
    !allTables.some(
      (table) =>
        column(table, 'Baseline') !== -1 && table.line > gap.start && table.line <= gap.end,
    )
  ) {
    add(
      gap.start + 1,
      `"## Gap analysis" has no table with a "Baseline" column. Use the columns ID | Gap | Baseline | Quyết định | Trạng thái. See ${USE_CASES}#gap-analysis.`,
    );
  }
  const diagrams = mermaidBlocks(lines);
  if (!diagrams.some((block) => block.text.some((line) => line.trim() === 'sequenceDiagram'))) {
    add(
      1,
      `No sequenceDiagram. Show the main flow of each use case with the system as a black box. See ${USE_CASES}#khung-của-file-use-case.`,
    );
  }
  for (const block of diagrams) {
    block.text.forEach((line, offset) => {
      // Binance is an external system that the user sees, so "Binance API" is allowed.
      const label = line.replace(/%%.*$/, '').replace(/Binance\s+\S+/g, 'Binance');
      for (const term of INTERNAL_NAMES) {
        if (word(term).test(label)) {
          add(
            block.line + offset + 1,
            `Diagram shows "${term}", an internal part of the system. In docs/UCs the system is one participant ("Crypto Force"); put the internal flow in docs/architecture. See ${MERMAID}#quy-tắc.`,
          );
        }
      }
    });
  }
  return problems;
}

/** Each docs/... path in the messages and comments of the checks exists, with its anchor. */
export function checkCodeLinks(
  /** @type {string} */ file,
  /** @type {string} */ text,
  exists = existsSync,
  read = (/** @type {string} */ path) => readFileSync(path, 'utf8'),
) {
  /** @type {Problem[]} */
  const problems = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(/docs\/[\w./-]+?\.md(?:#[\p{L}\p{M}\p{N}_-]+)?/gu)) {
      const [path = '', anchor] = match[0].split('#');
      if (!exists(path)) {
        problems.push({
          file,
          line: index + 1,
          message: `"${match[0]}" points to a file that does not exist. Fix the path to the convention file.`,
        });
      } else if (anchor !== undefined && !anchors(read(path)).has(anchor)) {
        problems.push({
          file,
          line: index + 1,
          message: `"${match[0]}" points to no heading "${anchor}" in ${path}. Fix the anchor.`,
        });
      }
    }
  });
  return problems;
}

const REQUIREMENT_ID = /^[A-Z][A-Z0-9]*-\d+(?:\.\d+)*$/;
const REQUIREMENT_IDS = /\b[A-Z][A-Z0-9]*-\d+(?:\.\d+)*\b/g;
const COMMENT = /^\s*(\/\/|\/\*|\*)/;

/** Requirement IDs that each file in docs/UCs defines (first column of its tables). */
export function useCaseIds(/** @type {Map<string, string>} */ files) {
  /** @type {Map<string, Set<string>>} */
  const result = new Map();
  for (const [path, text] of files) {
    const ids = new Set();
    for (const table of tables(text.split(/\r?\n/))) {
      if (column(table, 'ID') !== 0) continue;
      for (const row of table.rows) {
        const id = (row.cells[0] ?? '').replaceAll('`', '');
        if (REQUIREMENT_ID.test(id)) ids.add(id);
      }
    }
    result.set(path, ids);
  }
  return result;
}

/** Keep previously committed IDs, including when a rule moves to another use case file. */
export function checkRetainedIds(
  /** @type {Map<string, Set<string>>} */ current,
  /** @type {Map<string, Set<string>>} */ baseline,
) {
  const all = new Set([...current.values()].flatMap((ids) => [...ids]));
  /** @type {Problem[]} */
  const problems = [];
  for (const [file, ids] of baseline) {
    for (const id of ids) {
      if (!all.has(id)) {
        problems.push({
          file,
          line: 1,
          message: `Previously committed ID ${id} was removed. Keep its row and meaning; record a replacement without deleting the ID. See ${DOCS}#id.`,
        });
      }
    }
  }
  return problems;
}

/** HEAD is the baseline for local edits; also check its parent for changes committed by CI. */
function committedUseCaseIds() {
  const revisions = execFileSync('git', ['rev-list', '--max-count=2', 'HEAD'], {
    encoding: 'utf8',
  })
    .trim()
    .split(/\r?\n/);
  /** @type {Map<string, Set<string>>} */
  const baseline = new Map();
  for (const revision of revisions) {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', revision, 'docs/UCs'], {
      encoding: 'utf8',
    })
      .trim()
      .split(/\r?\n/)
      .filter((file) => UC_DIR.test(file) && file.endsWith('.md'));
    const texts = new Map(
      files.map((file) => [
        file,
        execFileSync('git', ['show', `${revision}:${file}`], { encoding: 'utf8' }),
      ]),
    );
    for (const [file, ids] of useCaseIds(texts)) {
      baseline.set(file, new Set([...(baseline.get(file) ?? []), ...ids]));
    }
  }
  return baseline;
}

/**
 * Code to docs: a comment that cites "docs/UCs/<file>.md, <ID>" names IDs that the file defines,
 * and a comment does not name a document by its bare file name.
 */
export function checkCodeTrace(
  /** @type {string} */ file,
  /** @type {string} */ text,
  /** @type {Map<string, Set<string>>} */ ids,
) {
  /** @type {Problem[]} */
  const problems = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!COMMENT.test(line)) return;
    // A citation can wrap to the next comment line, so read up to the closing parenthesis.
    const rest = [line, lines[index + 1] ?? ''].join(' ');
    for (const match of line.matchAll(/(docs\/UCs\/[\w-]+\.md),([^)]*)/g)) {
      const known = ids.get(match[1] ?? '');
      const cited = /\)/.test(match[2] ?? '')
        ? (match[2] ?? '')
        : (rest.slice(rest.indexOf(match[0]) + (match[1] ?? '').length).split(')')[0] ?? '');
      for (const id of cited.match(REQUIREMENT_IDS) ?? []) {
        if (known !== undefined && !known.has(id)) {
          problems.push({
            file,
            line: index + 1,
            message: `${id} is not defined in ${match[1] ?? ''}. Cite the ID of the rule that this code implements. See ${DOCS}#id.`,
          });
        }
      }
    }
    for (const match of line.matchAll(/(?<![\w/.-])([\w-]+\.md)\b/g)) {
      if (match[1] === 'README.md' || match[1] === 'SKILL.md') continue;
      problems.push({
        file,
        line: index + 1,
        message: `"${match[1] ?? ''}" names a document without its path. Write the path from the repository root and the rule ID, e.g. "(docs/UCs/authentication.md, SI-06)". See ${DOCS}#id.`,
      });
    }
  });
  return problems;
}

/**
 * Test to docs: each requirement ID in the Test Conditions and the Requirement Readiness of a
 * test scope is defined in docs/UCs, when its prefix belongs to a use case file.
 */
export function checkTestTrace(
  /** @type {string} */ file,
  /** @type {string} */ text,
  /** @type {Map<string, Set<string>>} */ ids,
) {
  /** @type {Problem[]} */
  const problems = [];
  const all = new Set([...ids.values()].flatMap((set) => [...set]));
  const prefixes = new Set([...all].map((id) => id.split('-')[0]));
  for (const table of tables(text.split(/\r?\n/))) {
    const at = table.header.findIndex((name) => /^(Requirement ID|Test basis item)/.test(name));
    if (at === -1) continue;
    for (const row of table.rows) {
      const cell = (row.cells[at] ?? '').split(/[;:]/)[0] ?? '';
      for (const id of cell.match(REQUIREMENT_IDS) ?? []) {
        if (prefixes.has(id.split('-')[0] ?? '') && !all.has(id)) {
          problems.push({
            file,
            line: row.line,
            message: `Requirement ${id} is not defined in docs/UCs. Point the test to the current ID of the rule, or add the rule to its use case file. See ${DOCS}#id.`,
          });
        }
      }
    }
  }
  return problems;
}

function listFiles(/** @type {string} */ dir, /** @type {RegExp} */ name) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return [
        'node_modules',
        'dist',
        'build',
        '.react-router',
        'test-results',
        'playwright-report',
      ].includes(entry.name)
        ? []
        : listFiles(path, name);
    }
    return name.test(entry.name) ? [path] : [];
  });
}

/** IDs defined in the first column of tables in docs/UCs: no ID is defined in two files. */
function duplicateIdsAcrossFiles(/** @type {string[]} */ files) {
  /** @type {Problem[]} */
  const problems = [];
  const owner = new Map();
  for (const file of files) {
    const path = file.split(sep).join('/');
    if (!UC_DIR.test(path)) continue;
    for (const table of tables(readFileSync(file, 'utf8').split(/\r?\n/))) {
      if (column(table, 'ID') !== 0) continue;
      for (const row of table.rows) {
        const id = (row.cells[0] ?? '').replaceAll('`', '');
        if (!new RegExp(`^${ID}$`).test(id)) continue;
        const first = owner.get(id);
        if (first !== undefined && first !== path) {
          problems.push({
            file: path,
            line: row.line,
            message: `ID ${id} is also defined in ${first}. An ID has one owner file; use a different prefix or link to the owner. See ${DOCS}#id.`,
          });
        }
        if (first === undefined) owner.set(id, path);
      }
    }
  }
  return problems;
}

export function checkRepo() {
  const docs = listFiles('docs', /\.md$/);
  const problems = docs.flatMap((file) => checkFile(file, readFileSync(file, 'utf8')));
  problems.push(...duplicateIdsAcrossFiles(docs));
  const code = [
    'eslint.config.js',
    '.github/workflows/ci.yml',
    // Test files hold paths that do not exist on purpose, as fixtures.
    ...listFiles('scripts', /^(?!.*\.test\.mjs$).*\.mjs$/),
    ...listFiles('.claude/hooks', /\.mjs$/),
    ...['AGENTS.md', 'LESSONS.md', 'README.md'],
  ];
  for (const file of code) {
    if (existsSync(file))
      problems.push(...checkCodeLinks(file.split(sep).join('/'), readFileSync(file, 'utf8')));
  }

  const ucFiles = new Map(
    docs
      .map((file) => file.split(sep).join('/'))
      .filter((path) => UC_DIR.test(path))
      .map((path) => [path, readFileSync(path, 'utf8')]),
  );
  const ids = useCaseIds(ucFiles);
  problems.push(...checkRetainedIds(ids, committedUseCaseIds()));
  const source = ['apps', 'packages'].flatMap((dir) => listFiles(dir, /\.(ts|tsx|mjs|js)$/));
  for (const file of source) {
    const path = file.split(sep).join('/');
    const text = readFileSync(file, 'utf8');
    problems.push(...checkCodeLinks(path, text), ...checkCodeTrace(path, text, ids));
  }
  const traced = docs.filter((file) =>
    /test-scopes[\\/][^\\/]+[\\/](01-requirement-analysis[\\/]output[\\/]01-requirement-readiness|03-design[\\/]output[\\/]02-test-conditions)\.md$/.test(
      file,
    ),
  );
  for (const file of traced) {
    problems.push(...checkTestTrace(file.split(sep).join('/'), readFileSync(file, 'utf8'), ids));
  }
  return problems;
}

export function format(/** @type {Problem[]} */ problems) {
  return problems
    .map((problem) => `${problem.file}:${problem.line}: ${problem.message}`)
    .join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const problems = checkRepo();
  if (problems.length > 0) {
    console.error(format(problems));
    console.error(
      `\n${problems.length} documentation problem(s). Conventions: docs/conventions/README.md`,
    );
    process.exit(1);
  }
  console.log(`check-docs: ${relative('.', 'docs') || 'docs'} OK`);
}

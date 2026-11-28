import { z } from 'zod';

const DRAFT_STORAGE_KEY = 'cf.draftStrategy';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DAY_MS = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const strategyDraftSnapshotSchema = z.strictObject({
  editId: z.string().min(1).nullable(),
  inputMode: z.enum(['prompt', 'url']),
  prompt: z.string(),
  url: z.string(),
  tags: z.array(z.string()),
  saveName: z.string(),
  hasShort: z.boolean(),
  savedAt: z.string(),
});

/** The unsaved Strategy Engine form state that survives a reload. */
export interface StrategyDraftSnapshot {
  editId: string | null;
  inputMode: 'prompt' | 'url';
  prompt: string;
  url: string;
  tags: string[];
  saveName: string;
  hasShort: boolean;
  savedAt: string;
}

/** Reads a stored draft. Malformed JSON and payloads outside the schema count as no draft. */
export function readStrategyDraft(storage: Pick<Storage, 'getItem'>): StrategyDraftSnapshot | null {
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const draft = strategyDraftSnapshotSchema.safeParse(parsed);
  return draft.success ? draft.data : null;
}

export function writeStrategyDraft(
  storage: Pick<Storage, 'setItem'>,
  draft: StrategyDraftSnapshot,
): void {
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearStrategyDraft(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(DRAFT_STORAGE_KEY);
}

/** Whether the form differs from the state captured when the draft was last saved. */
export function isStrategyDraftDirty(
  current: Omit<StrategyDraftSnapshot, 'savedAt'>,
  baseline: Omit<StrategyDraftSnapshot, 'savedAt'>,
): boolean {
  return (
    current.editId !== baseline.editId ||
    current.inputMode !== baseline.inputMode ||
    current.prompt !== baseline.prompt ||
    current.url !== baseline.url ||
    current.tags.length !== baseline.tags.length ||
    current.tags.some((tag, index) => tag !== baseline.tags[index]) ||
    current.saveName !== baseline.saveName ||
    current.hasShort !== baseline.hasShort
  );
}

/** Increments the patch field of a `major.minor.patch` version. */
export function bumpPatchVersion(version: string): string {
  const parts = version.split('.').map(Number);
  const [major = 0, minor = 0, patch = 0] = parts;
  return `${major}.${minor}.${patch + 1}`;
}

function parseIsoDate(isoDate: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) return null;
  const [, year = '', month = '', day = ''] = match;
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = new Date(time);
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

function formatIsoDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTH_NAMES[date.getUTCMonth()] ?? ''} ${date.getUTCFullYear()}`;
}

/**
 * Formats a Backtest period, for example `01 May 2025 -> 15 May 2025 · 14 days`.
 * Returns `null` when either date is invalid or the end date is not after the start date.
 */
export function formatBacktestPeriod(from: string, to: string): string | null {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (fromDate === null || toDate === null || fromDate.getTime() >= toDate.getTime()) return null;
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
  return `${formatIsoDate(fromDate)} -> ${formatIsoDate(toDate)} · ${days} days`;
}

/** Whether an ISO calendar date is later than the given ISO today. */
export function isDateAfterToday(isoDate: string, todayIsoDate: string): boolean {
  return isoDate > todayIsoDate;
}

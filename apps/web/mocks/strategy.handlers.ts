import {
  createStrategyInputSchema,
  renameStrategyInputSchema,
  strategyPreviewRequestSchema,
  type StrategyInputMode,
  type StrategyKind,
  type StrategyLibraryItem,
  type StrategySource,
  updateStrategyInputSchema,
} from '@crypto-force/shared';
import { http, HttpResponse } from 'msw';
import { buildStrategyPreview, seedStrategyLibrary } from './fixtures/strategy-backtest';

const ALLOWED_PREVIEW_HOSTS = [
  'tradingview.com',
  'medium.com',
  'gist.github.com',
  'blogspot.com',
  'docs.google.com',
];

let library: StrategyLibraryItem[] = seedStrategyLibrary();
const deletedItems = new Map<string, { index: number; item: StrategyLibraryItem }>();
let nextMockId = 1;

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function sourceFor(inputMode: StrategyInputMode | null): StrategySource {
  return inputMode === 'url' ? 'Imported from a link' : 'Written by you';
}

function hasName(name: string, exceptId?: string): boolean {
  const needle = name.trim().toLowerCase();
  return library.some((item) => item.id !== exceptId && item.name.toLowerCase() === needle);
}

function createId(kind: StrategyKind): string {
  const prefix = kind === 'composite' ? 'cp' : 'st';
  const id = `${prefix}-mock-${nextMockId}`;
  nextMockId += 1;
  return id;
}

function nowStamp(): string {
  return new Date().toISOString();
}

function paramId(value: string | readonly string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.[0] ?? '');
}

function bumpPatchVersion(version: string): string {
  const [major = 1, minor = 0, patch = 0] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

export function readMockLibraryItems(): StrategyLibraryItem[] {
  return library.map((item) => ({ ...item }));
}

export const strategyHandlers = [
  http.post('/api/strategies/preview', async ({ request }) => {
    const input = strategyPreviewRequestSchema.safeParse(await request.json());
    if (!input.success) {
      return errorResponse(400, 'INVALID_INPUT', 'Enter a strategy description or a link.');
    }
    if (input.data.inputMode === 'url') {
      const { hostname } = new URL(input.data.url);
      const allowed = ALLOWED_PREVIEW_HOSTS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
      if (!allowed) {
        return errorResponse(
          422,
          'EXTRACTION_FAILED',
          'We could not find a strategy on that page. Check the link points to the write-up itself, or paste the text into Describe it.',
        );
      }
    }
    return HttpResponse.json(buildStrategyPreview(input.data.inputMode, true));
  }),

  http.get('/api/strategies', ({ request }) => {
    const url = new URL(request.url);
    const kind = url.searchParams.get('kind') ?? 'all';
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const items = library.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
    return HttpResponse.json({ items, totalCount: items.length });
  }),

  http.post('/api/strategies', async ({ request }) => {
    const input = createStrategyInputSchema.safeParse(await request.json());
    if (!input.success) {
      return errorResponse(400, 'INVALID_INPUT', 'Check the strategy fields and try again.');
    }
    if (hasName(input.data.name)) {
      return errorResponse(
        409,
        'DUPLICATE_NAME',
        'Your library already has that name. Enter another name.',
      );
    }
    const now = nowStamp();
    const item: StrategyLibraryItem = {
      id: createId('strategy'),
      kind: 'strategy',
      name: input.data.name,
      source: sourceFor(input.data.inputMode),
      inputMode: input.data.inputMode,
      prompt: input.data.prompt,
      url: input.data.url,
      tags: input.data.tags,
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      rules: input.data.rules,
      blocks: null,
      voteMethod: null,
      weights: null,
      lastRunSummary: null,
    };
    library.unshift(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.patch('/api/strategies/:id/rename', async ({ params, request }) => {
    const id = paramId(params.id);
    const index = library.findIndex((item) => item.id === id);
    const current = library[index];
    if (!current) {
      return errorResponse(404, 'NOT_FOUND', 'That strategy is no longer in your library.');
    }
    const input = renameStrategyInputSchema.safeParse(await request.json());
    if (!input.success) {
      return errorResponse(400, 'INVALID_INPUT', 'Enter a name of up to 60 characters.');
    }
    if (hasName(input.data.name, id)) {
      return errorResponse(
        409,
        'DUPLICATE_NAME',
        'Your library already has that name. Enter another name.',
      );
    }
    const renamed: StrategyLibraryItem = {
      ...current,
      name: input.data.name,
      updatedAt: nowStamp(),
    };
    library[index] = renamed;
    return HttpResponse.json(renamed);
  }),

  http.patch('/api/strategies/:id', async ({ params, request }) => {
    const id = paramId(params.id);
    const index = library.findIndex((item) => item.id === id);
    const current = library[index];
    if (!current) {
      return errorResponse(404, 'NOT_FOUND', 'That strategy is no longer in your library.');
    }
    const input = updateStrategyInputSchema.safeParse(await request.json());
    if (!input.success) {
      return errorResponse(400, 'INVALID_INPUT', 'Check the strategy fields and try again.');
    }
    if (hasName(input.data.name, id)) {
      return errorResponse(
        409,
        'DUPLICATE_NAME',
        'Your library already has that name. Enter another name.',
      );
    }
    const updated: StrategyLibraryItem = {
      ...current,
      name: input.data.name,
      source: sourceFor(input.data.inputMode),
      inputMode: input.data.inputMode,
      prompt: input.data.prompt,
      url: input.data.url,
      tags: input.data.tags,
      rules: input.data.rules,
      version: bumpPatchVersion(current.version),
      updatedAt: nowStamp(),
    };
    library[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.post('/api/strategies/:id/duplicate', ({ params }) => {
    const id = paramId(params.id);
    const index = library.findIndex((item) => item.id === id);
    const current = library[index];
    if (!current) {
      return errorResponse(404, 'NOT_FOUND', 'That strategy is no longer in your library.');
    }
    const baseName = `${current.name} (copy)`;
    let name = baseName;
    let suffix = 2;
    while (hasName(name)) {
      name = `${baseName} ${suffix}`;
      suffix += 1;
    }
    const now = nowStamp();
    const copy: StrategyLibraryItem = {
      ...current,
      id: createId(current.kind),
      name,
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      lastRunSummary: null,
    };
    library.splice(index + 1, 0, copy);
    return HttpResponse.json(copy, { status: 201 });
  }),

  http.delete('/api/strategies/:id', ({ params }) => {
    const id = paramId(params.id);
    const index = library.findIndex((item) => item.id === id);
    const current = library[index];
    if (!current) {
      return errorResponse(404, 'NOT_FOUND', 'That strategy is no longer in your library.');
    }
    deletedItems.set(id, { index, item: current });
    library = library.filter((item) => item.id !== id);
    return HttpResponse.json({ deletedId: id });
  }),

  http.post('/api/strategies/:id/restore', ({ params }) => {
    const id = paramId(params.id);
    const deleted = deletedItems.get(id);
    if (!deleted) {
      return errorResponse(404, 'NOT_FOUND', 'There is nothing to restore for that strategy.');
    }
    deletedItems.delete(id);
    library.splice(Math.min(deleted.index, library.length), 0, deleted.item);
    return HttpResponse.json(deleted.item);
  }),
];

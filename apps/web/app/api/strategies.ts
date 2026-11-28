import {
  createStrategyInputSchema,
  renameStrategyInputSchema,
  strategyLibraryItemSchema,
  strategyListResponseSchema,
  strategyPreviewRequestSchema,
  strategyPreviewResponseSchema,
  updateStrategyInputSchema,
  type CreateStrategyInput,
  type RenameStrategyInput,
  type StrategyLibraryItem,
  type StrategyListResponse,
  type StrategyPreviewRequest,
  type StrategyPreviewResponse,
  type UpdateStrategyInput,
} from '@crypto-force/shared';
import { z } from 'zod';

const errorEnvelopeSchema = z.strictObject({
  error: z.strictObject({ code: z.string().min(1), message: z.string().min(1) }),
});

const deleteStrategyResponseSchema = z.strictObject({ deletedId: z.string().min(1) });

/**
 * Failed Strategy request. `code` is the API error code, `INVALID_RESPONSE` when the response
 * does not match the shared contract, or `INTERNAL_ERROR` when the error body is unreadable.
 */
export class StrategyApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StrategyApiError';
  }
}

interface RequestResult {
  body: unknown;
  status: number;
}

function jsonRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', payload?: unknown): RequestInit {
  if (payload === undefined) return { method };
  return {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

async function request(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<RequestResult> {
  const response = await fetch(path, signal === undefined ? init : { ...init, signal });
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(body);
    throw new StrategyApiError(
      envelope.success ? envelope.data.error.code : 'INTERNAL_ERROR',
      envelope.success ? envelope.data.error.message : 'The request failed.',
      response.status,
    );
  }
  return { body, status: response.status };
}

function readItem({ body, status }: RequestResult): StrategyLibraryItem {
  const parsed = strategyLibraryItemSchema.safeParse(body);
  if (!parsed.success) {
    throw new StrategyApiError('INVALID_RESPONSE', 'Unexpected server response.', status);
  }
  return parsed.data;
}

export async function previewStrategy(
  input: StrategyPreviewRequest,
  signal?: AbortSignal,
): Promise<StrategyPreviewResponse> {
  const validated = strategyPreviewRequestSchema.parse(input);
  const result = await request('/api/strategies/preview', jsonRequest('POST', validated), signal);
  const parsed = strategyPreviewResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new StrategyApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function listStrategies(
  filters?: { kind?: 'all' | 'strategy' | 'composite'; q?: string },
  signal?: AbortSignal,
): Promise<StrategyListResponse> {
  const params = new URLSearchParams();
  if (filters?.kind !== undefined) params.set('kind', filters.kind);
  if (filters?.q !== undefined) params.set('q', filters.q);
  const query = params.toString();
  const result = await request(
    query ? `/api/strategies?${query}` : '/api/strategies',
    jsonRequest('GET'),
    signal,
  );
  const parsed = strategyListResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new StrategyApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function createStrategy(input: CreateStrategyInput): Promise<StrategyLibraryItem> {
  const validated = createStrategyInputSchema.parse(input);
  return readItem(await request('/api/strategies', jsonRequest('POST', validated)));
}

export async function updateStrategy(
  id: string,
  input: UpdateStrategyInput,
): Promise<StrategyLibraryItem> {
  const validated = updateStrategyInputSchema.parse(input);
  return readItem(
    await request(`/api/strategies/${encodeURIComponent(id)}`, jsonRequest('PATCH', validated)),
  );
}

export async function renameStrategy(
  id: string,
  input: RenameStrategyInput,
): Promise<StrategyLibraryItem> {
  const validated = renameStrategyInputSchema.parse(input);
  return readItem(
    await request(
      `/api/strategies/${encodeURIComponent(id)}/rename`,
      jsonRequest('PATCH', validated),
    ),
  );
}

export async function duplicateStrategy(id: string): Promise<StrategyLibraryItem> {
  return readItem(
    await request(`/api/strategies/${encodeURIComponent(id)}/duplicate`, jsonRequest('POST')),
  );
}

export async function deleteStrategy(id: string): Promise<{ deletedId: string }> {
  const result = await request(`/api/strategies/${encodeURIComponent(id)}`, jsonRequest('DELETE'));
  const parsed = deleteStrategyResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new StrategyApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function restoreStrategy(id: string): Promise<StrategyLibraryItem> {
  return readItem(
    await request(`/api/strategies/${encodeURIComponent(id)}/restore`, jsonRequest('POST')),
  );
}

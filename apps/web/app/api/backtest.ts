import {
  activeBacktestResponseSchema,
  backtestConflictErrorSchema,
  backtestRunDetailSchema,
  backtestRunListResponseSchema,
  backtestRunSchema,
  createBacktestInputSchema,
  type ActiveBacktestResponse,
  type BacktestRun,
  type BacktestRunDetail,
  type BacktestRunListResponse,
  type CreateBacktestInput,
} from '@crypto-force/shared';
import { z } from 'zod';

const errorEnvelopeSchema = z.strictObject({
  error: z.strictObject({ code: z.string().min(1), message: z.string().min(1) }),
});

/**
 * Failed Backtest request. `code` is the API error code, `INVALID_RESPONSE` when the response
 * does not match the shared contract, or `INTERNAL_ERROR` when the error body is unreadable.
 * A `BACKTEST_ALREADY_RUNNING` conflict also carries the run that blocks the new one.
 */
export class BacktestApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly activeRun?: BacktestRun,
  ) {
    super(message);
    this.name = 'BacktestApiError';
  }
}

interface RequestResult {
  body: unknown;
  status: number;
}

function jsonRequest(method: 'GET' | 'POST', payload?: unknown): RequestInit {
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
  options: { parseConflict?: boolean; signal?: AbortSignal | undefined } = {},
): Promise<RequestResult> {
  const response = await fetch(
    path,
    options.signal === undefined ? init : { ...init, signal: options.signal },
  );
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    if (options.parseConflict === true && response.status === 409) {
      const conflict = backtestConflictErrorSchema.safeParse(body);
      if (conflict.success) {
        throw new BacktestApiError(
          'BACKTEST_ALREADY_RUNNING',
          conflict.data.error.message,
          409,
          conflict.data.activeRun,
        );
      }
    }
    const envelope = errorEnvelopeSchema.safeParse(body);
    throw new BacktestApiError(
      envelope.success ? envelope.data.error.code : 'INTERNAL_ERROR',
      envelope.success ? envelope.data.error.message : 'The request failed.',
      response.status,
    );
  }
  return { body, status: response.status };
}

export async function listBacktestRuns(signal?: AbortSignal): Promise<BacktestRunListResponse> {
  const result = await request('/api/backtests', jsonRequest('GET'), { signal });
  const parsed = backtestRunListResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new BacktestApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function getActiveBacktest(signal?: AbortSignal): Promise<ActiveBacktestResponse> {
  const result = await request('/api/backtests/active', jsonRequest('GET'), { signal });
  const parsed = activeBacktestResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new BacktestApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function getBacktestRun(id: string, signal?: AbortSignal): Promise<BacktestRunDetail> {
  const result = await request(`/api/backtests/${encodeURIComponent(id)}`, jsonRequest('GET'), {
    signal,
  });
  const parsed = backtestRunDetailSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new BacktestApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function createBacktestRun(input: CreateBacktestInput): Promise<BacktestRun> {
  const validated = createBacktestInputSchema.parse(input);
  const result = await request('/api/backtests', jsonRequest('POST', validated), {
    parseConflict: true,
  });
  const parsed = backtestRunSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new BacktestApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

export async function cancelBacktestRun(id: string): Promise<BacktestRun> {
  const result = await request(
    `/api/backtests/${encodeURIComponent(id)}/cancel`,
    jsonRequest('POST'),
  );
  const parsed = backtestRunSchema.safeParse(result.body);
  if (!parsed.success) {
    throw new BacktestApiError('INVALID_RESPONSE', 'Unexpected server response.', result.status);
  }
  return parsed.data;
}

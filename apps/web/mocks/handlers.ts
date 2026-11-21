import type { RequestHandler } from 'msw';
import { marketDataHandlers } from './market-data.handlers';

export const handlers: RequestHandler[] = [...marketDataHandlers];

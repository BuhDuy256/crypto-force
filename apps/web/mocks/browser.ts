import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export async function startMocking(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledFrame: 'bypass' });
}

import { setTimeout as delay } from 'node:timers/promises';

// Only setup uses this retry. A 429 during the measured action remains an error.
export async function prepareCharts(page, record, pause = delay) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.waitForFunction(
      () => window.__marketPerf.apply.length === 4 || window.__marketPerf.authRateLimit,
      undefined,
      { timeout: 15000 },
    );
    const limited = await page.evaluate(() => window.__marketPerf.authRateLimit);
    if (!limited) return;
    const seconds = Number(limited.retryAfter);
    if (
      limited.retryAfter === null ||
      !Number.isFinite(seconds) ||
      !Number.isInteger(seconds) ||
      seconds < 0
    )
      throw new Error('The Auth retry header is invalid.');
    record({ ...limited, attempt, phase: 'setup' });
    if (attempt === 1) throw new Error('Auth still limits workspace setup after the retry.');
    await pause(seconds * 1000);
    await page.reload();
  }
}

import { createHash } from 'node:crypto';
import type { Logger } from 'pino';
import { COMMON_PASSWORDS } from './common-passwords';

/** Longest wait for the Pwned Passwords API (docs/architecture/23-security.md, Password). */
const PWNED_TIMEOUT_MS = 3000;
const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const commonPasswords = new Set(COMMON_PASSWORDS);

/** Whether a password appears in the Pwned Passwords API response for its hash prefix. */
function rangeContains(body: string, suffix: string) {
  return body.split(/\r?\n/).some((line) => {
    const [lineSuffix, count] = line.split(':');
    return lineSuffix?.toUpperCase() === suffix && Number(count) > 0;
  });
}

/**
 * Returns true when a password must be rejected: it is on the common-password list, or the Pwned
 * Passwords API reports it as breached. When the API fails or does not answer in time, only the
 * list applies, and one warning is logged.
 */
export async function isRejectedPassword(password: string, logger: Logger) {
  if (commonPasswords.has(password)) return true;
  const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const abort = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abort.abort();
      reject(new Error(`Pwned Passwords API did not answer in ${String(PWNED_TIMEOUT_MS)} ms`));
    }, PWNED_TIMEOUT_MS);
  });
  try {
    const check = async () => {
      const response = await fetch(`${PWNED_RANGE_URL}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: abort.signal,
      });
      if (!response.ok) throw new Error(`Pwned Passwords API answered ${String(response.status)}`);
      return rangeContains(await response.text(), hash.slice(5));
    };
    return await Promise.race([check(), timeout]);
  } catch (error) {
    logger.warn(
      { err: error },
      'Pwned Passwords check failed; only the common-password list was checked',
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}

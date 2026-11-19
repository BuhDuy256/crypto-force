// The real API (`src/index.ts`) in its own Node.js process, on the `<POSTGRES_DB>_test` database.
// Use it when a test needs a real restart: a new process keeps nothing in memory from the old
// one, so only what the API stores in the database survives, as in a restart in production.
// A new auth server in the same process (`createHarness`) is not a restart: the auth library keeps
// some state, for example rate-limit counters in `memory` storage, in module variables that the
// new server shares.
// The process prints email to the console (no RESEND_API_KEY) and does not use the fakes of
// `outbound.ts`. Send it only requests that make no outbound call, for example Sign in.
import { type ChildProcess, spawn } from 'node:child_process';
import { request } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getTestDatabaseUrl } from '../test-database';
import { APP_URL, TEST_SECRET } from './harness';

const apiDir = fileURLToPath(new URL('../..', import.meta.url));

const fileClock = pathToFileURL(fileURLToPath(new URL('./file-clock.ts', import.meta.url))).href;

/**
 * Starts `src/index.ts` on the test database; `env` adds to or replaces the base variables.
 * With `TEST_CLOCK_FILE` in `env`, the process reads its clock from that file (`file-clock.ts`).
 */
export function spawnApi(env: Record<string, string>): ChildProcess {
  const clock = env.TEST_CLOCK_FILE === undefined ? [] : ['--import', fileClock];
  return spawn(process.execPath, ['--import', 'tsx', ...clock, 'src/index.ts'], {
    cwd: apiDir,
    env: {
      PATH: process.env.PATH ?? '',
      SYSTEMROOT: process.env.SYSTEMROOT ?? '',
      DATABASE_URL: getTestDatabaseUrl().testUrl,
      BETTER_AUTH_SECRET: TEST_SECRET,
      BETTER_AUTH_URL: APP_URL,
      ...env,
    },
  });
}

export interface ApiProcess {
  /** Sends a POST to `/api/auth<path>` as if it came from client IP `ip`. */
  post: (path: string, body: unknown, ip: string) => Promise<{ status: number }>;
  /** Kills the process and waits until it has stopped. */
  stop: () => Promise<void>;
}

/**
 * Starts the API on `port` and waits until it listens. With `clockFile`, the process reads its
 * clock from that file (`file-clock.ts`).
 */
export async function startApi(port: number, clockFile?: string): Promise<ApiProcess> {
  const child = spawnApi({
    NODE_ENV: 'test',
    API_PORT: String(port),
    ...(clockFile === undefined ? {} : { TEST_CLOCK_FILE: clockFile }),
  });
  let output = '';
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(`The API process did not listen on port ${String(port)} in 30 s.\n${output}`),
      );
    }, 30_000);
    // Keep reading after the start, so a full output pipe never blocks the process.
    const read = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('API listening')) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout?.on('data', read);
    child.stderr?.on('data', read);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(
        new Error(`The API process stopped (code ${String(code)}) before it listened.\n${output}`),
      );
    });
  });

  const post = (path: string, body: unknown, ip: string) =>
    new Promise<{ status: number }>((resolve, reject) => {
      const payload = JSON.stringify(body);
      const outgoing = request(
        {
          host: '127.0.0.1',
          port,
          path: `/api/auth${path}`,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload),
            origin: APP_URL,
            'x-forwarded-for': ip,
            connection: 'close',
          },
        },
        (response) => {
          response.resume();
          response.on('end', () => {
            resolve({ status: response.statusCode ?? 0 });
          });
        },
      );
      outgoing.on('error', reject);
      outgoing.end(payload);
    });

  const stop = () =>
    new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve();
        return;
      }
      child.once('exit', () => {
        resolve();
      });
      child.kill();
    });

  return { post, stop };
}

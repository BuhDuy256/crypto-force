// Preload for an API process in tests (`startApi` with a clock file). It replaces `Date` so that
// `Date.now()` and `new Date()` read the time in milliseconds from the file `TEST_CLOCK_FILE`.
// The test writes the file before each request. Thus, a test controls the clock of the API process
// as `controlClock` controls it in the test process, and two processes in turn (a restart) share
// one clock. Only `Date` is controlled: `performance.now` and `process.hrtime` stay real. The rate
// limit of better-auth reads `Date.now`: TC-005 row 1 with presses 12 s after the first gives 401
// three times with this clock, while the real clock gives 429 at the 4th press.
// Do not import this module in production code.
import { readFileSync } from 'node:fs';

const file = process.env.TEST_CLOCK_FILE;

if (file !== undefined) {
  const RealDate = Date;
  // The process reads the clock also in background timers, so a read can come while the test
  // writes the file. Then the file can be empty for a moment. Such a read keeps the last time; it
  // must not move the clock to 1970. The test writes the file before it starts the process.
  let last: number | undefined;
  const now = () => {
    const text = readFileSync(file, 'utf8');
    const value = Number(text);
    if (text.trim() !== '' && Number.isFinite(value)) last = value;
    if (last === undefined) {
      throw new Error(`TEST_CLOCK_FILE ${file} has no time in milliseconds: "${text}"`);
    }
    return last;
  };

  class FileDate extends RealDate {
    constructor(...args: ConstructorParameters<DateConstructor> | []) {
      if (args.length === 0) super(now());
      else super(...args);
    }

    static override now() {
      return now();
    }
  }

  globalThis.Date = FileDate as DateConstructor;
}

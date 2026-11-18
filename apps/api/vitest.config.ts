import { BaseSequencer, type TestSpecification } from 'vitest/node';
import { defineConfig } from 'vitest/config';

const runsFirst = (spec: TestSpecification) => spec.moduleId.endsWith('smoke.test.ts');
// The token randomness test reads every session token issued in the run, so it runs last.
const runsLast = (spec: TestSpecification) => spec.moduleId.endsWith('token-entropy.test.ts');

/** Smoke test first (when it fails, the other results mean little), token randomness last. */
class AuthTestSequencer extends BaseSequencer {
  override async sort(files: TestSpecification[]) {
    const sorted = await super.sort(files);
    return [
      ...sorted.filter(runsFirst),
      ...sorted.filter((spec) => !runsFirst(spec) && !runsLast(spec)),
      ...sorted.filter(runsLast),
    ];
  }
}

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Integration tests share one database; run files one after another.
    fileParallelism: false,
    sequence: { sequencer: AuthTestSequencer },
    env: { NODE_ENV: 'test' },
  },
});

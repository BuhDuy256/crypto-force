import { defineConfig } from 'vitest/config';

export default defineConfig({
  // A test without an assertion cannot fail; Vitest fails it.
  test: { expect: { requireAssertions: true } },
});

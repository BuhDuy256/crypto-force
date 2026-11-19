// Format of session tokens: no token repeats, and the length and alphabet of a token give room for
// at least 128 bits (length × log2 of the alphabet size).
// This is a format check. It does not show that the tokens are unpredictable: a counter written
// in the same alphabet and length also passes. Unpredictability depends on the random number
// generator of the auth library, which a review of that library must show; a test of the tokens
// cannot.
// The test reads every session token that the other test files received during this `pnpm test`
// run (`support/harness.ts` records them), so `vitest.config.ts` runs this file last. Run it with
// the full `pnpm test`; alone, it has too few tokens and fails.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SESSION_TOKEN_LOG } from '../support/harness';

const ALPHABETS = [
  { name: 'hex', size: 16, pattern: /^[0-9a-f]+$/i },
  { name: 'alphanumeric', size: 62, pattern: /^[0-9A-Za-z]+$/ },
  { name: 'base64url', size: 64, pattern: /^[0-9A-Za-z_-]+$/ },
  { name: 'base64', size: 64, pattern: /^[0-9A-Za-z+/=]+$/ },
];

describe('Session token format', () => {
  it('TC-206 tokens are unique, and their length and alphabet give room for 128 bits', () => {
    const tokens = readFileSync(SESSION_TOKEN_LOG, 'utf8').split('\n').filter(Boolean);
    // The harness records tokens of new sessions only, so a repeated token is a collision.
    expect(tokens.length).toBeGreaterThan(50);
    expect(new Set(tokens).size).toBe(tokens.length);

    // The smallest alphabet that holds every token, so the result is never too high.
    const alphabet = ALPHABETS.find(({ pattern }) => tokens.every((token) => pattern.test(token)));
    expect(alphabet, 'tokens use no standard alphabet').toBeDefined();
    const shortest = Math.min(...tokens.map((token) => token.length));
    const bits = shortest * Math.log2(alphabet?.size ?? 1);
    expect(bits).toBeGreaterThanOrEqual(128);
  });
});

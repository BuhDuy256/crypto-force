// Where the user goes after Sign in: `getSafeNext` keeps a `next` path inside the app, and opens
// Realtime for anything else (other origins, protocol-relative or `javascript:` URLs, Auth pages).
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { describe, expect, it } from 'vitest';
import { getSafeNext } from './auth-redirect';

describe('`next` parameter', () => {
  it('TC-160 keeps a path inside the app', () => {
    expect(getSafeNext('/backtest')).toBe('/backtest');
  });

  const ignored: [string, string | null][] = [
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash URL', '/\\evil.example'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['an Auth route', '/sign-in'],
    ['no value', null],
  ];
  for (const [label, next] of ignored) {
    it(`TC-160 opens Realtime for ${label}`, () => {
      expect(getSafeNext(next)).toBe('/realtime');
    });
  }
});

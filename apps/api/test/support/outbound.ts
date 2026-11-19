// Fakes for every outbound HTTP call that the auth server makes in API tests, so that no test
// calls a real service or sends test data off the machine:
// - Pwned Passwords range API: answers "clean" or "pwned", fails, or does not answer.
// - Google OAuth token endpoint: returns an id_token for the profile set with `setGoogleProfile`.
// A request to any other host fails the test with the host name. Add a fake here for a new host.
import { createHash } from 'node:crypto';

type PwnedMode = 'clean' | 'pwned' | 'unavailable' | 'no-answer';

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
}

interface OutboundState {
  pwnedMode: PwnedMode;
  pwnedRequests: string[];
  googleProfile: GoogleProfile | null;
  googleTokenRequests: number;
  unexpected: string[];
}

export const outbound: OutboundState = {
  pwnedMode: 'clean',
  pwnedRequests: [],
  googleProfile: null,
  googleTokenRequests: 0,
  unexpected: [],
};

/** Pwned Passwords: how the stub answers the next requests. */
export function setPwnedMode(mode: PwnedMode) {
  outbound.pwnedMode = mode;
}

/** Google: the profile that the fake token endpoint puts in the id_token. */
export function setGoogleProfile(profile: GoogleProfile | null) {
  outbound.googleProfile = profile;
}

export function resetOutbound() {
  outbound.pwnedMode = 'clean';
  outbound.pwnedRequests.length = 0;
  outbound.googleProfile = null;
  outbound.googleTokenRequests = 0;
  outbound.unexpected.length = 0;
}

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** An id_token in the shape Google returns. The signature is fake (ADR-002 accepts no check). */
export function fakeIdToken(profile: GoogleProfile, clientId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'RS256', kid: 'test-key', typ: 'JWT' });
  const payload = base64url({
    iss: 'https://accounts.google.com',
    aud: clientId,
    iat: now,
    exp: now + 3600,
    email_verified: true,
    name: 'Google Test User',
    ...profile,
  });
  return `${header}.${payload}.ZmFrZS1zaWduYXR1cmU`;
}

const sha1 = (value: string) => createHash('sha1').update(value).digest('hex').toUpperCase();

/** Range API answer: the suffix list of a 5-character SHA-1 prefix, `SUFFIX:COUNT` per line. */
function pwnedRangeBody(prefix: string, pwnedPasswords: string[]) {
  const lines = ['0000000000000000000000000000000000A:0'];
  for (const password of pwnedPasswords) {
    const hash = sha1(password);
    if (hash.startsWith(prefix)) lines.push(`${hash.slice(5)}:4242`);
  }
  return lines.join('\r\n');
}

const pwnedList: string[] = [];

/** Passwords the stub reports as pwned while the mode is `pwned`. */
export function markPwned(password: string) {
  pwnedList.push(password);
}

const realFetch = globalThis.fetch;
let installed = false;

function urlOf(input: Parameters<typeof fetch>[0]) {
  if (typeof input === 'string') return new URL(input);
  if (input instanceof URL) return input;
  return new URL(input.url);
}

async function stubFetch(input: Parameters<typeof fetch>[0], init?: RequestInit) {
  const url = urlOf(input);

  if (url.hostname === 'api.pwnedpasswords.com') {
    const prefix = url.pathname.split('/').pop()?.toUpperCase() ?? '';
    outbound.pwnedRequests.push(prefix);
    switch (outbound.pwnedMode) {
      case 'unavailable':
        return new Response('Service Unavailable', { status: 503 });
      case 'no-answer':
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return new Response(pwnedRangeBody(prefix, []), { status: 200 });
      case 'pwned':
        return new Response(pwnedRangeBody(prefix, pwnedList), { status: 200 });
      case 'clean':
        return new Response(pwnedRangeBody(prefix, []), { status: 200 });
    }
  }

  if (url.hostname === 'oauth2.googleapis.com' && url.pathname === '/token') {
    outbound.googleTokenRequests += 1;
    const profile = outbound.googleProfile;
    if (!profile) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    const body = new URLSearchParams(typeof init?.body === 'string' ? init.body : '');
    const clientId = body.get('client_id') ?? 'test-client.apps.googleusercontent.com';
    return Response.json({
      access_token: `fake-access-${profile.sub}`,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid email profile',
      id_token: fakeIdToken(profile, clientId),
    });
  }

  outbound.unexpected.push(url.toString());
  throw new TypeError(
    `Outbound request blocked by the test stub in test/support/outbound.ts: ${url.origin}. Add a fake for this host there.`,
  );
}

/** Replaces globalThis.fetch once per test file. Database traffic does not use fetch. */
export function installFetchStub() {
  if (installed) return;
  installed = true;
  globalThis.fetch = stubFetch;
}

export function restoreFetch() {
  globalThis.fetch = realFetch;
  installed = false;
}

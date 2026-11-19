// Form rules of the shared auth schemas (Create account, New password, Full name): length limits,
// counted in Unicode code points, and the messages the forms show. The API has its own checks;
// apps/api/test/auth/password.test.ts tests those.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { describe, expect, it } from 'vitest';
import { resetPasswordSchema, signUpSchema } from '../src/schemas/auth.schema';

const SEED = 'Vq7#Lm2$Tx9@Kd4!';
const ascii = (length: number) => SEED.repeat(Math.ceil(length / SEED.length)).slice(0, length);
const nameOf = (length: number) => 'N'.repeat(length);
const EMOJI = '😀';

const MIN_MESSAGE = 'Use at least 8 characters.';
const MAX_MESSAGE = 'Use 128 characters or fewer.';
const NAME_REQUIRED = 'Enter your full name.';
const NAME_MAX = 'Use 100 characters or fewer.';

const validSignUp = {
  name: 'An Nguyen',
  email: 'an@example.com',
  password: 'Correct-Horse-91',
  acceptTerms: true,
};

function messagesFor(result: ReturnType<typeof signUpSchema.safeParse>, field: string) {
  return result.success
    ? []
    : result.error.issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

const signUpPasswordMessages = (password: string) =>
  messagesFor(signUpSchema.safeParse({ ...validSignUp, password }), 'password');

const newPasswordMessages = (password: string) => {
  const result = resetPasswordSchema.safeParse({
    newPassword: password,
    confirmPassword: password,
  });
  return result.success
    ? []
    : result.error.issues
        .filter((issue) => issue.path[0] === 'newPassword')
        .map((issue) => issue.message);
};

const nameMessages = (name: string) =>
  messagesFor(signUpSchema.safeParse({ ...validSignUp, name }), 'name');

/** Expected message for a password of `length` characters. */
const passwordExpectation = (length: number) =>
  length < 8 ? [MIN_MESSAGE] : length > 128 ? [MAX_MESSAGE] : [];

describe('Lengths in the form schemas', () => {
  describe('TC-090 and TC-091 Create account password, ASCII', () => {
    for (const length of [6, 7, 8, 9, 127, 128, 129, 130]) {
      it(`${String(length)} characters`, () => {
        expect(signUpPasswordMessages(ascii(length))).toEqual(passwordExpectation(length));
      });
    }
  });

  describe('TC-092 and TC-093 New password, ASCII', () => {
    for (const length of [6, 7, 8, 9, 127, 128, 129, 130]) {
      it(`${String(length)} characters`, () => {
        expect(newPasswordMessages(ascii(length))).toEqual(passwordExpectation(length));
      });
    }
  });

  describe('TC-094 and TC-095 Full name, ASCII', () => {
    const expected: Record<number, string[]> = {
      0: [NAME_REQUIRED],
      1: [],
      2: [],
      99: [],
      100: [],
      101: [NAME_MAX],
      102: [NAME_MAX],
    };
    for (const [length, messages] of Object.entries(expected)) {
      it(`${length} characters`, () => {
        expect(nameMessages(nameOf(Number(length)))).toEqual(messages);
      });
    }
  });

  describe('TC-096 Create account password counts code points', () => {
    for (const count of [4, 8, 65, 129]) {
      it(`${String(count)} × ${EMOJI}`, () => {
        expect(signUpPasswordMessages(EMOJI.repeat(count))).toEqual(passwordExpectation(count));
      });
    }
  });

  describe('TC-097 New password counts code points', () => {
    for (const count of [4, 8, 65, 129]) {
      it(`${String(count)} × ${EMOJI}`, () => {
        expect(newPasswordMessages(EMOJI.repeat(count))).toEqual(passwordExpectation(count));
      });
    }
  });

  describe('TC-098 Full name counts code points', () => {
    it(`51 × ${EMOJI}`, () => {
      expect(nameMessages(EMOJI.repeat(51))).toEqual([]);
    });
    it(`101 × ${EMOJI}`, () => {
      expect(nameMessages(EMOJI.repeat(101))).toEqual([NAME_MAX]);
    });
  });
});

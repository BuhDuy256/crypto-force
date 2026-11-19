// Password values for the length tests: ASCII passwords of an exact length, an emoji (one code
// point, two UTF-16 units), and a random password that is new on every run.
import { randomBytes } from 'node:crypto';

const SEED = 'Vq7#Lm2$Tx9@Kd4!';

/** ASCII password of exactly `length` characters. */
export function asciiPassword(length: number) {
  return SEED.repeat(Math.ceil(length / SEED.length)).slice(0, length);
}

export const EMOJI = '😀';

/** A 20-character random password, new on every run. */
export function randomPassword() {
  return randomBytes(15).toString('base64url').slice(0, 20);
}

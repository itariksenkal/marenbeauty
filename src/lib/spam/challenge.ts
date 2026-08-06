import { createChallenge, verifySolution } from 'altcha-lib/v1';

import { SPAM_LIMITS } from '@/config/forms';
import { spamEnv } from '@/config/env';

import { redeemed } from './single-use';

/**
 * Altcha proof of work — the JavaScript path's spam gate.
 *
 * The scheme: the server issues a random salt and the SHA-256 of `salt+number`
 * for a number it picked below `maxNumber`, signs the whole thing with HMAC,
 * and hands over everything except the number. The client brute-forces the
 * number in a Web Worker. Nobody is asked to identify a traffic light
 * (CLAUDE.md §2 — no third-party CAPTCHA, no tracking, no cookies).
 *
 * THREE THINGS ARE VERIFIED SERVER-SIDE, and all three matter:
 *
 *   1. The signature — proves we issued this challenge and nobody edited the
 *      difficulty down on the way.
 *   2. The expiry — a challenge is short-lived, so a harvested one is worth
 *      little.
 *   3. Single use — the signature is redeemed once, so a captured valid
 *      submission cannot be replayed.
 *
 * `altcha-lib` gives us 1 and 2. Number 3 is ours: the library verifies a
 * solution, it does not remember it.
 */

export type IssuedChallenge = Awaited<ReturnType<typeof createChallenge>>;

/** Issue a fresh challenge. Never reuses a salt; never reveals the number. */
export async function issueChallenge(): Promise<IssuedChallenge> {
  return createChallenge({
    hmacKey: spamEnv().ALTCHA_HMAC_KEY,
    maxNumber: SPAM_LIMITS.powMaxNumber,
    expires: new Date(Date.now() + SPAM_LIMITS.challengeTtlMs),
  });
}

export type SolutionCheck =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'malformed' | 'invalid' | 'replayed';
    };

/**
 * Verify a solved payload.
 *
 * Order matters: signature and expiry first, replay last. Redeeming the
 * signature of a payload that turns out to be forged would let an attacker
 * burn ids they never legitimately held.
 */
export async function checkSolution(payload: unknown): Promise<SolutionCheck> {
  if (typeof payload !== 'string' || payload.length === 0) {
    return { ok: false, reason: 'malformed' };
  }

  let valid = false;
  try {
    valid = await verifySolution(payload, spamEnv().ALTCHA_HMAC_KEY, true);
  } catch {
    // A malformed payload throws rather than returning false.
    return { ok: false, reason: 'malformed' };
  }
  if (!valid) return { ok: false, reason: 'invalid' };

  const signature = signatureOf(payload);
  if (!signature) return { ok: false, reason: 'malformed' };

  if (!redeemed.claim(signature, SPAM_LIMITS.challengeTtlMs)) {
    return { ok: false, reason: 'replayed' };
  }
  return { ok: true };
}

/** The signature is the natural single-use id: unique per issued challenge. */
function signatureOf(payload: string): string | null {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf8'),
    );
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'signature' in decoded &&
      typeof decoded.signature === 'string'
    ) {
      return decoded.signature;
    }
    return null;
  } catch {
    return null;
  }
}

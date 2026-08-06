import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { SPAM_LIMITS } from '@/config/forms';
import { spamEnv } from '@/config/env';

import { redeemed } from './single-use';

/**
 * The no-JavaScript floor.
 *
 * Proof of work needs a Web Worker, so a visitor with JavaScript off cannot
 * produce one — and `docs/ROADMAP.md` M11 requires the form to work anyway, via
 * a plain form POST. Accepting those submissions with no server-side check at
 * all would mean a spammer only has to turn JavaScript off, which would make
 * the whole Altcha layer decorative.
 *
 * So the page also issues a signed token: a random nonce plus an expiry, HMAC'd
 * with the same key. It proves the submission came from a page **we served**,
 * **recently**, and is redeemed **once**. That is a lower bar than proof of work
 * and it is meant to be — it is the floor, not the ceiling. The honeypot and the
 * rate limit apply to both paths.
 *
 * Deliberately NOT a cookie: no state is stored, nothing is set on the visitor,
 * and the consent posture (CLAUDE.md §11) stays "no cookies at launch".
 */

const SEPARATOR = '.';

export function issueFormToken(now: number = Date.now()): string {
  const payload = JSON.stringify({
    n: randomBytes(16).toString('base64url'),
    e: now + SPAM_LIMITS.challengeTtlMs,
  });
  const body = Buffer.from(payload, 'utf8').toString('base64url');
  return `${body}${SEPARATOR}${sign(body)}`;
}

export type TokenCheck =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'malformed' | 'invalid' | 'expired' | 'replayed';
    };

export function checkFormToken(
  token: unknown,
  now: number = Date.now(),
): TokenCheck {
  if (typeof token !== 'string' || !token.includes(SEPARATOR)) {
    return { ok: false, reason: 'malformed' };
  }

  const index = token.lastIndexOf(SEPARATOR);
  const body = token.slice(0, index);
  const signature = token.slice(index + 1);
  if (!body || !signature) return { ok: false, reason: 'malformed' };

  if (!matches(signature, sign(body))) return { ok: false, reason: 'invalid' };

  let expires: number;
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    );
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('e' in decoded) ||
      typeof decoded.e !== 'number'
    ) {
      return { ok: false, reason: 'malformed' };
    }
    expires = decoded.e;
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (expires <= now) return { ok: false, reason: 'expired' };

  // Signature verified before redeeming, so a forged token cannot burn an id.
  if (!redeemed.claim(signature, expires - now, now)) {
    return { ok: false, reason: 'replayed' };
  }
  return { ok: true };
}

function sign(body: string): string {
  return createHmac('sha256', spamEnv().ALTCHA_HMAC_KEY)
    .update(body)
    .digest('base64url');
}

/** Constant-time compare, so the signature cannot be guessed byte by byte. */
function matches(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

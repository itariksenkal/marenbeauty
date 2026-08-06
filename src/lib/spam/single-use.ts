import { SPAM_LIMITS } from '@/config/forms';

/**
 * A bounded, expiring set of ids that may each be redeemed once.
 *
 * Backs both halves of the spam contract: a solved proof of work and a page
 * token are each valid exactly once, so capturing a valid submission and
 * replaying it does not work.
 *
 * IN MEMORY ONLY, and deliberately so. CLAUDE.md §11 says the contact form
 * persists nothing; a replay-protection table would be the first thing to
 * quietly break that. The trade is honest and bounded: a restart forgets what
 * has been redeemed, and a replay inside the challenge TTL would succeed once
 * after a restart. Proof of work still had to be paid for that submission.
 *
 * Capacity is capped so a flood cannot grow this without limit. When full, the
 * oldest entries go first — they are also the closest to expiring, since ids
 * are inserted in time order.
 */
export class SingleUseStore {
  private readonly seen = new Map<string, number>();

  constructor(
    private readonly capacity: number = SPAM_LIMITS.singleUseCapacity,
  ) {}

  /**
   * Claim an id. Returns false if it was already claimed and is still within
   * its lifetime — that is a replay.
   */
  claim(id: string, ttlMs: number, now: number = Date.now()): boolean {
    this.prune(now);

    const expiresAt = this.seen.get(id);
    if (expiresAt !== undefined && expiresAt > now) return false;

    this.seen.set(id, now + ttlMs);
    if (this.seen.size > this.capacity) {
      // Map preserves insertion order, so the first key is the oldest.
      const oldest = this.seen.keys().next();
      if (!oldest.done) this.seen.delete(oldest.value);
    }
    return true;
  }

  /** Visible for tests. */
  get size(): number {
    return this.seen.size;
  }

  private prune(now: number): void {
    for (const [id, expiresAt] of this.seen) {
      if (expiresAt > now) break; // insertion order ≈ expiry order
      this.seen.delete(id);
    }
  }
}

/**
 * The process-wide store.
 *
 * Module scope, so it survives between requests within one server instance and
 * is shared by both verification paths.
 */
export const redeemed = new SingleUseStore();

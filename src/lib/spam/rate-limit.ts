import { SPAM_LIMITS } from '@/config/forms';

/**
 * A best-effort, in-memory, per-address rate limit.
 *
 * **This is not the primary defence** (docs/ARCHITECTURE.md §7). Proof of work
 * is. This exists to blunt the specific case proof of work does not cover: one
 * client that has legitimately solved a challenge and then submits repeatedly.
 *
 * Two limitations, both accepted rather than hidden:
 *
 *   - It is per process. Behind several replicas it becomes a per-replica
 *     limit. On a single container — which is what this site is — it is exact.
 *   - It is in memory. A restart forgets. CLAUDE.md §11 says the form persists
 *     nothing, and a rate-limit table would be persistence.
 *
 * The address is derived from proxy headers, which a client can forge. That is
 * why this is a backstop and not a gate.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateVerdict = {
  readonly allowed: boolean;
  /** Seconds until the window resets. For a `Retry-After` header. */
  readonly retryAfterSeconds: number;
};

export function takeSubmissionSlot(
  key: string,
  now: number = Date.now(),
): RateVerdict {
  prune(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, {
      count: 1,
      resetAt: now + SPAM_LIMITS.rateLimitWindowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= SPAM_LIMITS.maxSubmissionsPerWindow;
  return {
    allowed,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * The caller's address, as well as it can be known behind a proxy.
 *
 * Falls back to a single shared bucket rather than to "unlimited": an unknown
 * address is exactly the case worth limiting.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Visible for tests. */
export function resetRateLimits(): void {
  windows.clear();
}

function prune(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

'use client';

import { useCallback, useRef, useState } from 'react';

import { CONTACT_FIELDS, SPAM_LIMITS } from '@/config/forms';

import type { SolveRequest, SolveResponse } from './altcha-worker';

/**
 * Fetch a challenge and solve it, off the main thread.
 *
 * There is no widget, no checkbox and no "I am not a robot": `altcha-lib` does
 * the hashing inside our own worker, and we own the markup and the Turkish
 * strings (CLAUDE.md §2, §7). The visitor is meant never to notice this ran.
 *
 * WHEN IT RUNS. On the form's first focus, not on page load. A visitor who
 * scrolls past never pays for a hash search, and by the time anyone has
 * finished typing a message the solution is long since ready. `ensure()` is
 * called again on submit, so a fast submitter simply waits.
 *
 * WHEN IT FAILS, IT FAILS QUICKLY. A blocked worker, a 503 from the challenge
 * endpoint, an old browser or a solver that simply does not answer all resolve
 * to `null` within `powTimeoutMs`, and the signed page token carries the
 * submission instead. The first version had no timeout and a silent worker
 * left the form stuck on "gönderiliyor" — the failure mode this bounds.
 *
 * The worker is driven directly rather than through `solveChallengeWorkers`:
 * that helper speaks its own message protocol, and pairing it with a worker of
 * ours was exactly the mismatch that hung.
 */

type SolveState = 'idle' | 'solving' | 'ready' | 'unavailable';

function solveInWorker(request: SolveRequest): Promise<number | null> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./altcha-worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), SPAM_LIMITS.powTimeoutMs);
    worker.addEventListener('message', (event: MessageEvent<SolveResponse>) => {
      finish(event.data?.number ?? null);
    });
    worker.addEventListener('error', () => finish(null));
    worker.postMessage(request);
  });
}

export function useAltcha() {
  const [state, setState] = useState<SolveState>('idle');
  const payload = useRef<string | null>(null);
  const inFlight = useRef<Promise<string | null> | null>(null);

  const ensure = useCallback(async (): Promise<string | null> => {
    if (payload.current) return payload.current;
    if (inFlight.current) return inFlight.current;

    const run = (async (): Promise<string | null> => {
      try {
        setState('solving');
        const response = await fetch('/api/altcha', { cache: 'no-store' });
        if (!response.ok) throw new Error(`challenge ${response.status}`);

        const challenge: {
          algorithm: string;
          challenge: string;
          salt: string;
          signature: string;
          maxnumber?: number;
        } = await response.json();

        const number = await solveInWorker({
          challenge: challenge.challenge,
          salt: challenge.salt,
          algorithm: challenge.algorithm,
          max: challenge.maxnumber ?? SPAM_LIMITS.powMaxNumber,
        });
        if (number === null) throw new Error('unsolved');

        payload.current = btoa(
          JSON.stringify({
            algorithm: challenge.algorithm,
            challenge: challenge.challenge,
            number,
            salt: challenge.salt,
            signature: challenge.signature,
          }),
        );
        setState('ready');
        return payload.current;
      } catch {
        // No detail surfaces: the page token carries the submission instead.
        setState('unavailable');
        return null;
      } finally {
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, []);

  return { state, ensure, fieldName: CONTACT_FIELDS.altcha } as const;
}

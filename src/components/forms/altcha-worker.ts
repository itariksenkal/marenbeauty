import { solveChallenge } from 'altcha-lib/v1';

/**
 * The proof-of-work worker.
 *
 * Brute-forcing a SHA-256 preimage takes real CPU, and doing it on the main
 * thread would freeze typing in the very form it is protecting. This runs off
 * the main thread, so the visitor never notices it and never does anything —
 * "no user interaction" in the literal sense (docs/ROADMAP.md M11).
 *
 * The loop itself is `altcha-lib`'s, not ours. Reimplementing a hash search is
 * how subtle incompatibilities with the verifier get introduced.
 */

export type SolveRequest = {
  readonly challenge: string;
  readonly salt: string;
  readonly algorithm: string;
  readonly max: number;
};

export type SolveResponse = { readonly number: number | null };

self.addEventListener('message', (event: MessageEvent<SolveRequest>) => {
  const { challenge, salt, algorithm, max } = event.data;

  void solveChallenge(challenge, salt, algorithm, max)
    .promise.then((solution) => {
      const response: SolveResponse = { number: solution?.number ?? null };
      self.postMessage(response);
    })
    .catch(() => {
      // A failed solve is not an error the visitor should ever see; the form
      // falls back to the signed page token, which is always present.
      self.postMessage({ number: null } satisfies SolveResponse);
    });
});

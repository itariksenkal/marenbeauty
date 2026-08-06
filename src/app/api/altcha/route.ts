import { issueChallenge } from '@/lib/spam/challenge';

/**
 * `GET /api/altcha` — issue a proof-of-work challenge.
 *
 * **Node runtime, not Edge.** It signs with `node:crypto` via `altcha-lib`, and
 * it sits beside `/api/contact`, which must be Node because Edge cannot open an
 * SMTP socket (docs/ARCHITECTURE.md §7). Keeping both on one runtime keeps the
 * signing key in one place.
 *
 * Never cached. A cached challenge would be handed to every visitor, which
 * defeats single-use and makes the whole thing a constant.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const challenge = await issueChallenge();
    return Response.json(challenge, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    // Almost always a missing ALTCHA_HMAC_KEY in production. Say so in the log,
    // where an operator will see it; say nothing useful to the caller.
    console.error(
      '[altcha] could not issue a challenge:',
      error instanceof Error ? error.message : error,
    );
    return new Response(null, { status: 503 });
  }
}

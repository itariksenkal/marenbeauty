import { env } from '@/config/env';
import { capturedMessages, clearCapturedMessages } from '@/lib/mail/outbox';

/**
 * `GET /api/dev/outbox` — read the development capture. `DELETE` — empty it.
 *
 * This exists so a browser test can drive the real form and then assert on the
 * message that was actually composed: the envelope, the headers, the body. It
 * is the local mailbox the SMTP credential does not exist for yet
 * (docs/OPEN-QUESTIONS.md B1/B3).
 *
 * **404s in production**, like `/styleguide` and `/motion`. That is the second
 * of two independent guards — `env.ts` already refuses the capture transport
 * there, so in production this route has nothing to read AND cannot be read.
 * A production browser test asserts the 404, so the guard is exercised rather
 * than assumed.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isProduction = env.NODE_ENV === 'production';

export function GET(): Response {
  if (isProduction) return new Response(null, { status: 404 });
  return Response.json(
    { messages: capturedMessages() },
    { headers: { 'cache-control': 'no-store' } },
  );
}

export function DELETE(): Response {
  if (isProduction) return new Response(null, { status: 404 });
  clearCapturedMessages();
  return new Response(null, { status: 204 });
}

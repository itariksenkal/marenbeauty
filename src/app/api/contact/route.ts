import {
  CONTACT_FIELDS,
  contactForm,
  type ContactResult,
} from '@/config/forms';
import {
  contactSubmissionSchema,
  invalidFields,
  normaliseSubmission,
} from '@/lib/contact/schema';
import { sendContactMessage } from '@/lib/mail/transport';
import { checkSolution } from '@/lib/spam/challenge';
import { checkFormToken } from '@/lib/spam/form-token';
import { clientKey, takeSubmissionSlot } from '@/lib/spam/rate-limit';

/**
 * `POST /api/contact` — the only dynamic surface on the site.
 *
 * **Node runtime.** Edge cannot open an SMTP socket (docs/ARCHITECTURE.md §7).
 *
 * The order of checks is deliberate and is the cheapest-first order:
 *
 *   1. rate limit      — no parsing, no crypto, no I/O
 *   2. honeypot        — a string comparison
 *   3. spam gate       — HMAC verify; proof of work if JavaScript ran, the
 *                        signed page token if it did not
 *   4. Zod, strict     — unknown keys rejected
 *   5. send            — the only step that talks to the network
 *
 * A bot that fails step 1 never costs us a hash. A bot that fails step 3 never
 * costs us an SMTP connection.
 *
 * NOTHING IS PERSISTED. No database, no file, and no log line containing the
 * message body, the address or the name (CLAUDE.md §11). The failure logs below
 * carry a reason and nothing from the submission.
 *
 * TWO CALLERS, ONE HANDLER. `fetch` gets JSON; a plain form POST gets a 303
 * back to the contact page with a result in the query string, so the form works
 * with JavaScript switched off (docs/ROADMAP.md M11).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS: Record<ContactResult, number> = {
  success: 200,
  invalid: 400,
  rateLimited: 429,
  error: 500,
};

export async function POST(request: Request): Promise<Response> {
  const wantsJson = prefersJson(request);

  // 1 — rate limit, before anything expensive.
  const rate = takeSubmissionSlot(clientKey(request.headers));
  if (!rate.allowed) {
    return respond(request, wantsJson, 'rateLimited', {
      'retry-after': String(rate.retryAfterSeconds),
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await readBody(request);
  } catch {
    return respond(request, wantsJson, 'invalid');
  }

  // 2 — honeypot. Present in the DOM, hidden from people, ignored by them.
  const honeypot = body[CONTACT_FIELDS.honeypot];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    // Answer as if it worked. Telling a bot why it failed only helps it.
    return respond(request, wantsJson, 'success');
  }

  // 3 — the spam gate.
  const gate = await passesSpamGate(body);
  if (!gate.ok) {
    console.warn(`[contact] rejected: ${gate.reason}`);
    return respond(request, wantsJson, 'invalid');
  }

  // 4 — validation. The spam fields are dropped here, so they can never reach
  //     the mail template.
  const {
    [CONTACT_FIELDS.altcha]: _altcha,
    [CONTACT_FIELDS.formToken]: _token,
    [CONTACT_FIELDS.honeypot]: _honeypot,
    ...candidate
  } = body;
  const parsed = contactSubmissionSchema.safeParse(
    normaliseSubmission(candidate),
  );
  if (!parsed.success) {
    return respond(request, wantsJson, 'invalid', undefined, {
      fields: invalidFields(parsed.error),
    });
  }

  // 5 — send.
  try {
    await sendContactMessage(parsed.data);
  } catch (error) {
    // The reason stays server-side. SMTP detail never reaches the client, and
    // the visitor sees one generic message whatever went wrong.
    console.error(
      '[contact] delivery failed:',
      error instanceof Error ? error.message : error,
    );
    return respond(request, wantsJson, 'error');
  }

  return respond(request, wantsJson, 'success');
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

/**
 * Which spam credential was offered, and is it good?
 *
 * Proof of work when JavaScript ran; the signed page token when it did not.
 * Both are HMAC-signed, short-lived and single-use. A submission with neither
 * is rejected — that is the case the token exists to close.
 */
async function passesSpamGate(
  body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const solution = body[CONTACT_FIELDS.altcha];
  if (typeof solution === 'string' && solution.length > 0) {
    const result = await checkSolution(solution);
    return result.ok
      ? { ok: true }
      : { ok: false, reason: `pow:${result.reason}` };
  }

  const token = body[CONTACT_FIELDS.formToken];
  const result = checkFormToken(token);
  return result.ok
    ? { ok: true }
    : { ok: false, reason: `token:${result.reason}` };
}

/** JSON from `fetch`, form-encoded from a plain browser POST. */
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type') ?? '';

  if (type.includes('application/json')) {
    const parsed: unknown = await request.json();
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error('not an object');
    }
    return parsed as Record<string, unknown>;
  }

  const form = await request.formData();
  const entries: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    entries[key] = typeof value === 'string' ? value : undefined;
  }
  return entries;
}

/**
 * A `fetch` caller asks for JSON; a browser form POST sends
 * `application/x-www-form-urlencoded` and expects to land on a page.
 */
function prefersJson(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  const type = request.headers.get('content-type') ?? '';
  return (
    type.includes('application/json') || accept.includes('application/json')
  );
}

function respond(
  request: Request,
  wantsJson: boolean,
  result: ContactResult,
  headers?: Record<string, string>,
  extra?: { fields: readonly string[] },
): Response {
  if (!wantsJson) {
    /*
     * 303, so a refresh does not re-submit — and a RELATIVE Location.
     *
     * The first version built `new URL('/iletisim', request.url)`. In the
     * standalone server `request.url` is composed from `HOSTNAME` and `PORT`,
     * not from the Host header, so a container started with `HOSTNAME=0.0.0.0`
     * sent every no-JavaScript visitor to `http://0.0.0.0:3000/iletisim` — an
     * address that resolves nowhere. It worked on Vercel, which is precisely
     * why the portability rule requires running it in a plain container
     * (CLAUDE.md §3). Found at M16, in the container, on the first real POST.
     *
     * RFC 7231 permits a relative URI reference in `Location`, and every
     * browser resolves it against the request URL. That removes the question of
     * which origin the server thinks it is on, behind any proxy or port.
     */
    const query = new URLSearchParams({
      [contactForm.resultParam]: contactForm.resultValues[result],
    });
    const location = `/iletisim?${query.toString()}#iletisim-formu`;

    return new Response(null, {
      status: 303,
      headers: { location, ...headers },
    });
  }

  return Response.json(
    { result, ...(extra ?? {}) },
    {
      status: STATUS[result],
      headers: { 'cache-control': 'no-store', ...headers },
    },
  );
}

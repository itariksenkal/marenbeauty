import nodemailer, { type Transporter } from 'nodemailer';

import { mailEnv } from '@/config/env';
import type { ContactSubmission } from '@/lib/contact/schema';

import { captureMessage } from './outbox';
import { buildContactMail } from './templates';

/**
 * Sending, behind one interface.
 *
 * Two transports, chosen by `MAIL_TRANSPORT`:
 *
 *   `smtp`    — Google Workspace, port 587, STARTTLS, app-password auth.
 *               What production uses. Blocked on the credential
 *               (docs/OPEN-QUESTIONS.md B1/B3).
 *   `capture` — composes the identical message and hands it to an in-memory
 *               outbox instead of opening a socket. Development and tests only;
 *               `env.ts` refuses it in production.
 *
 * The composition is shared, so what the capture proves is the real path: the
 * same template, the same envelope, the same headers. Only the last hop
 * differs.
 *
 * NOTHING IS PERSISTED (CLAUDE.md §11). No database, no file, no log line
 * carrying the message or the address — see the deliberate absence of logging
 * around the send below.
 */

let cached: Transporter | null = null;

function transporter(): Transporter {
  if (cached) return cached;
  const config = mailEnv();

  if (config.MAIL_TRANSPORT === 'capture') {
    // `streamTransport` with `buffer` composes the real RFC822 message —
    // headers, encoding, MIME and all — and hands back the bytes instead of
    // writing them to a socket. Nodemailer's own dry run, not a stub we wrote,
    // which is what makes the capture worth anything as evidence.
    //
    // NOT `jsonTransport`: that returns a JSON summary rather than the
    // message, so it would prove the arguments were passed, not that a valid
    // message was produced.
    cached = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
    return cached;
  }

  cached = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    // 587 with STARTTLS, not 465 implicit TLS. `secure: false` here means
    // "upgrade after EHLO", which `requireTLS` then makes mandatory — the
    // connection fails rather than falling back to plaintext.
    secure: false,
    requireTLS: true,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });
  return cached;
}

/** Visible for tests, which switch transports between cases. */
export function resetTransport(): void {
  cached = null;
}

/**
 * Deliver one submission.
 *
 * Throws on failure. The caller turns that into the single generic Turkish
 * message the visitor sees — SMTP detail never reaches the client
 * (docs/ROADMAP.md M11).
 */
export async function sendContactMessage(
  submission: ContactSubmission,
  receivedAt: Date = new Date(),
): Promise<void> {
  const config = mailEnv();
  const mail = buildContactMail(submission, receivedAt);

  // In capture mode there is no configured mailbox, because there is no
  // credential yet and inventing a fallback address would be worse than having
  // none (the owner's instruction, and CLAUDE.md §18.7 in spirit). The envelope
  // still has to be well-formed, so the site's own domain stands in and is
  // clearly marked as such.
  const from =
    config.MAIL_TRANSPORT === 'smtp'
      ? config.MAIL_FROM
      : 'capture@localhost.invalid';
  const to =
    config.MAIL_TRANSPORT === 'smtp'
      ? config.MAIL_TO
      : 'capture@localhost.invalid';

  const info = await transporter().sendMail({
    from,
    to,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
  });

  if (config.MAIL_TRANSPORT === 'capture') {
    const raw = Buffer.isBuffer(info.message)
      ? info.message.toString('utf8')
      : String(info.message ?? '');
    captureMessage({
      at: receivedAt.toISOString(),
      envelope: info.envelope,
      messageId: info.messageId,
      raw,
    });
  }
}

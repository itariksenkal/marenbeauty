import { CONTACT_FIELDS } from '@/config/forms';
import { site } from '@/config/site';
import type { ContactSubmission } from '@/lib/contact/schema';

/**
 * The notification email.
 *
 * Plain text only. An HTML body would mean escaping visitor input into markup,
 * and there is nothing here that needs formatting — this message is read once,
 * by one person, and replied to. Text removes a whole class of injection bug
 * for no loss.
 *
 * `replyTo` is the visitor's address so hitting reply in the mailbox answers
 * them directly. `from` stays the authenticated mailbox: sending as the visitor
 * would fail SPF/DKIM and land the notification in spam (docs/DEPLOY.md).
 */

export type ContactMail = {
  readonly subject: string;
  readonly text: string;
  readonly replyTo: string;
};

/**
 * Header injection guard.
 *
 * Values that end up in a header — the subject line, `replyTo` — must not carry
 * a newline. Nodemailer encodes headers, but the cheap defence belongs at the
 * boundary too, and it costs one call.
 */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export function buildContactMail(
  submission: ContactSubmission,
  receivedAt: Date,
): ContactMail {
  const name = singleLine(submission[CONTACT_FIELDS.name]);
  const email = singleLine(submission[CONTACT_FIELDS.email]);
  const service = submission[CONTACT_FIELDS.service];
  const message = submission[CONTACT_FIELDS.message];

  const lines = [
    `${site.name} — iletişim formu`,
    '',
    `Ad: ${name}`,
    `E-posta: ${email}`,
    ...(service ? [`İlgilendiği uygulama: ${singleLine(service)}`] : []),
    `Tarih: ${receivedAt.toISOString()}`,
    '',
    'Mesaj:',
    message,
    '',
    '—',
    `Bu mesaj ${site.domain} üzerindeki iletişim formundan gönderildi.`,
  ];

  return {
    subject: `İletişim formu — ${name}`,
    text: lines.join('\n'),
    replyTo: email,
  };
}

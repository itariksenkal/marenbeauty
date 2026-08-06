import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { solveChallenge } from 'altcha-lib/v1';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import { channelHref, contact } from '@/config/contact';
import { resetServerEnv } from '@/config/env';
import { CONTACT_FIELDS, contactForm, SPAM_LIMITS } from '@/config/forms';
import {
  contactSubmissionSchema,
  invalidFields,
  normaliseSubmission,
  type ContactSubmission,
} from '@/lib/contact/schema';
import { buildContactMail } from '@/lib/mail/templates';
import { capturedMessages, clearCapturedMessages } from '@/lib/mail/outbox';
import { resetTransport, sendContactMessage } from '@/lib/mail/transport';
import { checkSolution, issueChallenge } from '@/lib/spam/challenge';
import { checkFormToken, issueFormToken } from '@/lib/spam/form-token';
import {
  clientKey,
  resetRateLimits,
  takeSubmissionSlot,
} from '@/lib/spam/rate-limit';
import { SingleUseStore } from '@/lib/spam/single-use';

/**
 * M11 — the contact form, with no SMTP credential.
 *
 * Everything the credential is not needed for is tested here for real: the
 * schema, the proof of work, the page token, replay protection, the rate limit,
 * the composed message. The send path runs against nodemailer's own JSON
 * transport, which composes the identical RFC822 message and hands it back
 * instead of opening a socket — a local capture, not a stub of our own.
 *
 * What is NOT covered, and cannot be: that Google Workspace accepts the
 * credential. That is the one remaining step (docs/OPEN-QUESTIONS.md B1/B3).
 */

const KEY = 'unit-test-altcha-key-000000000000000000';

beforeEach(() => {
  process.env.ALTCHA_HMAC_KEY = KEY;
  process.env.MAIL_TRANSPORT = 'capture';
  resetServerEnv();
  resetTransport();
  resetRateLimits();
  clearCapturedMessages();
});

afterEach(() => {
  delete process.env.MAIL_TRANSPORT;
  resetServerEnv();
  resetTransport();
});

const valid = (): ContactSubmission => ({
  [CONTACT_FIELDS.name]: 'Ayşe Y.',
  [CONTACT_FIELDS.email]: 'ornek@example.com',
  [CONTACT_FIELDS.message]: 'Cilt bakımı hakkında bilgi almak istiyorum.',
  [CONTACT_FIELDS.consent]: true,
});

/* ── Validation ───────────────────────────────────────────────────────────── */

describe('the submission schema', () => {
  it('accepts a complete submission', () => {
    expect(contactSubmissionSchema.safeParse(valid()).success).toBe(true);
  });

  it('REJECTS unknown keys rather than ignoring them', () => {
    const result = contactSubmissionSchema.safeParse({
      ...valid(),
      surprise: 'payload',
    });
    expect(result.success).toBe(false);
  });

  it('requires consent to be true, not merely present', () => {
    for (const consent of [false, 'false', undefined, null, 'maybe']) {
      const result = contactSubmissionSchema.safeParse({
        ...valid(),
        [CONTACT_FIELDS.consent]: consent,
      });
      expect(result.success, String(consent)).toBe(false);
    }
  });

  it('bounds every free-text field', () => {
    const tooLong = contactSubmissionSchema.safeParse({
      ...valid(),
      [CONTACT_FIELDS.message]: 'a'.repeat(5000),
    });
    expect(tooLong.success).toBe(false);

    const tooShort = contactSubmissionSchema.safeParse({
      ...valid(),
      [CONTACT_FIELDS.name]: 'A',
    });
    expect(tooShort.success).toBe(false);
  });

  it('rejects an address that is not one', () => {
    const result = contactSubmissionSchema.safeParse({
      ...valid(),
      [CONTACT_FIELDS.email]: 'ornek@',
    });
    expect(result.success).toBe(false);
  });

  it('names the failing fields, so they can be wired to aria-describedby', () => {
    const result = contactSubmissionSchema.safeParse({
      ...valid(),
      [CONTACT_FIELDS.email]: 'nope',
      [CONTACT_FIELDS.consent]: false,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(invalidFields(result.error)).toEqual(
      expect.arrayContaining([CONTACT_FIELDS.email, CONTACT_FIELDS.consent]),
    );
  });
});

describe('normalising a plain form POST', () => {
  it('turns a ticked checkbox into true and an absent one into false', () => {
    expect(
      normaliseSubmission({ [CONTACT_FIELDS.consent]: 'on' })[
        CONTACT_FIELDS.consent
      ],
    ).toBe(true);
    // Absent, because an unticked checkbox is simply not submitted.
    expect(normaliseSubmission({})[CONTACT_FIELDS.consent]).toBe(false);
  });

  it('treats an empty optional select as absent', () => {
    const normalised = normaliseSubmission({
      ...valid(),
      [CONTACT_FIELDS.service]: '',
    });
    expect(normalised[CONTACT_FIELDS.service]).toBeUndefined();
    expect(contactSubmissionSchema.safeParse(normalised).success).toBe(true);
  });
});

/* ── Proof of work ────────────────────────────────────────────────────────── */

/**
 * Proof of work costs real CPU — that is the entire point of it — and the
 * production difficulty is what these tests exercise. Five seconds is not
 * enough under a parallel run, and lowering the difficulty for tests would mean
 * testing something the site does not ship.
 */
describe('the Altcha challenge', { timeout: 30_000 }, () => {
  const solve = async () => {
    const challenge = await issueChallenge();
    const solution = await solveChallenge(
      challenge.challenge,
      challenge.salt,
      challenge.algorithm,
      challenge.maxnumber,
    ).promise;
    expect(solution).not.toBeNull();
    return {
      challenge,
      payload: Buffer.from(
        JSON.stringify({
          algorithm: challenge.algorithm,
          challenge: challenge.challenge,
          number: solution!.number,
          salt: challenge.salt,
          signature: challenge.signature,
        }),
      ).toString('base64'),
    };
  };

  it('is signed and carries an expiry', async () => {
    const challenge = await issueChallenge();
    expect(challenge.signature).toMatch(/^[0-9a-f]{16,}$/i);
    expect(challenge.salt).toContain('expires=');
  });

  it('issues a different challenge every time', async () => {
    const [a, b] = await Promise.all([issueChallenge(), issueChallenge()]);
    expect(a.challenge).not.toBe(b.challenge);
  });

  it('accepts a correctly solved payload', async () => {
    const { payload } = await solve();
    expect(await checkSolution(payload)).toEqual({ ok: true });
  });

  it('rejects the SAME payload a second time — no replay', async () => {
    const { payload } = await solve();
    expect(await checkSolution(payload)).toEqual({ ok: true });
    expect(await checkSolution(payload)).toEqual({
      ok: false,
      reason: 'replayed',
    });
  });

  it('rejects a payload whose number is wrong', async () => {
    const { challenge } = await solve();
    const forged = Buffer.from(
      JSON.stringify({
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        number: 1,
        salt: challenge.salt,
        signature: challenge.signature,
      }),
    ).toString('base64');
    expect((await checkSolution(forged)).ok).toBe(false);
  });

  it('rejects a payload signed with a different key', async () => {
    const { payload } = await solve();
    process.env.ALTCHA_HMAC_KEY = 'a-completely-different-key-0000000000';
    resetServerEnv();
    expect(await checkSolution(payload)).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects rubbish without throwing', async () => {
    for (const value of ['', 'not-base64!!', undefined, 42, null]) {
      expect((await checkSolution(value)).ok, String(value)).toBe(false);
    }
  });
});

/* ── The no-JavaScript page token ─────────────────────────────────────────── */

describe('the page token', () => {
  it('round-trips', () => {
    expect(checkFormToken(issueFormToken())).toEqual({ ok: true });
  });

  it('is single-use', () => {
    const token = issueFormToken();
    expect(checkFormToken(token)).toEqual({ ok: true });
    expect(checkFormToken(token)).toEqual({ ok: false, reason: 'replayed' });
  });

  it('rejects a tampered body', () => {
    const token = issueFormToken();
    const [, signature] = token.split('.');
    const forged = `${Buffer.from('{"n":"x","e":99999999999999}').toString('base64url')}.${signature}`;
    expect(checkFormToken(forged)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('expires', () => {
    const token = issueFormToken();
    const later = Date.now() + SPAM_LIMITS.challengeTtlMs + 1000;
    expect(checkFormToken(token, later)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects rubbish', () => {
    for (const value of [undefined, '', 'no-separator', 42, {}]) {
      expect(checkFormToken(value).ok, String(value)).toBe(false);
    }
  });
});

describe('single-use storage', () => {
  it('claims once and refuses a replay inside the lifetime', () => {
    const store = new SingleUseStore(10);
    expect(store.claim('a', 1000, 0)).toBe(true);
    expect(store.claim('a', 1000, 500)).toBe(false);
  });

  it('forgets an id once it has expired', () => {
    const store = new SingleUseStore(10);
    store.claim('a', 1000, 0);
    expect(store.claim('a', 1000, 2000)).toBe(true);
  });

  it('stays bounded under flood', () => {
    const store = new SingleUseStore(5);
    for (let i = 0; i < 500; i++) store.claim(`id-${i}`, 60_000, 0);
    expect(store.size).toBeLessThanOrEqual(5);
  });
});

/* ── Rate limiting ────────────────────────────────────────────────────────── */

describe('the rate limit', () => {
  it('allows the window and then refuses', () => {
    for (let i = 0; i < SPAM_LIMITS.maxSubmissionsPerWindow; i++) {
      expect(takeSubmissionSlot('1.2.3.4', 0).allowed, `attempt ${i}`).toBe(
        true,
      );
    }
    const blocked = takeSubmissionSlot('1.2.3.4', 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('is per address', () => {
    for (let i = 0; i < SPAM_LIMITS.maxSubmissionsPerWindow; i++) {
      takeSubmissionSlot('1.2.3.4', 0);
    }
    expect(takeSubmissionSlot('5.6.7.8', 0).allowed).toBe(true);
  });

  it('resets after the window', () => {
    for (let i = 0; i <= SPAM_LIMITS.maxSubmissionsPerWindow; i++) {
      takeSubmissionSlot('1.2.3.4', 0);
    }
    const later = SPAM_LIMITS.rateLimitWindowMs + 1;
    expect(takeSubmissionSlot('1.2.3.4', later).allowed).toBe(true);
  });

  it('buckets an unknown address rather than exempting it', () => {
    expect(clientKey(new Headers())).toBe('unknown');
    expect(
      clientKey(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' })),
    ).toBe('9.9.9.9');
  });
});

/* ── The message ──────────────────────────────────────────────────────────── */

describe('the composed mail', () => {
  const at = new Date('2026-08-06T09:00:00.000Z');

  it('carries the submission and replies to the sender', () => {
    const mail = buildContactMail(
      { ...valid(), [CONTACT_FIELDS.service]: 'Hydrafacial' },
      at,
    );
    expect(mail.replyTo).toBe('ornek@example.com');
    expect(mail.subject).toContain('Ayşe Y.');
    expect(mail.text).toContain('ornek@example.com');
    expect(mail.text).toContain('Hydrafacial');
    expect(mail.text).toContain('Cilt bakımı hakkında bilgi almak istiyorum.');
  });

  it('omits the service line when none was chosen', () => {
    expect(buildContactMail(valid(), at).text).not.toContain(
      'İlgilendiği uygulama',
    );
  });

  it('cannot be used to inject a header', () => {
    const mail = buildContactMail(
      {
        ...valid(),
        [CONTACT_FIELDS.name]: 'Ayşe\r\nBcc: someone@example.com',
      },
      at,
    );
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.replyTo).not.toMatch(/[\r\n]/);
  });
});

/**
 * Turkish text is base64 or quoted-printable encoded in transit, so asserting
 * on the raw bytes would only prove the encoder ran. Decode first.
 */
function decodeBody(raw: string): string {
  const [headers, ...rest] = raw.split(/\r?\n\r?\n/);
  const body = rest.join('\n\n');
  if (/content-transfer-encoding:\s*base64/i.test(headers ?? '')) {
    return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8');
  }
  if (/content-transfer-encoding:\s*quoted-printable/i.test(headers ?? '')) {
    return Buffer.from(
      body
        .replace(/=\r?\n/g, '')
        .replace(/=([0-9A-F]{2})/g, (_, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        ),
      'binary',
    ).toString('utf8');
  }
  return body;
}

describe('the send path, against a local capture', () => {
  it('composes a real RFC822 message and captures it', async () => {
    await sendContactMessage(valid(), new Date('2026-08-06T09:00:00.000Z'));

    const messages = capturedMessages();
    expect(messages).toHaveLength(1);

    const raw = messages[0]!.raw;
    // A real MIME message, not a summary of the arguments.
    expect(raw).toMatch(/^Content-Type: text\/plain/m);
    expect(raw).toMatch(/^Subject: /m);
    expect(raw).toMatch(/^Reply-To: .*ornek@example\.com/m);
    expect(raw).toMatch(/^Message-ID: </m);
    expect(raw).toMatch(/^MIME-Version: 1\.0/m);
    // The body survives transfer-encoding.
    expect(decodeBody(raw)).toContain(
      'Cilt bakımı hakkında bilgi almak istiyorum.',
    );
  });

  it('addresses the envelope, and never to an invented mailbox', async () => {
    await sendContactMessage(valid());
    const envelope = capturedMessages()[0]!.envelope as {
      from: string;
      to: string[];
    };
    // No credential exists yet, so no real address may appear anywhere.
    expect(envelope.from).toContain('.invalid');
    expect(envelope.to.join(',')).toContain('.invalid');
    expect(JSON.stringify(envelope)).not.toContain('marenbeauty.com');
  });
});

/* ── Configuration guards ─────────────────────────────────────────────────── */

describe('environment', () => {
  it('refuses the capture transport in production', () => {
    // `NODE_ENV` is read-only in this process and the public env is parsed at
    // import, so the production branch cannot be entered from here. The guard
    // is asserted at the source instead, and the browser suite proves the
    // other half: `/api/dev/outbox` 404s in the production build.
    const source = readFileSync(
      join(process.cwd(), 'src/config/env.ts'),
      'utf8',
    );
    expect(source).toContain('MAIL_TRANSPORT=capture is refused in production');
    expect(source).toMatch(/env\.NODE_ENV === 'production'/);
  });

  it('requires a real signing key in production, and only falls back below it', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/config/env.ts'),
      'utf8',
    );
    // The ephemeral key is a development convenience. A per-instance key in
    // production would break verification the moment there are two instances.
    expect(source).toMatch(
      /if \(env\.NODE_ENV === 'production'\) return undefined;/,
    );
  });

  it('names the missing SMTP variables and echoes no value', async () => {
    // This is the state the site is in right now: no credential, so a send
    // fails. It has to fail LOUDLY in the log and SILENTLY to the visitor.
    process.env.MAIL_TRANSPORT = 'smtp';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PASS;
    resetServerEnv();
    resetTransport();

    await expect(sendContactMessage(valid())).rejects.toThrow(/SMTP_HOST/);
    await expect(sendContactMessage(valid())).rejects.toThrow(/SMTP_PASS/);

    const message = await sendContactMessage(valid()).catch(
      (error: Error) => error.message,
    );
    // Points at the file that documents every variable…
    expect(message).toContain('.env.example');
    // …and echoes no secret value it happens to have.
    expect(message).not.toContain(KEY);
  });
});

/* ── Copy and contract ────────────────────────────────────────────────────── */

const sources: { file: string; text: string }[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full))
      sources.push({
        file: full.split(sep).join('/'),
        text: readFileSync(full, 'utf8'),
      });
  }
};
walk(join(process.cwd(), 'src'));

const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const read = (relative: string) =>
  stripComments(sources.find((s) => s.file.endsWith(relative))?.text ?? '');

describe('form copy', () => {
  const allCopy = JSON.stringify(contactForm);

  it('passes the guard on both tiers', () => {
    // `/iletisim` is rendered per request, so it emits no prerendered HTML for
    // `npm run guard` to scan. The copy is scanned here instead, with the same
    // rules (docs/OPEN-QUESTIONS.md G21).
    const found = scanText(allCopy, { file: 'src/config/forms.ts' });
    expect(found.map((v) => `${v.rule}: ${v.matched}`)).toEqual([]);
  });

  it('promises no response time and no opening date', () => {
    expect(allCopy).not.toMatch(/\d+\s*(saat|gün|dakika|iş günü)/i);
    expect(allCopy).not.toMatch(/20\d{2}/);
  });

  it('says one generic thing for every server-side failure', () => {
    // An SMTP error, a rejected challenge and a missing credential must be
    // indistinguishable to the visitor.
    expect(contactForm.status.error).not.toMatch(/smtp|sunucu|hata kodu/i);
  });
});

describe('the data-channel contract', () => {
  it('every channel link carries data-channel', () => {
    expect(read('components/sections/ContactChannels.tsx')).toContain(
      'data-channel={key}',
    );
  });

  it('no channel is configured, so none renders', () => {
    expect(Object.values(contact).every((entry) => entry === null)).toBe(true);
    for (const key of ['whatsapp', 'phone', 'email', 'instagram'] as const) {
      expect(channelHref(key), key).toBeNull();
    }
  });

  it('the form page contains no Turkish sentence of its own', () => {
    const turkishSentence = /['"`][^'"`\n]*\s(bir|ve|için|ile)\s[^'"`\n]*['"`]/;
    for (const file of [
      'app/iletisim/page.tsx',
      'components/forms/ContactForm.tsx',
      'components/forms/FormField.tsx',
      'components/forms/FormStatus.tsx',
    ]) {
      expect(turkishSentence.test(read(file)), file).toBe(false);
    }
  });
});

describe('the route handlers', () => {
  it('both run on the Node runtime — Edge cannot open SMTP', () => {
    for (const file of [
      'app/api/contact/route.ts',
      'app/api/altcha/route.ts',
    ]) {
      expect(read(file), file).toMatch(/export const runtime = 'nodejs'/);
    }
  });

  it('the contact handler persists nothing', () => {
    const handler = read('app/api/contact/route.ts');
    expect(handler).not.toMatch(/writeFile|appendFile|createWriteStream/);
    expect(handler).not.toMatch(/\bdb\b|prisma|sqlite/i);
  });

  it('no log line carries the submission', () => {
    const handler = read('app/api/contact/route.ts');
    const logs = handler.match(/console\.(log|warn|error)\([^)]*\)/g) ?? [];
    for (const line of logs) {
      expect(line).not.toContain('parsed.data');
      expect(line).not.toContain('body');
      expect(line).not.toContain(CONTACT_FIELDS.email);
    }
  });
});

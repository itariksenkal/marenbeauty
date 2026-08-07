import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/**
 * Environment variables, parsed with Zod, with a clear failure.
 *
 * THREE TIERS, and the split between the last two is load-bearing:
 *
 *   PUBLIC — parsed eagerly at module load. No secrets, everything optional
 *            with a sane default, so importing this can never break a build.
 *
 *   SPAM   — the challenge signing key. Needed to RENDER the contact page,
 *            because the page issues a signed token.
 *
 *   MAIL   — the SMTP credential. Needed only to SEND.
 *
 * Those last two were one blob until the contact page was first served without
 * a credential: `/iletisim` returned 500, because issuing a page token parsed
 * the whole server schema and tripped over six missing SMTP variables. A page
 * that sends nothing must not need a mail credential to render
 * (docs/OPEN-QUESTIONS.md G22). They are now parsed independently, and the
 * blocker is exactly one step: mail.
 *
 * Both secret tiers are parsed on FIRST ACCESS and memoised. `next build`
 * evaluates route modules during route collection, so an eager parse would
 * make a local build impossible without a populated `.env.local` — a worse
 * failure than the one it prevents. That is also why the contact route does not
 * assert at module scope: it verifies on the first request, logs precisely what
 * is missing, and returns the generic error.
 */

const publicSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  /*
   * Analytics identifiers — ALL OPTIONAL, and unused at launch
   * (docs/OPEN-QUESTIONS.md C5, G2). No analytics backend is deployed, so a
   * missing value must never be a startup failure: requiring them would make
   * the site refuse to boot over a measurement nobody has asked for.
   *
   * The adapter for each is behind a config flag that is `false`, so these are
   * read only once somebody deliberately turns one on.
   */
  UMAMI_SCRIPT_URL: z.url().optional(),
  UMAMI_WEBSITE_ID: z.string().min(1).optional(),
  GA4_MEASUREMENT_ID: z.string().min(1).optional(),
  META_PIXEL_ID: z.string().min(1).optional(),
});

const spamSchema = z.object({
  /**
   * Altcha proof-of-work signing key, also used for the no-JS page token.
   * 32+ chars. Generate with `openssl rand -hex 32`.
   */
  ALTCHA_HMAC_KEY: z.string().min(32),
});

const smtpSchema = z.object({
  MAIL_TRANSPORT: z.literal('smtp'),
  /** Google Workspace SMTP. Node runtime only — Edge cannot open SMTP. */
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  /**
   * SMTP_USER, MAIL_FROM and MAIL_TO are all `info@marenbeauty.com`
   * (docs/OPEN-QUESTIONS.md B1). One mailbox, one identity, no send-as alias —
   * so the authenticated account and the From header always align and
   * SPF/DKIM pass with no extra configuration.
   */
  SMTP_USER: z.email(),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.email(),
  MAIL_TO: z.email(),
});

/**
 * The development capture transport (docs/OPEN-QUESTIONS.md B1).
 *
 * Composes the message exactly as SMTP would and hands it to an in-memory
 * outbox instead of opening a socket, so the send path can be driven end to
 * end before the credential exists. **Refused outright in production** — a
 * deployment that silently swallows every enquiry is worse than one that fails
 * loudly.
 */
const captureSchema = z.object({ MAIL_TRANSPORT: z.literal('capture') });

export type PublicEnv = z.infer<typeof publicSchema>;
export type SpamEnv = z.infer<typeof spamSchema>;
export type MailEnv =
  z.infer<typeof smtpSchema> | z.infer<typeof captureSchema>;

function fail(issues: z.core.$ZodIssue[], tier: string): never {
  const lines = issues.map(
    (i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`,
  );
  throw new Error(
    `Invalid ${tier} environment:\n${lines.join('\n')}\n\n` +
      `See .env.example for every variable and what it is for.`,
  );
}

const publicParsed = publicSchema.safeParse(process.env);
if (!publicParsed.success) fail(publicParsed.error.issues, 'public');

export const env: PublicEnv = publicParsed.data;

let spamCache: SpamEnv | null = null;
let mailCache: MailEnv | null = null;
let ephemeralKey: string | null = null;

/**
 * Outside production, an absent signing key becomes a per-process random one.
 *
 * `npm run dev` and the test suite should not require a secret to boot, and a
 * key that changes on restart is harmless when every challenge lives for
 * minutes. In production the key is REQUIRED: a per-instance key would break
 * verification the moment there are two instances.
 */
function altchaKey(): string | undefined {
  const configured = process.env.ALTCHA_HMAC_KEY;
  if (configured) return configured;
  if (env.NODE_ENV === 'production') return undefined;

  if (!ephemeralKey) {
    ephemeralKey = randomBytes(32).toString('hex');
    console.warn(
      '\n  ⚠ ALTCHA_HMAC_KEY is not set. Using a random per-process key.\n' +
        '    Fine for development. Production requires a real one — see .env.example.\n',
    );
  }
  return ephemeralKey;
}

/**
 * The challenge signing key. Server only — never call this from a Client
 * Component.
 */
export function spamEnv(): SpamEnv {
  if (spamCache) return spamCache;

  const parsed = spamSchema.safeParse({ ALTCHA_HMAC_KEY: altchaKey() });
  if (!parsed.success) fail(parsed.error.issues, 'spam');
  spamCache = parsed.data;
  return spamCache;
}

/**
 * The mail credential. Throws on first access if anything is missing, naming
 * every absent variable — which is what the contact route logs when a send
 * cannot happen.
 */
export function mailEnv(): MailEnv {
  if (mailCache) return mailCache;

  const transport = process.env.MAIL_TRANSPORT ?? 'smtp';

  if (transport === 'capture') {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        `MAIL_TRANSPORT=capture is refused in production. It captures mail to ` +
          `memory instead of sending it, so a deployment using it would accept ` +
          `every enquiry and deliver none. Set real SMTP credentials instead.`,
      );
    }
    const parsed = captureSchema.safeParse({ MAIL_TRANSPORT: 'capture' });
    if (!parsed.success) fail(parsed.error.issues, 'mail');
    mailCache = parsed.data;
    return mailCache;
  }

  const parsed = smtpSchema.safeParse({
    ...process.env,
    MAIL_TRANSPORT: 'smtp',
  });
  if (!parsed.success) fail(parsed.error.issues, 'mail');
  mailCache = parsed.data;
  return mailCache;
}

/** Visible for tests, which need a clean parse per case. */
export function resetServerEnv(): void {
  spamCache = null;
  mailCache = null;
  ephemeralKey = null;
}

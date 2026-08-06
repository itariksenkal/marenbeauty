import { z } from 'zod';

/**
 * Environment variables, parsed once with Zod, with a clear failure.
 *
 * Split into two tiers on purpose:
 *
 *   PUBLIC  — parsed eagerly at module load. No secrets, everything optional
 *             with a sane default, so importing this can never break a build.
 *
 *   SERVER  — secrets. Parsed on FIRST ACCESS and memoised, so the parse still
 *             happens exactly once, but a build that never sends mail does not
 *             require production mail credentials to be present. `next build`
 *             evaluates route modules during route collection; an eager parse
 *             of required secrets would make a local build impossible without
 *             a populated .env.local, which is a worse failure than the one it
 *             prevents.
 *
 * The contact route (M11) reads `serverEnv()` at module scope, so a
 * misconfigured deployment fails immediately and loudly rather than silently
 * accepting submissions it cannot deliver.
 */

const publicSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const serverSchema = z.object({
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
  /** Altcha proof-of-work signing key. 32+ bytes, hex. */
  ALTCHA_HMAC_KEY: z.string().min(32),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

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

let serverCache: ServerEnv | null = null;

/**
 * Server-only secrets. Throws on the first access if anything is missing.
 * Never call this from a Client Component — it would leak SMTP credentials
 * into the browser bundle.
 */
export function serverEnv(): ServerEnv {
  if (serverCache) return serverCache;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) fail(parsed.error.issues, 'server');

  serverCache = parsed.data;
  return serverCache;
}

/**
 * Eager validation for a server entry point that wants to fail at startup
 * rather than on first request. M11 calls this from the contact route module.
 */
export function assertServerEnv(): void {
  serverEnv();
}

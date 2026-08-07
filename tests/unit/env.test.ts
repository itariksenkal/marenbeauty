import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The environment layer, and one specific way it used to break a deployment.
 *
 * `src/config/env.ts` promises in its own header that the PUBLIC tier is
 * "everything optional with a sane default, so importing this can never break
 * a build". It could. `.optional()` skips `undefined` and only `undefined`, so
 * a variable set to the empty string — the exact thing you get by copying
 * `UMAMI_SCRIPT_URL=` out of `.env.example` into a hosting dashboard — arrived
 * at `z.url()` as `''` and threw at module load, on a value the site does not
 * use at launch.
 *
 * That is worth a test rather than a comment: the module is imported by the
 * root layout, so the failure lands on every route at once, and it only
 * appears in an environment configured the way a first-time deploy configures
 * it. Nothing in local development or CI sets an empty variable.
 */

const PUBLIC_VARS = [
  'UMAMI_SCRIPT_URL',
  'UMAMI_WEBSITE_ID',
  'GA4_MEASUREMENT_ID',
  'META_PIXEL_ID',
] as const;

const SECRET_VARS = [
  'ALTCHA_HMAC_KEY',
  'MAIL_TRANSPORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'MAIL_TO',
] as const;

const ALL = [...PUBLIC_VARS, ...SECRET_VARS, 'NODE_ENV'] as const;

/**
 * `vi.stubEnv` rather than assigning `process.env.X`, because `NODE_ENV` is
 * typed read-only and this suite has to set it to reach the production branch.
 * `unstubAllEnvs` also restores the real environment without a manual snapshot.
 */
function setEnv(key: string, value: string | undefined): void {
  vi.stubEnv(key, value);
}

beforeEach(() => {
  for (const key of ALL) setEnv(key, undefined);
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('public tier', () => {
  it('imports with nothing set at all', async () => {
    const { env } = await import('@/config/env');
    expect(env.NODE_ENV).toBe('development');
    expect(env.UMAMI_SCRIPT_URL).toBeUndefined();
  });

  it('imports when every optional variable is set to the empty string', async () => {
    for (const key of PUBLIC_VARS) setEnv(key, '');

    const { env } = await import('@/config/env');

    for (const key of PUBLIC_VARS) expect(env[key]).toBeUndefined();
  });

  it('imports when an optional variable is whitespace only', async () => {
    setEnv('UMAMI_SCRIPT_URL', '   ');
    const { env } = await import('@/config/env');
    expect(env.UMAMI_SCRIPT_URL).toBeUndefined();
  });

  it('falls back to the default when NODE_ENV is empty', async () => {
    setEnv('NODE_ENV', '');
    const { env } = await import('@/config/env');
    expect(env.NODE_ENV).toBe('development');
  });

  it('still rejects a value that is present and wrong', async () => {
    setEnv('UMAMI_SCRIPT_URL', 'not-a-url');
    await expect(import('@/config/env')).rejects.toThrow(/Invalid public/);
  });

  it('keeps a real value untouched', async () => {
    setEnv('UMAMI_SCRIPT_URL', 'https://analytics.example.com/script.js');
    const { env } = await import('@/config/env');
    expect(env.UMAMI_SCRIPT_URL).toBe(
      'https://analytics.example.com/script.js',
    );
  });
});

describe('secret tiers', () => {
  it('treats an empty signing key as absent outside production', async () => {
    setEnv('ALTCHA_HMAC_KEY', '');
    const { spamEnv, resetServerEnv } = await import('@/config/env');
    resetServerEnv();

    // An ephemeral key is generated rather than the empty string failing
    // `min(32)` with a message that reads as though a bad key were supplied.
    expect(spamEnv().ALTCHA_HMAC_KEY).toHaveLength(64);
  });

  it('does not mistake an empty key for a configured one in production', async () => {
    setEnv('NODE_ENV', 'production');
    setEnv('ALTCHA_HMAC_KEY', '');
    const { spamEnv, resetServerEnv } = await import('@/config/env');
    resetServerEnv();

    expect(() => spamEnv()).toThrow(/Invalid spam/);
  });

  it('reports an empty SMTP variable as missing, not as malformed', async () => {
    for (const key of SECRET_VARS) setEnv(key, '');
    const { mailEnv, resetServerEnv } = await import('@/config/env');
    resetServerEnv();

    // The distinction matters when somebody is reading the build log at 2am:
    // "expected string, received undefined" sends them to the dashboard,
    // "too small" sends them hunting for a truncated password.
    expect(() => mailEnv()).toThrow(/SMTP_HOST/);
  });

  it('accepts a credential whose value has meaningful surrounding characters', async () => {
    setEnv('MAIL_TRANSPORT', 'smtp');
    setEnv('SMTP_HOST', 'smtp.gmail.com');
    setEnv('SMTP_PORT', '465');
    setEnv('SMTP_USER', 'info@marenbeauty.com');
    setEnv('SMTP_PASS', ' pass word ');
    setEnv('MAIL_FROM', 'info@marenbeauty.com');
    setEnv('MAIL_TO', 'info@marenbeauty.com');

    const { mailEnv, resetServerEnv } = await import('@/config/env');
    resetServerEnv();

    const parsed = mailEnv();
    expect(parsed.MAIL_TRANSPORT).toBe('smtp');
    // Trimming here would silently corrupt a password that legitimately has
    // outer spaces. Only whitespace-ONLY values are treated as absent.
    expect('SMTP_PASS' in parsed && parsed.SMTP_PASS).toBe(' pass word ');
  });
});

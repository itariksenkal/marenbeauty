/**
 * Launch preflight — the gate a PRODUCTION DEPLOY must pass.
 *
 * `npm run verify` proves the code is correct. This proves the deployment is
 * allowed to exist: that nothing shipping to a live domain is still a
 * placeholder that only a human can resolve.
 *
 * It is deliberately NOT part of `npm run verify`. Verify runs on every commit
 * and in CI, where these values are legitimately absent; blocking it would mean
 * no commit could ever be green until the owner finished paperwork. Preflight
 * runs in the deploy build command instead (`vercel.json`), so the failure lands
 * exactly where it matters: between "pushed" and "live".
 *
 * Why this exists at all: docs/ROADMAP.md M12 gates the unresolved legal entity
 * on `npm run guard`, which fails the build when a `{{…}}` token reaches output.
 * That gate is intact and still proven by test — but the legal pages no longer
 * PRINT the token, because a page that prints it cannot be shipped at all and
 * `npm run verify` could never be green while B2 is open. The requirement moved
 * here, and grew: preflight also refuses an unreviewed legal text and a missing
 * mail credential, neither of which the guard could ever have seen.
 * See docs/OPEN-QUESTIONS.md G24.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const LEGAL_ENTITY_TOKEN = '{{LEGAL_ENTITY}}';

/** Read a boolean literal out of a config file, so config stays the one source. */
function configFlag(file, key) {
  const source = readFileSync(join(root, file), 'utf8');
  const match = source.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
  if (!match) {
    throw new Error(
      `preflight: could not find \`${key}\` in ${file}. The check is stale — ` +
        `fix the check, do not delete it.`,
    );
  }
  return match[1] === 'true';
}

const checks = [
  {
    id: 'legal-entity',
    describe: 'Registered legal entity (ünvan) is resolved',
    run: () => {
      const value = process.env.LEGAL_ENTITY?.trim();
      if (!value || value === LEGAL_ENTITY_TOKEN) {
        return (
          `LEGAL_ENTITY is not set.\n` +
          `      The KVKK, çerez and kullanım koşulları pages must name the data\n` +
          `      controller. It has never been invented and must not be now\n` +
          `      (docs/OPEN-QUESTIONS.md B2).\n` +
          `      Fix: set LEGAL_ENTITY to the registered ünvan in the deployment\n` +
          `      environment. No code change.`
        );
      }
      return null;
    },
  },
  {
    id: 'legal-review',
    describe: 'Legal text has been reviewed',
    run: () =>
      configFlag('src/config/legal.ts', 'isLawyerReviewed')
        ? null
        : `src/config/legal.ts has isLawyerReviewed: false.\n` +
          `      The three legal pages are still marked as drafts on screen\n` +
          `      (docs/OPEN-QUESTIONS.md C8).\n` +
          `      Fix: after the owner's lawyer signs off, set isLawyerReviewed: true\n` +
          `      and set legal.effectiveDate.`,
  },
  {
    id: 'mail',
    describe: 'Contact form can actually deliver',
    run: () => {
      const transport = process.env.MAIL_TRANSPORT ?? 'smtp';
      if (transport === 'capture') {
        return (
          `MAIL_TRANSPORT=capture captures mail to memory instead of sending it.\n` +
          `      A deployment using it accepts every enquiry and delivers none.\n` +
          `      Fix: unset MAIL_TRANSPORT and set the SMTP credential.`
        );
      }
      const required = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'MAIL_FROM',
        'MAIL_TO',
      ];
      const missing = required.filter((name) => !process.env[name]);
      if (missing.length) {
        return (
          `Missing SMTP variables: ${missing.join(', ')}.\n` +
          `      The contact form is the only conversion path on the site\n` +
          `      (docs/OPEN-QUESTIONS.md B1/B3).\n` +
          `      Fix: set them in the deployment environment. No code change.`
        );
      }
      return null;
    },
  },
  {
    id: 'spam-key',
    describe: 'Spam gate has a stable signing key',
    run: () => {
      const key = process.env.ALTCHA_HMAC_KEY ?? '';
      if (key.length < 32) {
        return (
          `ALTCHA_HMAC_KEY is missing or shorter than 32 characters.\n` +
          `      Outside production the app falls back to a random per-process key.\n` +
          `      In production that breaks verification the moment there are two\n` +
          `      instances, and the contact form stops accepting valid submissions.\n` +
          `      Fix: openssl rand -hex 32`
        );
      }
      return null;
    },
  },
];

function main() {
  console.log('\n  preflight: production deployment readiness\n');

  const failures = [];
  for (const check of checks) {
    let problem;
    try {
      problem = check.run();
    } catch (error) {
      problem = error.message;
    }
    if (problem) {
      failures.push({ check, problem });
      console.log(`    ✗ ${check.describe}`);
      console.log(`      ${problem}\n`);
    } else {
      console.log(`    ✓ ${check.describe}`);
    }
  }

  if (failures.length) {
    console.error(
      `\n  ✗ preflight: ${failures.length} of ${checks.length} checks failed.\n` +
        `    The site is not allowed to go live in this state. Every item above is\n` +
        `    a value the owner supplies — none of them is a code change, and none\n` +
        `    of them may be guessed. See docs/STATUS.md.\n`,
    );
    process.exit(1);
  }

  console.log('\n  ✓ preflight: ready to deploy.\n');
}

main();

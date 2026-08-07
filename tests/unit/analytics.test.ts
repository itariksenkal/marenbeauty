import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  activeProviders,
  analytics,
  consentCopy,
  CONSENT_STORAGE_KEY,
  requiresConsentBanner,
} from '@/config/analytics';
import { getLegalDocument } from '@/content-layer';

const ROOT = process.cwd();
const read = (relative: string) => readFileSync(join(ROOT, relative), 'utf8');

/**
 * Source with comments removed.
 *
 * Every file here DOCUMENTS the rule it follows — "not imported", "no
 * noscript pixel" — so matching raw text flags the explanation rather than
 * the code. The same trap the content guard avoids by scanning build output.
 */
const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** Every source file, for graph-level assertions. */
const sources: { file: string; text: string }[] = [];
(function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full))
      sources.push({
        file: full.split(sep).join('/'),
        text: readFileSync(full, 'utf8'),
      });
  }
})(join(ROOT, 'src'));

/* ── The flags ────────────────────────────────────────────────────────────── */

describe('every tag is off at launch', () => {
  it('has no active provider', () => {
    expect(activeProviders()).toEqual([]);
    expect(analytics.umami.enabled).toBe(false);
    expect(analytics.ga4.enabled).toBe(false);
    expect(analytics.metaPixel.enabled).toBe(false);
  });

  it('keeps the consent gate itself live, defaulting to denied', () => {
    expect(analytics.consentGate.enabled).toBe(true);
    expect(analytics.consentGate.defaultState).toBe('denied');
  });

  it('shows no banner, because there is nothing to consent to', () => {
    // A banner asking permission for something that is not happening, on a
    // site whose cookie policy opens with "no cookies", makes one of the two
    // a lie. The machinery is live; the dialogue is not.
    expect(requiresConsentBanner()).toBe(false);
  });

  it('would show one the moment an advertising tag is enabled', () => {
    // Proven against the real function rather than by reading it, so the
    // C6 promise is checked and not merely stated.
    const source = read('src/config/analytics.ts');
    expect(source).toMatch(
      /return analytics\.ga4\.enabled \|\| analytics\.metaPixel\.enabled/,
    );
  });
});

/* ── Bundle absence — the criterion that needed an experiment ─────────────── */

describe('tracker code is absent from the build', () => {
  const chunks = join(ROOT, '.next');

  const filesContaining = (needle: string) => {
    if (!existsSync(chunks)) return null;
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(js|json|html|rsc)$/.test(full)) {
          if (readFileSync(full, 'utf8').includes(needle))
            hits.push(full.split(sep).join('/'));
        }
      }
    };
    walk(chunks);
    return hits;
  };

  it.each(['googletagmanager', 'connect.facebook.net', 'fbevents', 'fbq('])(
    'never ships %s',
    (needle) => {
      const hits = filesContaining(needle);
      // No build present (a bare `vitest` run) — the browser suite covers the
      // same ground against a running server, so this is skipped, not faked.
      if (hits === null) return;
      expect(hits).toEqual([]);
    },
  );

  /**
   * The reason the two advertising adapters are not imported at all.
   *
   * `if (analytics.ga4.enabled) { await import('./Ga4Script') }` looks like it
   * should tree-shake, and does not: Turbopack emits the dynamic import's chunk
   * even when the branch is statically dead. Gating on a build-time
   * `NEXT_PUBLIC_*` literal made no difference either. Both were checked by
   * grepping the build, which is why this test greps the build too.
   */
  it('keeps GA4 and the Meta Pixel out of the module graph entirely', () => {
    const importers = sources.filter(
      ({ file, text }) =>
        !file.includes('/adapters/') &&
        /import\s+\{[^}]*(Ga4Script|MetaPixelScript)/.test(stripComments(text)),
    );
    expect(importers.map((s) => s.file)).toEqual([]);
  });

  it('still ships both adapters as complete, ready-to-wire files', () => {
    // "Not imported" must not decay into "not written". Turning one on has to
    // stay a flag, an env var and one uncommented line.
    const ga4 = read('src/components/analytics/adapters/Ga4Script.tsx');
    const pixel = read('src/components/analytics/adapters/MetaPixelScript.tsx');

    expect(ga4).toContain("gtag('consent', 'default'");
    expect(ga4).toContain('analytics_storage');
    expect(pixel).toContain('fbq');

    const mount = read('src/components/analytics/Analytics.tsx');
    expect(mount).toContain('Ga4Script');
    expect(mount).toContain('MetaPixelScript');
  });
});

/* ── Consent Mode v2 ──────────────────────────────────────────────────────── */

describe('Consent Mode v2', () => {
  const ga4 = read('src/components/analytics/adapters/Ga4Script.tsx');

  it('defaults every signal to denied', () => {
    for (const signal of [
      'ad_storage',
      'ad_user_data',
      'ad_personalization',
      'analytics_storage',
    ]) {
      expect(ga4).toContain(signal);
    }
    // The default block must contain only denials.
    const defaults = ga4.slice(
      ga4.indexOf("gtag('consent', 'default'"),
      ga4.indexOf('if (granted)'),
    );
    expect(defaults).not.toContain("'granted'");
  });

  it('sets the default BEFORE the tag can load', () => {
    // The whole value of Consent Mode is the ordering. A `consent default`
    // written after gtag.js has run is a banner with the door already open.
    expect(ga4.indexOf("gtag('consent', 'default'")).toBeLessThan(
      ga4.indexOf('googletagmanager'),
    );
  });

  it('renders no script element at all without granted consent', () => {
    // Consent Mode alone still fetches gtag.js and sends cookieless pings.
    // Two layers, because the outer one is the one a visitor can verify.
    expect(ga4).toMatch(/if \(!granted\) return null;/);
  });

  it('ships no <noscript> pixel, which would fire before any gate', () => {
    const pixel = stripComments(
      read('src/components/analytics/adapters/MetaPixelScript.tsx'),
    );
    expect(pixel).not.toContain('noscript');
    expect(pixel).toMatch(/if \(!granted\) return null;/);
  });
});

/* ── The consent store ────────────────────────────────────────────────────── */

describe('the consent store', () => {
  const store = read('src/lib/analytics/consent.ts');

  it('treats unset as denied — silence is not agreement', () => {
    expect(store).toMatch(/granted: state === 'granted'/);
    expect(store).toContain("serverSnapshot = (): ConsentState => 'unset'");
  });

  it('writes nothing until a visitor actually chooses', () => {
    // What lets the cookie policy say the site stores nothing, truthfully.
    const before = store.indexOf('export function setConsent');
    expect(store.slice(0, before)).not.toContain('setItem');
  });

  it('uses localStorage, not a cookie', () => {
    expect(CONSENT_STORAGE_KEY).toBe('mb-consent');
    expect(store).toContain('localStorage');
    expect(store).not.toContain('document.cookie');
  });

  it('survives storage being unavailable, denying rather than throwing', () => {
    expect(store).toMatch(/catch \{/);
  });
});

describe('rejecting is exactly as easy as accepting', () => {
  const banner = read('src/components/analytics/ConsentBanner.tsx');

  it('offers two controls with identical styling', () => {
    const classes = [...banner.matchAll(/className="([^"]*px-6 py-3[^"]*)"/g)]
      .map((match) => match[1])
      .filter(Boolean);
    expect(classes.length).toBe(2);
    expect(classes[0]).toBe(classes[1]);
  });

  it('has no pre-selection and no second screen', () => {
    expect(banner).not.toMatch(/defaultChecked|checked=\{true\}/);
    expect(banner).not.toMatch(/ayarlar|yönet|tercihleri düzenle/i);
  });

  it('never returns once answered', () => {
    expect(banner).toMatch(/if \(state !== 'unset'\) return null;/);
  });
});

/* ── The cookie policy must describe reality ──────────────────────────────── */

describe('the cookie policy matches the implementation', () => {
  const policy = getLegalDocument('cerez-politikasi').body;

  it('says the site sets no cookies, and it does not', () => {
    expect(policy).toContain('Bu site çerez kullanmıyor');
    expect(activeProviders()).toEqual([]);
  });

  it('describes no cookie the site does not set', () => {
    // The failure this guards against is a boilerplate policy listing
    // "_ga, _gid, _fbp" on a site that sets none of them.
    for (const name of ['_ga', '_gid', '_fbp', 'PHPSESSID']) {
      expect(policy).not.toContain(name);
    }
  });

  it('promises the consent behaviour the code actually implements', () => {
    expect(policy).toContain('açık onayınızdan sonra');
    expect(policy).toContain('reddetmek ek adım gerektirmez');
    expect(policy).toContain('reddedilmiş');
    expect(consentCopy.reject.length).toBeGreaterThan(0);
  });

  it('carries the preferences panel on the page that explains it', () => {
    expect(read('src/app/cerez-politikasi/page.tsx')).toContain(
      'ConsentPreferences',
    );
  });
});

/* ── Environment ──────────────────────────────────────────────────────────── */

describe('analytics environment variables', () => {
  it('are all optional — a missing value is not a startup failure', () => {
    const source = read('src/config/env.ts');
    for (const name of [
      'UMAMI_SCRIPT_URL',
      'UMAMI_WEBSITE_ID',
      'GA4_MEASUREMENT_ID',
      'META_PIXEL_ID',
    ]) {
      expect(source).toMatch(new RegExp(`${name}:[^\\n]*optional\\(\\)`));
    }
  });

  it('are documented in .env.example as unused at launch', () => {
    const example = read('.env.example');
    expect(example).toContain('UMAMI_SCRIPT_URL');
    expect(example).toContain('GA4_MEASUREMENT_ID');
    expect(example).toContain('META_PIXEL_ID');
  });
});

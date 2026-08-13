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

describe('exactly one tag is on, and it is gated', () => {
  it('has GTM as the only active provider', () => {
    // C13 turned GTM on. It did not turn anything else on, and in particular
    // GA4 and the Pixel now belong INSIDE the container rather than beside it.
    expect(activeProviders()).toEqual(['gtm']);
    expect(analytics.gtm.enabled).toBe(true);
    expect(analytics.umami.enabled).toBe(false);
    expect(analytics.ga4.enabled).toBe(false);
    expect(analytics.metaPixel.enabled).toBe(false);
  });

  it('carries the container ID in config, where it cannot fail silently', () => {
    // An env var absent from the hosting dashboard renders nothing and reports
    // nothing; the only symptom is an empty report weeks later. A container ID
    // is public by construction, so there is no secret bought by that risk.
    expect(analytics.gtm.containerId).toMatch(/^GTM-[A-Z0-9]+$/);
  });

  it('keeps the consent gate itself live, defaulting to denied', () => {
    expect(analytics.consentGate.enabled).toBe(true);
    expect(analytics.consentGate.defaultState).toBe('denied');
  });

  it('shows the banner, because there is now something to consent to', () => {
    // The mirror of the pre-C13 assertion. The banner and the policy have to
    // agree in BOTH directions: silent when nothing loads, present when
    // something does.
    expect(requiresConsentBanner()).toBe(true);
  });

  it('does not let a cookieless tag summon a banner', () => {
    // Umami is excluded from the predicate on purpose — it sets nothing and
    // identifies nobody, so enabling it must never produce a dialogue.
    const source = read('src/config/analytics.ts');
    const predicate = source.slice(
      source.indexOf('export function requiresConsentBanner'),
      source.indexOf('export function activeProviders'),
    );
    expect(predicate).toContain('analytics.gtm.enabled');
    expect(predicate).not.toContain('analytics.umami.enabled');
  });
});

/* ── Bundle absence — the criterion that needed an experiment ─────────────── */

describe('tracker code is absent from the build', () => {
  const chunks = join(ROOT, '.next');

  /**
   * Every assertion below reads the WHOLE build output, once per needle, and
   * the blog tripled in size when Batch 2 landed — three dozen posts is three
   * dozen more prerendered documents and RSC payloads to walk. The default 5s
   * became a coin toss on a cold filesystem.
   *
   * This is headroom, not leniency: the assertions are unchanged, and a
   * genuine hit still fails. Narrowing the walk instead would be the real
   * weakening — the point is that the tracker is absent EVERYWHERE.
   */
  const WALK_TIMEOUT_MS = 30_000;

  const filesContaining = (
    needle: string,
    extensions = /\.(js|json|html|rsc)$/,
  ) => {
    if (!existsSync(chunks)) return null;
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (extensions.test(full)) {
          if (readFileSync(full, 'utf8').includes(needle))
            hits.push(full.split(sep).join('/'));
        }
      }
    };
    walk(chunks);
    return hits;
  };

  it.each(['connect.facebook.net', 'fbevents', 'fbq('])(
    'never ships %s',
    (needle) => {
      const hits = filesContaining(needle);
      // No build present (a bare `vitest` run) — the browser suite covers the
      // same ground against a running server, so this is skipped, not faked.
      if (hits === null) return;
      expect(hits).toEqual([]);
    },
    WALK_TIMEOUT_MS,
  );

  /**
   * GTM is ON (C13), so `googletagmanager` is now expected in the build — and
   * the interesting assertion moved rather than disappeared.
   *
   * It must appear ONLY in client JavaScript. A hit in a `.html` document or a
   * `.rsc` payload would mean the loader is server-rendered, and a
   * server-rendered loader runs before hydration — therefore before
   * `useConsent()` has read anything, therefore before the gate. The split
   * between the two assertions below is the gate, expressed as a fact about
   * build output rather than a claim about a component.
   */
  it(
    'keeps the container out of every server-rendered document',
    () => {
      const hits = filesContaining('googletagmanager', /\.(html|rsc)$/);
      if (hits === null) return;
      expect(hits).toEqual([]);
    },
    WALK_TIMEOUT_MS,
  );

  it(
    'does ship the container in client JavaScript, so it is really wired',
    () => {
      // The other half. Without this, deleting the adapter would make the test
      // above pass perfectly while measuring nothing at all.
      const hits = filesContaining('googletagmanager', /\.js$/);
      if (hits === null) return;
      expect(hits.length).toBeGreaterThan(0);
    },
    WALK_TIMEOUT_MS,
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

/* ── Consent Mode v2 on the tag that is actually live ─────────────────────── */

describe('Consent Mode v2 — the live container', () => {
  const gtm = read('src/components/analytics/adapters/GtmScript.tsx');

  it('renders no script element at all without granted consent', () => {
    // The outer layer, and the one a visitor can check in the network panel.
    // Consent Mode by itself would still fetch gtm.js and ping cookielessly.
    expect(gtm).toMatch(/if \(!granted\) return null;/);
  });

  it('defaults every tracking signal to denied', () => {
    const defaults = gtm.slice(
      gtm.indexOf("gtag('consent','default'"),
      gtm.indexOf("gtag('consent','update'"),
    );
    for (const signal of [
      'ad_storage',
      'ad_user_data',
      'ad_personalization',
      'analytics_storage',
      'functionality_storage',
      'personalization_storage',
    ]) {
      expect(defaults).toContain(`${signal}:'denied'`);
      expect(defaults).not.toContain(`${signal}:'granted'`);
    }
  });

  it('grants only security_storage by default, which is not tracking', () => {
    // Consent Mode's `security_storage` covers fraud prevention and abuse
    // limiting. Denying it buys a visitor no privacy and breaks protections,
    // so it is the one signal that is granted before an answer — deliberately,
    // and narrowly.
    const defaults = gtm.slice(
      gtm.indexOf("gtag('consent','default'"),
      gtm.indexOf("gtag('consent','update'"),
    );
    const granted = [...defaults.matchAll(/(\w+):'granted'/g)].map((m) => m[1]);
    expect(granted).toEqual(['security_storage']);
  });

  it('sets the default BEFORE the loader can run', () => {
    // The whole value of Consent Mode is the ordering, and here it is stronger
    // than an assertion about source order: default, update and loader are in
    // ONE script element, so the order is guaranteed by JS execution rather
    // than by React deciding when an effect runs relative to an injected tag.
    const defaultAt = gtm.indexOf("gtag('consent','default'");
    const updateAt = gtm.indexOf("gtag('consent','update'");
    const loaderAt = gtm.indexOf('googletagmanager');
    expect(defaultAt).toBeGreaterThan(-1);
    expect(defaultAt).toBeLessThan(updateAt);
    expect(updateAt).toBeLessThan(loaderAt);
  });

  it('ships no <noscript> iframe, which would walk around the gate', () => {
    // Google's canonical snippet includes one. It is markup, so it loads the
    // container for a visitor with JavaScript disabled — who has no banner, no
    // way to consent and no way to refuse.
    expect(stripComments(gtm)).not.toContain('noscript');
    expect(stripComments(gtm)).not.toContain('ns.html');
  });
});

/* ── The event catalogue ──────────────────────────────────────────────────── */

describe('conversion events', () => {
  const events = read('src/lib/analytics/events.ts');
  const listener = read('src/components/analytics/AnalyticsEvents.tsx');

  it('pushes nothing at all without granted consent', () => {
    // GTM replays the whole dataLayer when it loads, so a queue built before a
    // grant would become data collected before consent and sent after it.
    expect(events).toContain('if (!isConsentGranted()) return false;');
    const guardAt = events.indexOf('isConsentGranted()');
    expect(guardAt).toBeLessThan(events.indexOf('dataLayer.push'));
  });

  it('models the site that exists, not a shop', () => {
    // No booking system and no payment (docs/BRIEF.md §6), so a purchase or
    // appointment funnel would measure something that cannot happen.
    //
    // Comments stripped first: the file explains WHY it has no purchase event,
    // so matching raw text would flag the explanation rather than the code —
    // the same trap the content guard avoids by scanning build output.
    const code = stripComments(events);
    for (const absent of [
      'purchase',
      'add_to_cart',
      'randevu',
      'begin_checkout',
    ]) {
      expect(code).not.toContain(absent);
    }
  });

  it('keeps discovery out of the conversion count', () => {
    // docs/BRIEF.md §6 puts the social profiles outside the conversion path.
    // Two events, so profile clicks can never inflate the number that
    // advertising spend is judged by.
    expect(events).toContain("event: 'iletisim_baslatildi'");
    expect(events).toContain("event: 'sosyal_profil_tiklandi'");
    expect(listener).toContain('CONVERSION_CHANNELS');
    expect(listener).toContain('SOCIAL_CHANNELS');
  });

  it('listens for the attribute the guard already mandates', () => {
    // CLAUDE.md §12 requires data-channel on every channel link, so it is
    // guaranteed present and cannot drift from guard rule 3.
    expect(listener).toContain("closest?.('[data-channel]')");
  });

  it('reports the form outcome on the no-JavaScript path too', () => {
    // The form posts for real without JS and re-renders with a query-string
    // result, never touching onSubmit. An onSubmit-only event would miss it.
    const form = read('src/components/forms/ContactForm.tsx');
    expect(form).toContain("track({ event: 'form_gonderildi'");
    const effectAt = form.indexOf('useEffect(() => {\n    if (!result');
    expect(effectAt).toBeGreaterThan(-1);
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

  it('conditions every cookie on consent, and the code actually does', () => {
    expect(policy).toContain(
      'İzin vermediğiniz sürece bu site çerez kullanmaz',
    );
    // The sentence above is only true because the loader is gated, so assert
    // the gate rather than trusting the prose. This pairing is the whole point
    // of the block: the policy and the implementation are checked together, or
    // the policy is just a sentence someone wrote once.
    expect(activeProviders()).toEqual(['gtm']);
    expect(read('src/components/analytics/adapters/GtmScript.tsx')).toMatch(
      /if \(!granted\) return null;/,
    );
  });

  it('names the one thing it does store, and why', () => {
    // The consent choice itself. Omitting it would make the policy technically
    // false the moment a visitor answers the banner.
    expect(policy).toContain(CONSENT_STORAGE_KEY);
    expect(policy).toContain('localStorage');
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

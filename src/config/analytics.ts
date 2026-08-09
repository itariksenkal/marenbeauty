/**
 * Analytics and consent.
 *
 * Three decisions drive this (docs/OPEN-QUESTIONS.md C5, C6, C13):
 *
 *   C5  — NO analytics backend is deployed. No Umami instance, no VPS, no DNS
 *         record. Still true.
 *
 *   C6  — The consent gate ships LIVE with every tag off. Advertising was
 *         expected within 12 months, and adding a gate after tracking has begun
 *         leaves a window of data collected without consent that cannot be
 *         fixed retroactively. This ordering is the only one that works.
 *
 *   C13 — 2026-08-09: **advertising is starting**, which is the condition C6 was
 *         waiting for. Google Tag Manager is enabled, behind the gate C6 built.
 *
 * C13 changes WHICH tags exist, not the rule they obey. GTM loads only after an
 * explicit grant, Consent Mode v2 still defaults to denied, and rejecting is
 * still exactly as easy as accepting. The container is measurement, not a
 * loophole: nothing in it can run before the visitor has said yes, because the
 * loader element does not render until then.
 *
 * GA4 and the Meta Pixel stay `false` and stay out of the module graph. If they
 * are ever wanted they belong INSIDE the container now, configured in the GTM
 * console, rather than as a second script tag in this repository.
 */
export type AnalyticsProvider = 'umami' | 'ga4' | 'meta-pixel' | 'gtm';

export const analytics = {
  /**
   * Cookieless, self-hosted. Chosen engine, NOT deployed at launch (C5).
   * Turning this on additionally requires UMAMI_* env values.
   *
   * It needs no consent — it sets nothing and identifies nobody — so enabling
   * it does NOT make the banner appear. That is the point of choosing it.
   */
  umami: { enabled: false },

  /**
   * Google Tag Manager. Requires opt-in consent. **ON** since C13.
   *
   * The container ID lives here rather than in `env` — unlike
   * `GA4_MEASUREMENT_ID`, which set the precedent — for one reason: an absent
   * env var fails SILENTLY. `analytics.gtm.enabled && env.GTM_CONTAINER_ID`
   * renders nothing when the variable is missing from the hosting dashboard, so
   * a deploy that everyone believes is measuring measures nothing, and the only
   * symptom is an empty report three weeks later. A container ID is public — it
   * ships in the HTML by definition — so there is no secret to protect and no
   * reason to accept that failure mode. CLAUDE.md §7 puts tunable values in
   * `src/config/` anyway; this is one.
   */
  gtm: { enabled: true, containerId: 'GTM-NP37MNW9' },

  /** Requires opt-in consent. Off — and now belongs inside the container (C13). */
  ga4: { enabled: false },

  /** Requires opt-in consent. Off — and now belongs inside the container (C13). */
  metaPixel: { enabled: false },

  /**
   * The gate itself is live even with every tag off, so consent exists before
   * any tag could ever fire. Opt-in only; Consent Mode v2 defaults to denied;
   * rejecting is exactly as easy as accepting.
   */
  consentGate: { enabled: true, defaultState: 'denied' as const },
} as const;

/**
 * True only when something would actually set a cookie or call a third party.
 *
 * **This is what decides whether the banner renders.** It was false for the
 * whole pre-launch period, deliberately: a consent banner on a site that sets
 * no cookies and calls nobody is not caution — it is a dialogue asking
 * permission for something that is not happening, on a page whose cookie policy
 * opened by saying there are no cookies. The two would have contradicted each
 * other, and a visitor would have been right to trust neither.
 *
 * It is TRUE now, because GTM is on (C13) and that is a real third party. The
 * banner appeared the moment the flag flipped, with no component edit — which
 * is the promise C6 made, kept.
 *
 * Umami is deliberately NOT in this list. It is cookieless and identifies
 * nobody, so enabling it must not summon a banner.
 */
export function requiresConsentBanner(): boolean {
  return (
    analytics.gtm.enabled ||
    analytics.ga4.enabled ||
    analytics.metaPixel.enabled
  );
}

/** Providers currently switched on. */
export function activeProviders(): readonly AnalyticsProvider[] {
  const active: AnalyticsProvider[] = [];
  if (analytics.umami.enabled) active.push('umami');
  if (analytics.gtm.enabled) active.push('gtm');
  if (analytics.ga4.enabled) active.push('ga4');
  if (analytics.metaPixel.enabled) active.push('meta-pixel');
  return active;
}

/**
 * Where the visitor's choice is kept.
 *
 * `localStorage`, not a cookie — a cookie would be sent on every request to
 * store a preference the server never reads, and the site's whole position is
 * that it sets none. The key is written ONLY when a visitor actually makes a
 * choice, so a site with nothing to consent to stores nothing at all.
 */
export const CONSENT_STORAGE_KEY = 'mb-consent';

export type ConsentState = 'granted' | 'denied' | 'unset';

/** Every user-facing string the gate needs (CLAUDE.md §7). */
export const consentCopy = {
  /*
   * ── KEEP THIS SHORT ────────────────────────────────────────────────────────
   *
   * An earlier version read "Ölçümleme izni" over three lines explaining that
   * nothing would happen if you declined and that the site would work anyway.
   * Every sentence was true, and the whole thing still read like a legal
   * disclaimer — a banner that protests its own innocence makes a visitor
   * wonder what the problem is.
   *
   * A cookie notice is a small courtesy, not a defence. One sentence saying
   * what is used and why, two plain buttons, and the policy page for anyone
   * who wants the detail. The careful wording belongs there, where someone has
   * chosen to read it.
   *
   * "iyileştirmek" is the obvious verb here and CANNOT be used: it is a
   * blocking term in the content guard (CLAUDE.md §9). That is the guard doing
   * its job — the word is a claim — so the sentence says what actually happens
   * instead.
   */
  bannerHeading: 'Çerezler',
  bannerBody: 'Siteyi nasıl kullandığınızı anlamak için çerez kullanıyoruz.',
  accept: 'Kabul et',
  reject: 'Reddet',
  policyLink: 'Çerez Politikası',

  preferencesHeading: 'Tercihiniz',
  /**
   * Shown while nothing on the site requires consent. Unused since C13 turned
   * GTM on, and deliberately kept: setting every tag back to `false` must
   * restore the honest "there is nothing to agree to" panel with no copy to
   * rewrite.
   */
  nothingToConsentTo:
    'Şu anda izin gerektiren bir araç kullanılmıyor. Site çerez yazmıyor, üçüncü taraf bir sunucuya istek göndermiyor. İzne bağlı bir ölçüm devreye alındığında bu bölümde seçiminizi yapabilecek ve istediğiniz zaman değiştirebileceksiniz.',
  statusGranted: 'Çerezleri kabul ettiniz.',
  statusDenied: 'Çerezleri reddettiniz.',
  statusUnset: 'Henüz bir seçim yapmadınız. Çerezler şu an kapalı.',
  change: 'Seçimi değiştir',
} as const;

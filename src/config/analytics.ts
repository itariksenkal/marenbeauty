/**
 * Analytics and consent.
 *
 * Two decisions drive this (docs/OPEN-QUESTIONS.md C5, C6):
 *
 *   C5 — NO analytics backend is deployed at launch. No Umami instance, no VPS,
 *        no DNS record. There is no traffic to measure before the centre opens
 *        and a second server is real cost for zero return.
 *
 *   C6 — The consent gate ships LIVE at launch with every tag off. Advertising
 *        is expected within 12 months, and adding a gate after tracking has
 *        begun leaves a window of data collected without consent that cannot be
 *        fixed retroactively. This ordering is the only one that works.
 *
 * While every flag is false: zero cookies, zero third-party requests, and the
 * adapter code must be absent from the production bundle — verified by
 * searching the built chunks, not by reading the source (M14).
 */
export type AnalyticsProvider = 'umami' | 'ga4' | 'meta-pixel';

export const analytics = {
  /**
   * Cookieless, self-hosted. Chosen engine, NOT deployed at launch (C5).
   * Turning this on additionally requires UMAMI_* env values.
   */
  umami: { enabled: false },

  /** Requires opt-in consent. Off until advertising actually starts (C6). */
  ga4: { enabled: false },

  /** Requires opt-in consent. Off until advertising actually starts (C6). */
  metaPixel: { enabled: false },

  /**
   * The gate itself is live even with every tag off, so consent exists before
   * any tag could ever fire. Opt-in only; Consent Mode v2 defaults to denied;
   * rejecting is exactly as easy as accepting.
   */
  consentGate: { enabled: true, defaultState: 'denied' as const },
} as const;

/** True only when something would actually set a cookie or call a third party. */
export function requiresConsentBanner(): boolean {
  return analytics.ga4.enabled || analytics.metaPixel.enabled;
}

/** Providers currently switched on. Empty at launch, by decision. */
export function activeProviders(): readonly AnalyticsProvider[] {
  const active: AnalyticsProvider[] = [];
  if (analytics.umami.enabled) active.push('umami');
  if (analytics.ga4.enabled) active.push('ga4');
  if (analytics.metaPixel.enabled) active.push('meta-pixel');
  return active;
}

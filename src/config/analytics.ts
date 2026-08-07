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
 * adapter code is **absent from the production bundle** — verified by searching
 * the built chunks, not by reading the source.
 */
export type AnalyticsProvider = 'umami' | 'ga4' | 'meta-pixel';

export const analytics = {
  /**
   * Cookieless, self-hosted. Chosen engine, NOT deployed at launch (C5).
   * Turning this on additionally requires UMAMI_* env values.
   *
   * It needs no consent — it sets nothing and identifies nobody — so enabling
   * it does NOT make the banner appear. That is the point of choosing it.
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

/**
 * True only when something would actually set a cookie or call a third party.
 *
 * **This is what decides whether the banner renders**, and it is false today.
 * A consent banner on a site that sets no cookies and calls nobody is not
 * caution — it is a dialogue asking permission for something that is not
 * happening, on a page whose cookie policy says in its first line that there
 * are no cookies. The two would contradict each other, and a visitor would be
 * right to trust neither.
 *
 * The MACHINERY is live regardless: the store, the persisted choice, the
 * preferences panel on `/cerez-politikasi`, and the rule that every adapter
 * reads consent before it loads. Flipping `ga4.enabled` makes the banner
 * appear with no further change — which is C6 satisfied, without the theatre.
 */
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
  bannerHeading: 'Ölçümleme izni',
  bannerBody:
    'Sitenin nasıl kullanıldığını ölçmek için tanımlama bilgisi kullanmak istiyoruz. İzin vermezseniz hiçbir ölçüm başlamaz; site aynı şekilde çalışır.',
  accept: 'İzin ver',
  reject: 'İzin verme',
  policyLink: 'Çerez Politikası',

  preferencesHeading: 'Tercihiniz',
  /** Shown while nothing on the site requires consent — which is today. */
  nothingToConsentTo:
    'Şu anda izin gerektiren bir araç kullanılmıyor. Site çerez yazmıyor, üçüncü taraf bir sunucuya istek göndermiyor. İzne bağlı bir ölçüm devreye alındığında bu bölümde seçiminizi yapabilecek ve istediğiniz zaman değiştirebileceksiniz.',
  statusGranted: 'İzin verdiniz.',
  statusDenied: 'İzin vermediniz.',
  statusUnset: 'Henüz bir seçim yapmadınız. Varsayılan: izin verilmedi.',
  change: 'Seçimi değiştir',
} as const;

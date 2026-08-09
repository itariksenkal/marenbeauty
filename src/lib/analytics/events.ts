'use client';

import { isConsentGranted } from '@/lib/analytics/consent';

/**
 * The conversion event catalogue.
 *
 * ── WHY THESE EVENTS AND NOT THE OBVIOUS ONES ────────────────────────────────
 *
 * Maren Beauty is a beauty centre that has not opened, with no booking system
 * and no online payment (docs/BRIEF.md §6). So there is no "appointment", no
 * "add to cart" and no "purchase" to measure, and inventing one would produce a
 * funnel that measures nothing real.
 *
 * What there is, is a documented conversion hierarchy — **WhatsApp → phone →
 * form** — and one rule attached to it: Instagram and the other profiles are
 * DISCOVERY, not conversion. That rule is why a social click gets its own event
 * rather than a `kanal` value on `iletisim_baslatildi`: folding the two together
 * would let profile traffic inflate the number the owner will judge advertising
 * spend by, which is the one number that has to stay honest.
 *
 * Service interest is deliberately NOT an event. Service pages live at
 * `/hizmetler/<slug>`, so `sayfa_goruntulendi` already carries the slug and the
 * container can derive it with a built-in URL variable. Shipping a component to
 * push a value GTM can already read is code with no reader.
 *
 * ── WHY NOTHING IS PUSHED WITHOUT CONSENT ────────────────────────────────────
 *
 * `dataLayer` is an in-memory array; pushing to it sets no cookie and sends no
 * request, so queueing events while consent is denied would be defensible. It
 * is still not done here. GTM replays the whole array when it loads, so a queue
 * built before a grant becomes data collected before consent and transmitted
 * after it — which is exactly the ordering KVKK is about, and exactly the
 * ordering docs/OPEN-QUESTIONS.md C6 exists to prevent. The banner says
 * "İzin vermezseniz hiçbir ölçüm başlamaz". This is what makes that true.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Every event this site emits. A union rather than a loose string, so a typo is
 * a build failure instead of a report that is quietly missing a row.
 */
export type AnalyticsEvent =
  /** A visitor opened a conversion channel: WhatsApp, phone or email. */
  | { readonly event: 'iletisim_baslatildi'; readonly kanal: string }
  /** A visitor opened a social profile. Discovery — never a conversion. */
  | { readonly event: 'sosyal_profil_tiklandi'; readonly profil: string }
  /** The contact form was accepted by the server. */
  | { readonly event: 'form_gonderildi'; readonly hizmet: string }
  /** The contact form was rejected, with how many fields were at fault. */
  | { readonly event: 'form_hatasi'; readonly alan_sayisi: number }
  /** A client-side route change, which no container can see by itself. */
  | { readonly event: 'sayfa_goruntulendi'; readonly sayfa_yolu: string }
  /** The visitor granted or withdrew consent. Measures the banner itself. */
  | { readonly event: 'onay_guncellendi'; readonly secim: string };

/**
 * Push one event, if and only if consent has been granted.
 *
 * Returns whether it was pushed, which is what the unit tests assert on rather
 * than reaching into `window`.
 */
export function track(payload: AnalyticsEvent): boolean {
  if (typeof window === 'undefined') return false;
  if (!isConsentGranted()) return false;

  window.dataLayer ??= [];
  window.dataLayer.push(payload);
  return true;
}

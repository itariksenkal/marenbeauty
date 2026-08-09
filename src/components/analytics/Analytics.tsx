import { AnalyticsEvents } from '@/components/analytics/AnalyticsEvents';
import { GtmScript } from '@/components/analytics/adapters/GtmScript';
import { UmamiScript } from '@/components/analytics/adapters/UmamiScript';
import { analytics } from '@/config/analytics';

/**
 * The analytics mount point. Rendered in the root layout, on every page.
 *
 * ── WHY THE ADAPTERS ARE NOT TREATED ALIKE ───────────────────────────────────
 *
 * **GTM is wired and ON** (docs/OPEN-QUESTIONS.md C13). It is the one tag this
 * site loads, and `GtmScript` renders nothing at all until consent is granted,
 * so `googletagmanager.com` reaches no visitor who has not said yes. It is a
 * Client Component, so the host appears in a client CHUNK — but in no `.html`
 * and no `.rsc` payload, which is what proves it cannot load before hydration
 * and therefore cannot load before the gate. A unit test asserts exactly that
 * split.
 *
 * **Umami is wired but off.** Cookieless, needs no consent, and no backend is
 * deployed (C5).
 *
 * **`Ga4Script` and `MetaPixelScript` are NOT imported here.** Both live,
 * complete, in `./adapters/`, and neither is referenced by any module in the
 * graph — so `connect.facebook.net` and `fbevents.js` appear NOWHERE in the
 * built output.
 *
 * That is deliberate, and it cost an experiment to arrive at. The obvious
 * approach — `if (analytics.ga4.enabled) { const { Ga4Script } = await
 * import(...) }` — does not work: Turbopack emits the dynamic import's chunk
 * even when the branch is statically dead, so the tracker code ships in a site
 * that has consciously decided not to track anyone. Gating on a build-time
 * `NEXT_PUBLIC_*` literal instead made no difference; both were verified by
 * grepping the build, not assumed.
 *
 * ── IF GA4 OR THE PIXEL IS EVER WANTED ───────────────────────────────────────
 *
 * Configure it INSIDE the container, in the GTM console. That is what a
 * container is for, and it keeps the number of script elements on the page at
 * one. The two adapters stay here, unimported, for the day the container itself
 * is not wanted.
 */

export function Analytics() {
  return (
    <>
      {analytics.umami.enabled ? <UmamiScript /> : null}

      {analytics.gtm.enabled ? (
        <GtmScript containerId={analytics.gtm.containerId} />
      ) : null}

      <AnalyticsEvents />
    </>
  );
}

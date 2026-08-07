import { UmamiScript } from '@/components/analytics/adapters/UmamiScript';
import { analytics } from '@/config/analytics';

/**
 * The analytics mount point. Rendered in the root layout, on every page.
 *
 * Today it renders nothing: every flag is `false` (docs/OPEN-QUESTIONS.md C5).
 *
 * ── WHY THE THREE ADAPTERS ARE NOT TREATED ALIKE ─────────────────────────────
 *
 * **Umami is wired.** It is a Server Component emitting one `<script async>`,
 * its URL comes from `env`, and it needs no consent. Nothing about it appears
 * in a client bundle, and no third-party host is baked into any build output.
 *
 * **GA4 and the Meta Pixel are NOT imported here.** Both live, complete, in
 * `./adapters/`, and neither is referenced by any module in the graph — so
 * `googletagmanager.com`, `connect.facebook.net` and `fbevents.js` appear
 * NOWHERE in the built output. A unit test greps the built chunks and fails if
 * any of the three ever does.
 *
 * That is deliberate, and it cost an experiment to arrive at. The obvious
 * approach — `if (analytics.ga4.enabled) { const { Ga4Script } = await
 * import(...) }` — does not work: Turbopack emits the dynamic import's chunk
 * even when the branch is statically dead, so the tracker code ships in a site
 * that has consciously decided not to track anyone. Gating on a build-time
 * `NEXT_PUBLIC_*` literal instead made no difference; both were verified by
 * grepping the build, not assumed.
 *
 * ── TURNING ONE ON ───────────────────────────────────────────────────────────
 *
 * 1. Set the flag in `src/config/analytics.ts` to `true`.
 * 2. Set `GA4_MEASUREMENT_ID` (or `META_PIXEL_ID`) in the environment.
 * 3. Uncomment the matching import and block below.
 *
 * Step 3 is one line each, and it exists precisely so that steps 1 and 2 alone
 * cannot put a tracker into the bundle by accident. Both adapters already
 * implement Consent Mode v2 defaults-denied and render nothing without granted
 * consent — there is no integration left to write.
 */
// import { Ga4Script } from '@/components/analytics/adapters/Ga4Script';
// import { MetaPixelScript } from '@/components/analytics/adapters/MetaPixelScript';

export function Analytics() {
  return (
    <>
      {analytics.umami.enabled ? <UmamiScript /> : null}

      {/* Step 3, GA4:
      {analytics.ga4.enabled && env.GA4_MEASUREMENT_ID ? (
        <Ga4Script measurementId={env.GA4_MEASUREMENT_ID} />
      ) : null}
      */}

      {/* Step 3, Meta Pixel:
      {analytics.metaPixel.enabled && env.META_PIXEL_ID ? (
        <MetaPixelScript pixelId={env.META_PIXEL_ID} />
      ) : null}
      */}
    </>
  );
}

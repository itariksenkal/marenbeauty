/**
 * Site-wide constants. Everything here is public and safe in a client bundle.
 *
 * Matches docs/ARCHITECTURE.md §3.8.
 */
export const site = {
  name: 'Maren Beauty',
  domain: 'marenbeauty.com',

  /**
   * Canonical origin — the apex (docs/OPEN-QUESTIONS.md C2).
   *
   * A literal, not `env.SITE_URL`, on purpose: canonical URLs and structured
   * data must always point at production, including from preview deployments.
   * Deriving this from the environment would emit preview origins into
   * canonicals and JSON-LD, which is worse than useless.
   */
  url: 'https://marenbeauty.com',

  locale: 'tr-TR',
  htmlLang: 'tr',

  /**
   * Display address. `streetAddress` and `postalCode` are ABSENT, not empty —
   * the premises are not finalised and a guessed address is worse than none
   * (docs/OPEN-QUESTIONS.md C1). The schema builder at M13 omits any field
   * missing here rather than emitting a blank one.
   */
  address: {
    locality: 'Selçuklu',
    region: 'Konya',
    country: 'TR',
  },

  /**
   * While true: no opening hours, no ratings, no reviews, no price range in
   * structured data, and an honest "yakında" state in the UI (CLAUDE.md §10).
   * Flipping this to false must not require touching any component.
   */
  isPreLaunch: true,
} as const;

export type Site = typeof site;

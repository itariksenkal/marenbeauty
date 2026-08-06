/**
 * Site-wide constants. Everything here is public and safe in a client bundle.
 *
 * Matches docs/ARCHITECTURE.md §3.8.
 */
export const site = {
  name: 'Maren Beauty',

  /**
   * The word used alone as the oversized hero wordmark. Held separately rather
   * than derived from `name`, so the hero never depends on string surgery over
   * a value someone may later change to "Maren Beauty Konya".
   */
  wordmark: 'Maren',

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

/**
 * Opening hours.
 *
 * ⚠️ **PLACEHOLDER.** These are ordinary hours for a Konya beauty centre, not
 * hours the owner has confirmed — the centre has not opened
 * (docs/OPEN-QUESTIONS.md C12). They are shown on screen because a footer
 * without hours is a hole a visitor notices, and they are labelled on screen as
 * provisional.
 *
 * They are deliberately NOT in structured data while `site.isPreLaunch` is
 * true: `openingHoursSpecification` on a business that is not open is a
 * factual claim to a search engine, which is a different thing from a line on
 * a page that says "planlanan". `docs/SEO.md` §2.5 and a unit test both hold
 * that line.
 *
 * `day` uses the schema.org `DayOfWeek` names so the schema builder never has
 * to translate, and `label` carries the Turkish because a component may not
 * (CLAUDE.md §7).
 */
export type OpeningHours = {
  readonly day:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  readonly label: string;
  /** 24h `HH:MM`, or null when closed. */
  readonly opens: string | null;
  readonly closes: string | null;
};

export const openingHours: readonly OpeningHours[] = [
  { day: 'Monday', label: 'Pazartesi', opens: '10:00', closes: '19:00' },
  { day: 'Tuesday', label: 'Salı', opens: '10:00', closes: '19:00' },
  { day: 'Wednesday', label: 'Çarşamba', opens: '10:00', closes: '19:00' },
  { day: 'Thursday', label: 'Perşembe', opens: '10:00', closes: '19:00' },
  { day: 'Friday', label: 'Cuma', opens: '10:00', closes: '19:00' },
  { day: 'Saturday', label: 'Cumartesi', opens: '10:00', closes: '18:00' },
  { day: 'Sunday', label: 'Pazar', opens: null, closes: null },
];

/**
 * Consecutive days sharing the same hours, collapsed into ranges — so a footer
 * reads "Pazartesi – Cuma  10:00 – 19:00" rather than five identical lines.
 *
 * Computed rather than authored: authoring the grouping means two sources of
 * truth for the same fact, and the day a single day's hours change the grouped
 * copy is the one that gets forgotten.
 */
export function groupedOpeningHours(): readonly {
  readonly label: string;
  readonly opens: string | null;
  readonly closes: string | null;
}[] {
  const groups: { first: OpeningHours; last: OpeningHours }[] = [];

  for (const entry of openingHours) {
    const current = groups.at(-1);
    if (
      current &&
      current.last.opens === entry.opens &&
      current.last.closes === entry.closes
    ) {
      current.last = entry;
    } else {
      groups.push({ first: entry, last: entry });
    }
  }

  return groups.map(({ first, last }) => ({
    label: first === last ? first.label : `${first.label} – ${last.label}`,
    opens: first.opens,
    closes: first.closes,
  }));
}

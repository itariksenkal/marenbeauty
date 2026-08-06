/**
 * Testimonials.
 *
 * Ships empty and STAYS empty until real clients have visited a centre that is
 * open. No invented names, no invented ratings, no placeholder reviews — not
 * even commented out (CLAUDE.md §9).
 *
 * `TestimonialsSection` returns null on an empty array: no heading, no
 * "coming soon", no skeleton. The section simply does not exist yet.
 *
 * Until this has entries, `aggregateRating` must stay out of structured data —
 * review markup for reviews that do not exist violates Google's policy outright
 * (docs/SEO.md §2.5).
 */
export type Testimonial = {
  readonly id: string;
  /** The client's own words, in Turkish. Never written or edited for them. */
  readonly quote: string;
  /** As the client agreed to be credited — often a first name only. */
  readonly author: string;
  /** Service slug this relates to, or null if general. */
  readonly service: string | null;
  /** ISO date the testimonial was given. */
  readonly givenAt: string;
  /** Explicit, recorded consent to publish. Required — KVKK. */
  readonly consentGiven: true;
};

export const testimonials: readonly Testimonial[] = [];

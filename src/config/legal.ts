/**
 * Legal page configuration.
 *
 * The registered entity is UNKNOWN and must not be invented
 * (docs/OPEN-QUESTIONS.md B2). The literal token below is used verbatim in the
 * KVKK, cookie and terms pages, and `npm run guard` FAILS THE PRODUCTION BUILD
 * if any `{{…}}` token reaches build output.
 *
 * That gate is deliberate and is not to be relaxed for a deploy, a demo or a
 * preview. The site cannot ship until the owner supplies the ünvan.
 */
export const LEGAL_ENTITY_TOKEN = '{{LEGAL_ENTITY}}';

export const legal = {
  /** Replaced with the registered ünvan when the owner supplies it (B2). */
  entity: LEGAL_ENTITY_TOKEN,

  /**
   * Marks the legal pages as not yet reviewed by a lawyer
   * (docs/OPEN-QUESTIONS.md C8). Removed only when the owner confirms the
   * review has happened — not when the text merely looks finished.
   */
  isLawyerReviewed: false,

  /**
   * Effective date shown on the legal pages. Null until the pages are reviewed
   * and the site is live — a date on an unreviewed notice implies an authority
   * it does not have.
   */
  effectiveDate: null as string | null,

  /**
   * What the contact form actually does, which the KVKK text must describe
   * accurately: it sends an email and stores nothing (CLAUDE.md §11).
   */
  dataRetention: 'none' as const,
} as const;

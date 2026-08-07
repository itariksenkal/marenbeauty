/**
 * Legal page configuration and copy.
 *
 * The entity is supplied by the environment, never by this file, and lives in
 * `src/config/legal-entity.ts` — which this file deliberately does not
 * re-export; see the header there for why.
 *
 * ⚠️ As of 2026-08-07 the value in the deployment environment is
 * **PROVISIONAL**: the company is still being registered
 * (docs/OPEN-QUESTIONS.md B2). It was supplied by the owner and is not
 * invented, but it is not yet a registered ünvan either, and the KVKK notice
 * names it as the data controller.
 *
 * Everything below is text a reader sees, so it lives in config rather than in
 * a component (CLAUDE.md §7).
 */

/**
 * The cosmetic-scope disclaimer, verbatim (CLAUDE.md §9).
 *
 * ONE canonical copy, because it appears on every service page and every blog
 * post. Written into each MDX file instead, it would be twelve copies free to
 * drift, and drift in this particular sentence is a compliance problem rather
 * than a typo.
 *
 * It contains `tıbbi`, which is precisely why that term is ADVISORY and not
 * blocking in the guard. A fixture test asserts this exact sentence passes;
 * promoting the term to the blocking tier breaks the disclaimer and fails that
 * test first (docs/OPEN-QUESTIONS.md F8).
 */
export const COSMETIC_DISCLAIMER =
  'Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.';

export const legal = {
  /**
   * The owner's approval to publish the three legal texts.
   *
   * ⚠️ READ THE NEXT FLAG BEFORE ASSUMING WHAT THIS MEANS. Set to `true` by the
   * owner on 2026-08-07. It is what removes the on-screen "Taslak metin" notice
   * and what lets `npm run preflight` pass, and the name is kept because
   * `preflight`, the page and three tests all read it.
   *
   * What it does NOT mean, as of that date: that a lawyer has read them. The
   * owner instructed both the approval and the recording of that gap
   * (docs/OPEN-QUESTIONS.md C8).
   */
  isLawyerReviewed: true,

  /**
   * Whether an external legal review has actually happened.
   *
   * **`false`, and separate from the flag above on purpose.** One boolean
   * cannot honestly carry both "the owner is content to publish this" and "a
   * lawyer has checked it" once those two answers differ — and on 2026-08-07
   * they do. Nothing renders from this; it exists so the codebase does not
   * assert something untrue, and so the outstanding item is visible where the
   * decision was made rather than only in a document.
   *
   * Set to `true` when the review has happened, at which point the two flags
   * mean the same thing again.
   */
  hasExternalLegalReview: false,

  /**
   * Effective date shown on the legal pages.
   *
   * The date the owner approved publication — not the date of a review that
   * has not taken place. Update it whenever the texts change materially.
   */
  effectiveDate: '2026-08-07' as string | null,

  /**
   * What the contact form actually does, which the KVKK text must describe
   * accurately: it sends an email and stores nothing (CLAUDE.md §11).
   */
  dataRetention: 'none' as const,
} as const;

/**
 * The three published legal documents, in footer order.
 *
 * `slug` is both the MDX filename in the legal collection and the route
 * segment. Slugs are permanent (CLAUDE.md §6). The path itself is written only
 * inside `src/content-layer/` — nothing else may reference it, and a unit test
 * enforces that.
 */
export const LEGAL_SLUGS = [
  'kvkk',
  'cerez-politikasi',
  'kullanim-kosullari',
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/**
 * Every user-facing string the legal pages need outside their MDX bodies.
 *
 * The data-controller block is rendered by the page rather than written into
 * MDX, so the unresolved-entity state is expressed once instead of three times.
 */
export const legalPage = {
  eyebrow: 'Yasal',

  controller: {
    heading: 'Veri sorumlusu',
    /** Always true and always known — the brand, not the registered ünvan. */
    brandLine: 'Maren Beauty — Konya, Selçuklu.',
    /**
     * Shown while the ünvan is unresolved — which, since the owner set
     * `LEGAL_ENTITY` in the deployment environment, is only local development
     * and CI. It names nothing and promises nothing.
     */
    unresolved:
      'Merkezin ticari ünvanı ve varsa VERBİS kayıt bilgisi bu bölüme eklenecektir.',
    /** Shown once the ünvan is supplied. */
    resolvedLabel: 'Ticari ünvan',
  },

  /**
   * The unreviewed marker required by docs/OPEN-QUESTIONS.md C8.
   *
   * No longer rendered: the owner approved publication on 2026-08-07 and
   * `isLawyerReviewed` is now `true`. Kept, with its copy intact, because
   * setting that flag back to `false` — for a material rewrite, say — must
   * bring the notice back with no other edit.
   */
  draftNotice: {
    heading: 'Taslak metin',
    body: 'Bu sayfa hukuki inceleme öncesi taslak olarak yayındadır. Merkez henüz açılmadığı için metin, sitenin bugün yaptığı işi anlatır: iletişim formundan gelen mesajın e-posta ile iletilmesi. İnceleme tamamlandığında bu uyarı kalkar ve yürürlük tarihi eklenir.',
  },

  effectiveDateLabel: 'Yürürlük tarihi',
  noEffectiveDate: 'Yürürlük tarihi, hukuki inceleme sonrasında eklenecektir.',

  contactHeading: 'Başvuru ve iletişim',
  contactBody:
    'Bu metinlerle ilgili sorularınızı ve KVKK kapsamındaki taleplerinizi iletişim sayfasındaki formdan iletebilirsiniz.',
  contactCtaLabel: 'İletişim sayfası',

  otherDocumentsHeading: 'Diğer yasal metinler',

  /** `/lisanslar` — the public attribution surface for CC-BY dependencies. */
  licences: {
    title: 'Lisanslar ve atıflar',
    lead: 'Bu site açık kaynak paketlerle geliştirildi. Aşağıdaki liste, sitede kullanılan üçüncü taraf yazılımların lisanslarını ve gerektiğinde atıflarını içerir. Liste elle yazılmaz; bağımlılık ağacından üretilir.',
    generatedNote:
      'Bu sayfa depodaki NOTICE dosyasından okunur. NOTICE dosyası `npm run licenses` ile üretilir ve bağımlılıklar değiştiğinde denetim yeniden üretmediğiniz sürece başarısız olur.',
    fontsHeading: 'Yazı tipleri',
    fontsBody:
      'Fraunces ve Manrope, SIL Open Font License 1.1 ile dağıtılır ve site sunucusundan servis edilir. Lisans metinleri aşağıdaki bağlantılardadır.',
    fontLicences: [
      { label: 'Fraunces — OFL 1.1', href: '/fonts/OFL-fraunces.txt' },
      { label: 'Manrope — OFL 1.1', href: '/fonts/OFL-manrope.txt' },
    ],
  },
} as const;

/**
 * Legal page configuration and copy.
 *
 * The registered entity is UNKNOWN and must not be invented
 * (docs/OPEN-QUESTIONS.md B2). It lives in `src/config/legal-entity.ts`, which
 * this file deliberately does not re-export — see the header there for why.
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
     * Shown while the ünvan is unresolved. It names nothing and promises
     * nothing; it tells the reader precisely what is missing and when it lands.
     */
    unresolved:
      'Merkezin ticari ünvanı ve varsa VERBİS kayıt bilgisi, bu metnin hukuki incelemesi tamamlandığında bu bölüme eklenecektir. Bu sayfa o ana kadar taslak olarak yayındadır.',
    /** Shown once the ünvan is supplied. */
    resolvedLabel: 'Ticari ünvan',
  },

  /**
   * The unreviewed marker required by docs/OPEN-QUESTIONS.md C8. It disappears
   * by itself when `legal.isLawyerReviewed` flips — nothing to remember.
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

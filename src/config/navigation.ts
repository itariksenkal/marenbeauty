import { site } from '@/config/site';

/**
 * Header, footer and mobile menu trees. Routes match docs/ARCHITECTURE.md §2.
 *
 * Slugs are Turkish and ASCII-folded, and they are permanent: renaming one
 * requires a redirect in next.config.ts in the same commit (CLAUDE.md §6).
 */
export type NavItem = {
  readonly href: string;
  readonly label: string;
};

export const primaryNav: readonly NavItem[] = [
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/blog', label: 'Blog' },
  { href: '/sss', label: 'Sık Sorulan Sorular' },
  { href: '/iletisim', label: 'İletişim' },
];

export const legalNav: readonly NavItem[] = [
  { href: '/kvkk', label: 'KVKK Aydınlatma Metni' },
  { href: '/cerez-politikasi', label: 'Çerez Politikası' },
  { href: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
];

/**
 * Footer columns. Contact channels are deliberately absent: they render from
 * `contact.ts` and disappear entirely while unset (CLAUDE.md §7).
 */
export const footerNav: readonly {
  readonly heading: string;
  readonly items: readonly NavItem[];
}[] = [
  { heading: 'Menü', items: primaryNav },
  { heading: 'Yasal', items: legalNav },
];

/** Home is not in `primaryNav` — the wordmark is the home link. */
export const homeHref = '/';

/** Where the skip link and in-page anchors land. */
export const mainContentId = 'main';

/**
 * Shell chrome labels — the few user-facing strings the layout itself needs.
 * Components may not contain Turkish (CLAUDE.md §7), and these belong to
 * navigation rather than to any page's content.
 *
 * The brand name is NOT here: it is `site.name`, a proper noun, not copy.
 */
export const chrome = {
  skipToContent: 'İçeriğe geç',
  allRightsReserved: 'Tüm hakları saklıdır.',
  legalNavLabel: 'Yasal metinler',
} as const;

export const siteName = site.name;

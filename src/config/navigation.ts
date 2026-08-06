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
  /** Optional one-line description, shown in the mega menu and the footer. */
  readonly description?: string;
};

export const primaryNav: readonly NavItem[] = [
  { href: '/hizmetler', label: 'Hizmetlerimiz' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/blog', label: 'Blog' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/sss', label: 'SSS' },
  { href: '/iletisim', label: 'İletişim' },
];

export const legalNav: readonly NavItem[] = [
  { href: '/kvkk', label: 'KVKK Aydınlatma Metni' },
  { href: '/cerez-politikasi', label: 'Çerez Politikası' },
  { href: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
  { href: '/lisanslar', label: 'Lisanslar' },
];

/** Home is not in `primaryNav` — the wordmark is the home link. */
export const homeHref = '/';

/** Where the skip link and in-page anchors land. */
export const mainContentId = 'main';

/**
 * Which primary item opens the service mega menu.
 *
 * Held as a href rather than an index so reordering `primaryNav` cannot
 * silently attach the menu to "Blog".
 */
export const megaMenuHref = '/hizmetler';

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

  primaryNavLabel: 'Ana menü',
  footerNavLabel: 'Alt menü',
  socialNavLabel: 'Sosyal hesaplar',

  openMenu: 'Menüyü aç',
  closeMenu: 'Menüyü kapat',
  /** Announced when the mega menu expands, for the `aria-expanded` control. */
  servicesMenuLabel: 'Hizmet grupları',
  allServices: 'Tüm hizmetler',

  /**
   * The header call to action. WhatsApp-first (docs/BRIEF.md §6), degrading to
   * the form when no channel is configured — which is the same hierarchy the
   * closing CTA uses, so a visitor sees one consistent primary action.
   */
  ctaWhatsapp: 'WhatsApp',
  ctaForm: 'Mesaj gönderin',
} as const;

/**
 * The footer's brand paragraph.
 *
 * Says only what is confirmed: the category, the district, and that the centre
 * is not open yet. No team, no room, no date (CLAUDE.md §9, §10).
 */
export const footerBrand = {
  paragraph: `${site.address.region} ${site.address.locality}’de bir güzellik merkezi. Sakin, ölçülü ve acelesi olmayan bir yaklaşım. Yakında kapılarımızı açıyoruz.`,
  servicesHeading: 'Hizmet grupları',
  pagesHeading: 'Sayfalar',
  legalHeading: 'Yasal',
  contactHeading: 'İletişim',
  hoursHeading: 'Çalışma saatleri',
  socialHeading: 'Bizi takip edin',
} as const;

export const siteName = site.name;

import { COSMETIC_DISCLAIMER } from '@/config/legal';
import type { BlogCategory } from '@/content-layer/schemas';

/**
 * The blog surface — taxonomy, page size and every user-facing string.
 *
 * Built at M9 for **twelve posts now and fifty later**: nothing here counts
 * posts, and no route, component or piece of copy changes when the collection
 * grows. Page size is a number in one place; the listing, the archives and the
 * pagination all read it.
 *
 * Posture (CLAUDE.md §9) applies to everything below. The category descriptions
 * say what a category COVERS — they are labels for the site's own taxonomy, not
 * claims about the centre. The empty states say what is true today and nothing
 * more: no date, no "yakında bir sürprizimiz var", no fabricated schedule.
 */

/** docs/CONTENT-PLAN.md §7. Twelve fits three rows of four on desktop. */
export const POSTS_PER_PAGE = 12;

export type BlogCategoryEntry = {
  readonly id: BlogCategory;
  readonly label: string;
  /** What the category covers. A scope statement, never a promise. */
  readonly description: string;
  /** Manifest id — one hero per category, not per post (CLAUDE.md §8). */
  readonly imageId: string;
};

/** The six categories of docs/CONTENT-PLAN.md §3, in reading order. */
export const blogCategories: readonly BlogCategoryEntry[] = [
  {
    id: 'cilt-bakimi-rehberi',
    label: 'Cilt Bakımı Rehberi',
    description:
      'Rutinler, cilt tipleri ve merkezdeki bakımla evdeki bakımın nasıl birbirini tamamladığı.',
    imageId: 'blog-cilt-bakimi-rehberi',
  },
  {
    id: 'cilt-yenileme-rehberi',
    label: 'Cilt Yenileme Uygulamaları',
    description:
      'Hydrafacial, peeling ve mikro iğneleme uygulamalarının nasıl ilerlediği üzerine yazılar.',
    imageId: 'blog-cilt-yenileme-rehberi',
  },
  {
    id: 'epilasyon-rehberi',
    label: 'Epilasyon Rehberi',
    description:
      'Lazer epilasyonun nasıl planlandığı ve seans sonrasında nelere dikkat edildiği.',
    imageId: 'blog-epilasyon-rehberi',
  },
  {
    id: 'cilt-ihtiyaclari',
    label: 'Cilt İhtiyaçları',
    description:
      'Akne eğilimi, leke görünümü, hassasiyet, gözenek ve nem başlıkları.',
    imageId: 'blog-cilt-ihtiyaclari',
  },
  {
    id: 'kas-kirpik-rehberi',
    label: 'Kaş & Kirpik',
    description:
      'Kaş tasarımı, kirpik lifting, kalıcı makyaj ve microblading üzerine yazılar.',
    imageId: 'blog-kas-kirpik-rehberi',
  },
  {
    id: 'ozel-gun-ve-mevsim',
    label: 'Özel Gün & Mevsim',
    description: 'Gelin hazırlığı ve mevsime göre bakım planlaması.',
    imageId: 'blog-ozel-gun-ve-mevsim',
  },
];

const byId = new Map(blogCategories.map((entry) => [entry.id, entry]));

/** Throws rather than returning undefined — an unknown category is a bug. */
export function blogCategory(id: BlogCategory): BlogCategoryEntry {
  const entry = byId.get(id);
  if (!entry) {
    throw new Error(`No display entry for blog category "${id}".`);
  }
  return entry;
}

export const blog = {
  index: {
    eyebrow: 'Blog',
    heading: 'Yazılar',
    /** Describes the blog's scope. Says nothing about the centre. */
    lead: 'Uygulamaların nasıl ilerlediği, öncesinde ve sonrasında nelere dikkat edildiği üzerine yazılar.',
  },

  /**
   * Empty states — real sentences, in the site's own voice.
   *
   * Each says only what is true at the moment it renders. No date, no
   * countdown, no "çok yakında": the blog is written at M10 and there is no
   * confirmed publication schedule to promise.
   */
  empty: {
    all: 'Burada henüz yayımlanmış bir yazı yok. İlk yazılar yayımlandığında bu sayfada listelenecek.',
    category:
      'Bu başlıkta henüz yayımlanmış bir yazı yok. Diğer başlıklara göz atabilirsiniz.',
    /** Offered alongside an empty listing, because the services do exist. */
    servicesLink: 'Hizmetlere göz atın',
  },

  categories: {
    /** The "no filter" pill. Always first, always present. */
    all: 'Tümü',
    /** Labels the pill row for screen readers. */
    navLabel: 'Yazı başlıkları',
  },

  pagination: {
    navLabel: 'Sayfalar',
    previous: 'Önceki',
    next: 'Sonraki',
    /** Rendered as `Sayfa 2 / 5`. Assembled in the component, not here. */
    pageWord: 'Sayfa',
  },

  post: {
    keyPoints: 'Kısaca',
    faq: 'Sık sorulan sorular',
    relatedService: 'İlgili hizmet',
    relatedPosts: 'İlgili yazılar',
    backToIndex: 'Tüm yazılar',
    updatedPrefix: 'Güncellendi',
    readingSuffix: 'dk okuma',
    /**
     * Exactly ONE call to action per post (docs/CONTENT-PLAN.md §5). This is
     * why a post page does not also render the shared `ContactCta` section —
     * that would make two.
     */
    ctaHeading: 'Aklınıza takılan bir şey mi var?',
    ctaBody:
      'Merak ettiklerinizi yazabilirsiniz; açılışla birlikte size dönüş yapacağız.',
    ctaLabel: 'Mesaj gönderin',

    /**
     * Rendered on **every** post, not only the ones that name a service.
     *
     * Every post maps to a service by schema, so every post's topic touches one
     * — and a disclaimer that appears on some posts and not others invites the
     * reader to wonder what the difference is. Rendered from config rather than
     * written into twelve MDX files, so it cannot drift.
     */
    disclaimer: COSMETIC_DISCLAIMER,
  },
} as const;

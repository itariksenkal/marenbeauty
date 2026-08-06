import { imagesInGroup } from '@/config/images';
import { COSMETIC_DISCLAIMER } from '@/config/legal';
import type { ServiceGroup } from '@/content-layer/schemas';

/**
 * Display labels for the service groups (docs/CONTENT-PLAN.md §1).
 *
 * These are category names for services the owner has confirmed, so they are
 * not invented. Nothing here describes how a service is performed, how long it
 * takes, or what equipment is involved — none of that is known.
 */
/**
 * Panel surfaces, warming as the visitor descends.
 *
 * This is the largest single lever on rose balance (docs/DESIGN-SYSTEM.md
 * §1.7): five full-viewport panels are the biggest area on the site. Left at
 * ivory they measured COOLER than the page — the sampled average was #faf7f3
 * against cream's #faf4ec — which is precisely the "reads beige" failure.
 *
 * Only `ink`, `espresso` and `cocoa` may sit on the warmer surfaces
 * (§1.5 rule 4), and only those are used. `rose-beige` at ink is 11.10:1.
 *
 * Tune the balance HERE. Do not reach for rose text or rose borders — they
 * fail contrast, which is arithmetic rather than taste.
 */
export type PanelSurface =
  | 'bg-surface-raised'
  | 'bg-surface-sunken'
  | 'bg-surface-accent'
  | 'bg-surface-decor';

export const serviceGroups: readonly {
  readonly id: ServiceGroup;
  readonly label: string;
  /** Sets the aurora stops while this panel is on screen. */
  readonly auroraB: string;
  readonly auroraC: string;
  readonly surface: PanelSurface;
}[] = [
  {
    id: 'cilt-bakimi',
    label: 'Cilt Bakımı',
    auroraB: 'var(--mb-nude)',
    auroraC: 'var(--mb-rose-beige)',
    surface: 'bg-surface-raised',
  },
  {
    id: 'epilasyon',
    label: 'Epilasyon',
    auroraB: 'var(--mb-rose-beige)',
    auroraC: 'var(--mb-blush)',
    surface: 'bg-surface-sunken',
  },
  {
    id: 'cilt-yenileme',
    label: 'Cilt Yenileme',
    auroraB: 'var(--mb-blush)',
    auroraC: 'var(--mb-champagne)',
    surface: 'bg-surface-accent',
  },
  {
    id: 'kas-kirpik',
    label: 'Kaş & Kirpik',
    auroraB: 'var(--mb-nude)',
    auroraC: 'var(--mb-blush)',
    surface: 'bg-surface-decor',
  },
  {
    id: 'ozel-paket',
    label: 'Özel Paketler',
    auroraB: 'var(--mb-champagne-light)',
    auroraC: 'var(--mb-rose-beige)',
    surface: 'bg-surface-accent',
  },
];

const groupLabels = new Map(
  serviceGroups.map((group) => [group.id, group.label]),
);

export function serviceGroupLabel(group: ServiceGroup): string {
  const label = groupLabels.get(group);
  if (!label) {
    throw new Error(`No display label for service group "${group}".`);
  }
  return label;
}

/**
 * Every user-facing string on `/hizmetler` and `/hizmetler/[slug]`.
 *
 * Components may not contain a Turkish sentence (CLAUDE.md §7), so the section
 * headings, the empty-state wording and the disclaimer all live here. Editing
 * the page's language is an edit to this file.
 *
 * Nothing here asserts a fact about the business. The headings are questions the
 * frontmatter answers; where a service has no data for a block, the block is not
 * rendered at all rather than rendered empty (`docs/CONTENT-PLAN.md` §2).
 */
export const servicePage = {
  index: {
    eyebrow: 'Hizmetler',
    headingLines: ['Uygulamalar,', 'gruplar hâlinde.'],
    /**
     * Says only what is true today: these are the services offered, and which
     * one suits you is decided in person rather than from a page.
     */
    lead: 'Aşağıdaki başlıklar merkezde sunulan uygulamalardır. Hangisinin size uygun olduğuna, seans öncesinde birlikte karar veriyoruz.',
  },

  detail: {
    backToIndex: 'Tüm hizmetler',
    about: 'Bu uygulama nedir?',
    steps: 'Nasıl ilerler?',
    suitableFor: 'Kimler için uygun?',
    aftercare: 'Sonrasında',
    faq: 'Sık sorulan sorular',
    related: 'İlgili hizmetler',
    relatedPosts: 'İlgili yazılar',
    /*
     * There is no CTA copy here on purpose. The closing call to action is the
     * shared `ContactCta` section (docs/CONTENT-PLAN.md §2), so the wording
     * lives once in `home.sections` and every page says the same thing.
     */
  },

  /**
   * The required disclaimer. Re-exported, not restated — the one copy lives in
   * `src/config/legal.ts`, because blog posts carry the same sentence and two
   * copies of a compliance sentence is one too many.
   */
  disclaimer: COSMETIC_DISCLAIMER,
} as const;

/**
 * Supporting photography for a service page body.
 *
 * Each service has ONE hero of its own; the images that break up the body come
 * from the shared gallery pool. That is deliberate rather than a shortcut:
 * twenty services × three unique photographs would be sixty pieces of stock
 * standing in for a room nobody has photographed, and the more stock a
 * pre-launch site carries the more it looks like somebody else's business.
 *
 * The assignment is DETERMINISTIC — an FNV-1a hash of the slug picks a start
 * offset and the images are taken consecutively from there. Two consequences:
 * a given service always shows the same photographs (so a rebuild is not a
 * redesign), and no page repeats one, because the pool is far larger than the
 * count taken.
 */
function hashSlug(slug: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function supportingImageIds(slug: string, count = 2): readonly string[] {
  const pool = imagesInGroup('gallery');
  if (pool.length === 0) return [];

  const start = hashSlug(slug) % pool.length;
  return Array.from(
    { length: Math.min(count, pool.length) },
    (_, index) => pool[(start + index) % pool.length]!.id,
  );
}

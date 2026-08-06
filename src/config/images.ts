/**
 * The image manifest — the ONLY place a path under public/images may appear
 * (CLAUDE.md §8).
 *
 * Photography arrives after the venue opens. Until then every image is
 * placeholder artwork, and the whole set must be swappable without touching a
 * single component: components take an `id` and resolve through here.
 */
export type ManagedImage = {
  readonly id: string;
  /** Path under /public/images. The only place such a path may be written. */
  readonly src: string;
  /**
   * Turkish, descriptive. Empty string ONLY for decorative images — see the
   * note on the launch set below, where empty is the correct answer rather
   * than a shortcut.
   */
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly credit: string | null;
  /** e.g. 'Unsplash Licence', 'Pexels Licence', 'CC0-1.0'. Never blank. */
  readonly licence: string;
  readonly sourceUrl: string | null;
  /** true for launch stock; false only once real photography lands. */
  readonly replaceable: boolean;
};

/**
 * The launch set — 20 service heroes.
 *
 * These are NOT stock photographs. They are abstract gradient fields generated
 * from the palette in docs/DESIGN-SYSTEM.md §1.1 by
 * `scripts/generate-placeholders.mjs`, one per service, in the same visual
 * family as the aurora wash.
 *
 * That choice follows from the content posture (CLAUDE.md §9). A stock photo of
 * a treatment room is a picture of a room that is not this one; a stock photo of
 * a person is a person who does not work here. Both are claims about the
 * business made in pictures rather than in words, and §8 already bans the second
 * outright. Abstract artwork asserts nothing.
 *
 * Three consequences, all deliberate:
 *
 *   - `credit` is null and `sourceUrl` is null because the artwork is ours.
 *     Nothing is attributed to a photographer who does not exist. `licence` is
 *     CC0-1.0, which is the real licence, not a placeholder.
 *   - `alt` is EMPTY. These images carry no information — a screen-reader user
 *     loses nothing by not hearing "warm abstract gradient". Empty alt plus
 *     aria-hidden is the correct answer for decorative artwork, and it means no
 *     alt text has to be invented either. When real photography lands, the alt
 *     is written per image and `ManagedImage` starts announcing it with no
 *     component change.
 *   - Every entry is `replaceable: true`. `replaceableImages()` is the swap
 *     checklist.
 *
 * Constraints that apply to every entry regardless of licence (CLAUDE.md §8):
 * no before/after imagery, and no stock photograph of a person presented as the
 * owner, a staff member or a client.
 */
const PLACEHOLDER = {
  alt: '',
  width: 1600,
  height: 1200,
  credit: null,
  licence: 'CC0-1.0',
  sourceUrl: null,
  replaceable: true,
} as const;

const serviceHero = (slug: string): ManagedImage => ({
  id: `service-${slug}`,
  src: `/images/services/${slug}.webp`,
  ...PLACEHOLDER,
});

/**
 * Blog heroes are **per category, not per post** (added at M9).
 *
 * Fifty posts across six categories do not need fifty pieces of artwork. One
 * image per category keeps the visual family narrow, gives each cluster its own
 * tone, and means writing a post at M10 — or post forty at M14 — never requires
 * inventing a new image or a new manifest entry. Real photography, when it
 * arrives, can still be per post: only this file changes.
 */
const blogHero = (category: string): ManagedImage => ({
  id: `blog-${category}`,
  src: `/images/blog/${category}.webp`,
  ...PLACEHOLDER,
});

export const images: readonly ManagedImage[] = [
  serviceHero('cilt-bakimi'),
  serviceHero('akne-bakimi'),
  serviceHero('yaslanma-karsiti-bakim'),
  serviceHero('leke-bakimi'),
  serviceHero('hassas-cilt-bakimi'),
  serviceHero('kolajen-bakimi'),
  serviceHero('nemlendirme-bakimi'),
  serviceHero('gozenek-sikilastirma'),
  serviceHero('hucre-yenileme'),
  serviceHero('lazer-epilasyon'),
  serviceHero('hydrafacial'),
  serviceHero('karbon-peeling'),
  serviceHero('kimyasal-peeling'),
  serviceHero('dermapen'),
  serviceHero('bb-glow'),
  serviceHero('kalici-makyaj'),
  serviceHero('microblading'),
  serviceHero('kirpik-lifting'),
  serviceHero('kas-tasarimi'),
  serviceHero('gelin-bakim-paketi'),

  blogHero('cilt-bakimi-rehberi'),
  blogHero('cilt-yenileme-rehberi'),
  blogHero('epilasyon-rehberi'),
  blogHero('cilt-ihtiyaclari'),
  blogHero('kas-kirpik-rehberi'),
  blogHero('ozel-gun-ve-mevsim'),
];

const byId = new Map(images.map((image) => [image.id, image]));

/**
 * Resolve an image by id. Throws rather than returning undefined: a missing
 * image is a content bug that should fail the build during static generation,
 * not render a broken box in production.
 */
export function getImage(id: string): ManagedImage {
  const image = byId.get(id);
  if (!image) {
    throw new Error(
      `Unknown image id "${id}". Add it to src/config/images.ts — components ` +
        `must never reference a path under public/images directly.`,
    );
  }
  return image;
}

/** Every image still awaiting real photography. The swap checklist. */
export function replaceableImages(): readonly ManagedImage[] {
  return images.filter((image) => image.replaceable);
}

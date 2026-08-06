/**
 * The image manifest — the ONLY place a path under public/images may appear
 * (CLAUDE.md §8).
 *
 * Photography arrives after the venue opens. Until then every image is
 * placeholder stock, and the whole set must be swappable without touching a
 * single component: components take an `id` and resolve through here.
 */
export type ManagedImage = {
  readonly id: string;
  /** Path under /public/images. The only place such a path may be written. */
  readonly src: string;
  /** Turkish, descriptive. Empty string ONLY for decorative images. */
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
 * Empty until M8 adds the launch set. Typed, so the first entry is checked.
 *
 * Constraints that apply to every entry regardless of licence (CLAUDE.md §8):
 * no before/after imagery, and no stock photograph of a person presented as
 * the owner, a staff member or a client.
 */
export const images: readonly ManagedImage[] = [];

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

/** Every image still awaiting real photography. Used by the M8 swap checklist. */
export function replaceableImages(): readonly ManagedImage[] {
  return images.filter((image) => image.replaceable);
}

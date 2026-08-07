import { ImageCredit } from '@/components/content/ImageCredit';
import { ManagedImage } from '@/components/content/ManagedImage';
import { cn } from '@/lib/cn';

type Ratio = 'wide' | 'landscape' | 'square' | 'portrait';

/**
 * Aspect ratios as tokens rather than arbitrary values. `aspect-[16/9]` written
 * inline in five components is five chances to write `aspect-[16/10]` in one of
 * them (CLAUDE.md §14).
 */
const RATIO: Record<Ratio, string> = {
  wide: 'aspect-[21/9]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
};

/**
 * A managed image with its attribution underneath.
 *
 * The pairing matters: neither the Unsplash nor the Pexels licence requires
 * attribution, but every photograph in the launch set is somebody's work and is
 * standing in for photography that does not exist yet. Crediting it is both the
 * courteous reading of the licences and the only way the owner can find an
 * original later. `ImageCredit` renders nothing when a manifest entry has no
 * credit, so this stays correct when real photography lands.
 */
export function ImageFigure({
  id,
  sizes,
  ratio = 'landscape',
  priority = false,
  rounded = 'rounded-xl',
  className,
  showCredit = true,
  captioned = false,
  caption,
}: {
  id: string;
  sizes: string;
  ratio?: Ratio;
  priority?: boolean;
  rounded?: string;
  className?: string;
  showCredit?: boolean;
  /**
   * Render the description as a visible `<figcaption>` and give the image an
   * EMPTY alt.
   *
   * That is the correct pattern for a captioned figure, not a shortcut: with
   * both set, a screen reader announces the same sentence twice per image —
   * 48 times on the gallery page. The caption names the figure; the image adds
   * nothing by repeating it. axe reports the duplicate as
   * `image-redundant-alt`, which is how this was found.
   */
  captioned?: boolean;
  caption?: string;
}) {
  return (
    <figure className={className}>
      <ManagedImage
        id={id}
        sizes={sizes}
        priority={priority}
        className={cn(RATIO[ratio], rounded)}
        imageClassName={rounded}
        decorative={captioned}
      />
      {captioned && caption ? (
        <figcaption className="mt-3 text-sm text-text-secondary">
          {caption}
        </figcaption>
      ) : null}
      {showCredit && (
        <figcaption>
          <ImageCredit id={id} className="mt-3" />
        </figcaption>
      )}
    </figure>
  );
}

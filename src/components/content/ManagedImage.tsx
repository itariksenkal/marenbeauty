import Image from 'next/image';

import { getImage } from '@/config/images';
import { cn } from '@/lib/cn';

/**
 * The ONLY caller of `next/image` (CLAUDE.md §8, docs/ARCHITECTURE.md §6).
 *
 * Takes a manifest `id` and resolves everything else — path, dimensions, alt —
 * from `src/config/images.ts`. No component anywhere contains a path under
 * `public/images`, so swapping the whole placeholder set for real photography
 * is a one-file change.
 *
 * DECORATIVE HANDLING. An entry whose `alt` is empty is decorative, and is
 * rendered `alt=""` plus `aria-hidden` (CLAUDE.md §16). That is not a shortcut:
 * the launch set is abstract artwork carrying no information, so announcing it
 * would add noise rather than meaning. When real photography lands, the manifest
 * gains a real Turkish alt and this component starts announcing it with no
 * change here.
 *
 * Width and height always come from the manifest, so layout is reserved before
 * the image loads and the reveal can never cause CLS.
 */
export function ManagedImage({
  id,
  sizes,
  priority = false,
  className,
  imageClassName,
  viewTransitionName,
}: {
  id: string;
  /** Explicit, always (CLAUDE.md §8). There is no sensible default. */
  sizes: string;
  /** Above-the-fold heroes only. */
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /**
   * Marks this image as a View Transition endpoint (docs/MOTION.md §3.5).
   * A named element must be unique in the document at capture time, so this is
   * set on ONE image per page — never mapped across a list.
   */
  viewTransitionName?: string;
}) {
  const image = getImage(id);
  const isDecorative = image.alt === '';

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={viewTransitionName ? { viewTransitionName } : undefined}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        aria-hidden={isDecorative || undefined}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
    </div>
  );
}

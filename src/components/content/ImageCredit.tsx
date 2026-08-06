import { getImage } from '@/config/images';
import { cn } from '@/lib/cn';

/**
 * Attribution for an image that has one.
 *
 * Renders NOTHING when the manifest entry has no `credit` — no "Görsel:" label
 * with an empty value, no licence badge on artwork that needs no attribution.
 * The launch set is our own CC0 work, so today this component is invisible
 * everywhere; the moment a credited photograph enters the manifest it appears,
 * with no page change. Same pattern as `channelHref` and `testimonials`.
 */
export function ImageCredit({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const image = getImage(id);
  if (!image.credit) return null;

  return (
    <p className={cn('text-2xs text-text-muted', className)}>
      {image.credit}
      {' · '}
      {image.sourceUrl ? (
        <a
          href={image.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="underline decoration-1 underline-offset-2"
        >
          {image.licence}
        </a>
      ) : (
        image.licence
      )}
    </p>
  );
}

import { ViewTransitionLink } from '@/components/motion/ViewTransitionLink';
import { viewTransitionNames } from '@/config/motion';
import type { Service } from '@/content-layer';

import { ManagedImage } from './ManagedImage';

/**
 * The View Transition SOURCE — signature #5 (docs/MOTION.md §3.5).
 *
 * `transitionName` is passed to `ViewTransitionLink`, which applies it to THIS
 * card only while it is the navigation source and clears it afterwards. A
 * `view-transition-name` must be unique in the document at capture time, so
 * naming all twenty cards up front would make the transition silently do
 * nothing. The detail page carries the same name on its hero, which is what
 * makes the two morph into each other.
 *
 * A Server Component wrapping a client link: the card itself has no behaviour,
 * so none of this markup ships as JavaScript.
 *
 * The hover state is a §1.7 lever — a rose tint across the whole card. Area,
 * not detail, and never the only signal on something this size.
 */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <ViewTransitionLink
      href={`/hizmetler/${service.slug}`}
      transitionName={viewTransitionNames.serviceHero}
      className="group block h-full overflow-hidden rounded-xl border border-border-decor bg-surface-raised transition-colors hover:bg-surface-accent"
    >
      <ManagedImage
        id={service.heroImageId}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/3]"
      />
      <div className="p-6">
        <h3 className="font-display text-2xl tracking-display text-text-primary">
          {service.title}
        </h3>
        <p className="mt-3 text-sm text-text-secondary">{service.summary}</p>
      </div>
    </ViewTransitionLink>
  );
}

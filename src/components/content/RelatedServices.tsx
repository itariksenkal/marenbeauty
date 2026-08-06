import Link from 'next/link';

import { servicePage } from '@/config/services';
import type { Service } from '@/content-layer';

/**
 * Lateral links between service hubs — docs/CONTENT-PLAN.md §5.
 *
 * The list comes from `relatedServices` in frontmatter, resolved by the caller.
 * Dangling references never reach here: they fail the build (integrity check 1),
 * so this component has no "missing service" branch to get wrong.
 *
 * Renders nothing when the list is empty. The graph is fully reciprocal — every
 * link here has a matching link back — and a unit test asserts that, so a
 * one-way link is a test failure rather than a silent SEO dead end.
 *
 * These are NOT `ViewTransitionLink`: the transition morphs a card's image into
 * the detail hero, and these rows carry no image. A named transition with
 * nothing to morph is worse than a plain navigation.
 */
export function RelatedServices({
  services,
}: {
  services: readonly Service[];
}) {
  if (services.length === 0) return null;

  return (
    <nav aria-labelledby="ilgili-hizmetler">
      <h2
        id="ilgili-hizmetler"
        className="font-display text-2xl tracking-display text-text-primary"
      >
        {servicePage.detail.related}
      </h2>
      <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
        {services.map((service) => (
          <li key={service.slug}>
            <Link
              href={`/hizmetler/${service.slug}`}
              className="flex items-baseline justify-between gap-4 border-b border-border-decor py-3 text-text-primary transition-colors hover:bg-surface-decor/40"
            >
              <span>{service.title}</span>
              <span aria-hidden="true" className="text-text-accent">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

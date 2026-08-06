import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { homeHref } from '@/config/navigation';
import { site } from '@/config/site';

/**
 * Layout shell only. Navigation renders from `navigation.ts` at the milestone
 * that needs it; the scroll-linked transparent-to-solid behaviour and the
 * wordmark handoff from the pinned hero arrive at M6 (docs/MOTION.md §4).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border-subtle bg-surface-page/85 backdrop-blur-sm">
      <Container className="flex items-center justify-between py-4">
        <Link
          href={homeHref}
          className="font-display text-xl tracking-display text-text-primary"
        >
          {site.name}
        </Link>
      </Container>
    </header>
  );
}

import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { ui } from '@/config/ui';

/**
 * Layout shell only. Navigation arrives with the config layer (M2); the
 * scroll-linked transparent-to-solid behaviour and the wordmark handoff from
 * the pinned hero arrive at M6 (docs/MOTION.md §4).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border-subtle bg-surface-page/85 backdrop-blur-sm">
      <Container className="flex items-center justify-between py-4">
        <Link
          href="/"
          className="font-display text-xl tracking-display text-text-primary"
        >
          {ui.brand}
        </Link>
      </Container>
    </header>
  );
}

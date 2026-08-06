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
        {/*
          The receiving half of the wordmark cross-fade (docs/MOTION.md §4).
          Its opacity comes from --hero-handoff, which the hero publishes on
          <html>; the default is 1, so every page WITHOUT a hero simply shows
          it. Below the threshold it is visibility:hidden, not merely
          transparent — an invisible link a keyboard user can still land on is
          worse than no link.
        */}
        <Link
          href={homeHref}
          data-header-wordmark=""
          className="font-display text-xl tracking-display text-text-primary"
        >
          {site.name}
        </Link>
      </Container>
    </header>
  );
}

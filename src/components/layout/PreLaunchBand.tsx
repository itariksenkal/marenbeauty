import { Container } from '@/components/layout/Container';
import { home } from '@/config/home';
import { site } from '@/config/site';

/**
 * The honest pre-launch state (CLAUDE.md §10).
 *
 * One sentence. No countdown, no date, no "opening soon!" — there is no
 * confirmed opening date, and pretending otherwise is exactly the kind of
 * invented fact this project refuses to ship.
 *
 * Renders nothing once `isPreLaunch` is false. Flipping that flag must not
 * require touching a component.
 *
 * It is an `<aside>` with a name, not a `<div>`. It sits above the header, so
 * without a landmark it is content outside every region — which axe reports on
 * every page of the site, and which means a screen-reader user navigating by
 * landmark skips it entirely. It is the one sentence explaining why nothing on
 * the site can be booked.
 */
export function PreLaunchBand() {
  if (!site.isPreLaunch) return null;

  return (
    <aside
      aria-label={home.preLaunchLabel}
      className="border-b border-border-decor bg-surface-accent"
    >
      <Container className="py-3">
        <p className="text-center text-sm text-text-secondary">
          {home.preLaunchNotice}
        </p>
      </Container>
    </aside>
  );
}

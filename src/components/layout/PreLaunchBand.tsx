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
 */
export function PreLaunchBand() {
  if (!site.isPreLaunch) return null;

  return (
    <div className="border-b border-border-decor bg-surface-accent">
      <Container className="py-3">
        <p className="text-center text-sm text-text-secondary">
          {home.preLaunchNotice}
        </p>
      </Container>
    </div>
  );
}

import { Container } from '@/components/layout/Container';
import { home } from '@/config/home';
import { site } from '@/config/site';

/**
 * Where the centre is.
 *
 * District only — "Konya, Selçuklu". The premises are not finalised and a
 * guessed street address is worse than none (docs/OPEN-QUESTIONS.md C1), so the
 * address is composed from `site.address` and simply has no street line.
 *
 * NO MAP EMBED. A Google Maps iframe sets third-party cookies, and there is no
 * street address to pin anyway (docs/ARCHITECTURE.md §9).
 *
 * The tinted panel is a §1.7 "large fill" — rose carried by area.
 */
export function LocationCard() {
  return (
    <Container>
      <div className="rounded-2xl bg-surface-accent p-10 sm:p-16">
        <p className="text-xs tracking-eyebrow text-text-secondary uppercase">
          {home.sections.locationEyebrow}
        </p>
        <h2 className="mt-4 font-display text-3xl tracking-display text-text-primary">
          {home.sections.locationHeading}
        </h2>
        <address className="mt-6 text-lg text-text-primary not-italic">
          {site.address.region}, {site.address.locality}
        </address>
      </div>
    </Container>
  );
}

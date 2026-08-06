import { Container } from '@/components/layout/Container';
import { ContactChannels } from '@/components/sections/ContactChannels';
import { home } from '@/config/home';
import { groupedOpeningHours, site } from '@/config/site';

/**
 * Where the centre is, when it is open, and how to reach it.
 *
 * District only — "Konya, Selçuklu". The premises are not finalised and a
 * guessed street address is worse than none (docs/OPEN-QUESTIONS.md C1), so the
 * address is composed from `site.address` and simply has no street line.
 *
 * NO MAP EMBED. A Google Maps iframe sets third-party cookies, which the cookie
 * policy would then have to describe, and there is no street address to pin
 * anyway (docs/ARCHITECTURE.md §9).
 *
 * The hours are PLACEHOLDER (`src/config/site.ts`, C12) and the card says so on
 * screen rather than presenting them as settled. They are shown because a
 * location block with no hours is a hole a visitor notices; they are labelled
 * because a provisional fact presented as final is the failure this project
 * exists to avoid. They stay out of structured data while `isPreLaunch`.
 *
 * The tinted panel is a §1.7 "large fill" — rose carried by area.
 */
export function LocationCard() {
  const hours = groupedOpeningHours();

  return (
    <Container>
      <div className="rounded-2xl bg-surface-accent p-10 sm:p-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs tracking-eyebrow text-text-secondary uppercase">
              {home.sections.locationEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl tracking-display text-text-primary">
              {home.sections.locationHeading}
            </h2>
            <address className="mt-6 text-lg text-text-primary not-italic">
              {site.address.region}, {site.address.locality}
            </address>

            <div className="mt-10">
              <ContactChannels />
            </div>
          </div>

          <div>
            <h3 className="text-xs tracking-eyebrow text-text-secondary uppercase">
              {home.sections.locationHoursHeading}
            </h3>
            <dl className="mt-6 space-y-2">
              {hours.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-baseline justify-between gap-6 border-b border-border-decor pb-2"
                >
                  <dt className="text-text-primary">{entry.label}</dt>
                  <dd className="text-text-secondary tabular-nums">
                    {entry.opens && entry.closes
                      ? `${entry.opens} – ${entry.closes}`
                      : home.sections.locationClosed}
                  </dd>
                </div>
              ))}
            </dl>
            {site.isPreLaunch && (
              <p className="mt-4 text-sm text-text-muted">
                {home.sections.locationHoursNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

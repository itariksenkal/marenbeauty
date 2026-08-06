import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { ContactChannels } from '@/components/sections/ContactChannels';
import { SocialLinks } from '@/components/sections/SocialLinks';
import { home } from '@/config/home';
import { chrome, footerBrand, legalNav, primaryNav } from '@/config/navigation';
import { serviceGroups } from '@/config/services';
import { groupedOpeningHours, site } from '@/config/site';
import { getAllServices } from '@/content-layer';

/**
 * The site footer.
 *
 * A Server Component. It reads the twenty services directly rather than taking
 * them as props: nothing here is interactive, so nothing crosses the client
 * boundary and there is no payload cost to worry about (unlike the header —
 * docs/OPEN-QUESTIONS.md G16).
 *
 * Every fact shown here comes from config, and every one that is a placeholder
 * is labelled as such where it is defined and listed in `docs/STATUS.md`:
 * the phone number, the four social handles and the opening hours. The hours
 * additionally carry their provisional note on screen, because a footer is
 * exactly where a reader takes an opening time as settled.
 *
 * A channel that is not configured renders NOTHING — no greyed-out icon, no
 * "yakında" (CLAUDE.md §7). With every channel unset the contact column
 * collapses to the address alone rather than to a row of dead links.
 */
export function SiteFooter() {
  // Stamped at render, never hardcoded — a stale year reads as an abandoned site.
  const year = new Date().getFullYear();
  const services = getAllServices();
  const hours = groupedOpeningHours();

  return (
    <footer className="mt-px border-t border-border-subtle bg-surface-sunken">
      <Container as="div" className="py-16 lg:py-24">
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className="max-w-lead">
          <p className="font-display text-4xl tracking-display text-text-primary">
            {site.wordmark}
          </p>
          <p className="mt-5 text-text-secondary">{footerBrand.paragraph}</p>
        </div>

        {/* ── Columns ───────────────────────────────────────────────────── */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h2 className="text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.servicesHeading}
            </h2>
            <div className="mt-5 grid gap-8 sm:grid-cols-2">
              {serviceGroups.map((group) => {
                const inGroup = services.filter(
                  (service) => service.group === group.id,
                );
                if (inGroup.length === 0) return null;

                return (
                  <div key={group.id}>
                    <p className="text-sm text-text-primary">{group.label}</p>
                    <ul className="mt-3 space-y-2">
                      {inGroup.map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={`/hizmetler/${service.slug}`}
                            className="duration-fast text-sm text-text-secondary transition-colors hover:text-text-accent focus-visible:focus-ring"
                          >
                            {service.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <nav aria-label={chrome.footerNavLabel}>
            <h2 className="text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.pagesHeading}
            </h2>
            <ul className="mt-5 space-y-2">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="duration-fast text-sm text-text-secondary transition-colors hover:text-text-accent focus-visible:focus-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.legalHeading}
            </h2>
            <ul className="mt-5 space-y-2">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="duration-fast text-sm text-text-secondary transition-colors hover:text-text-accent focus-visible:focus-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.contactHeading}
            </h2>
            <address className="mt-5 text-sm text-text-secondary not-italic">
              {site.address.region}, {site.address.locality}
            </address>
            <ContactChannels className="mt-5 flex-col items-start" />

            <h2 className="mt-10 text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.hoursHeading}
            </h2>
            <dl className="mt-5 space-y-1">
              {hours.map((entry) => (
                <div key={entry.label} className="flex justify-between gap-4">
                  <dt className="text-sm text-text-secondary">{entry.label}</dt>
                  <dd className="text-sm text-text-secondary tabular-nums">
                    {entry.opens && entry.closes
                      ? `${entry.opens}–${entry.closes}`
                      : home.sections.locationClosed}
                  </dd>
                </div>
              ))}
            </dl>
            {site.isPreLaunch && (
              <p className="mt-3 text-2xs text-text-muted">
                {home.sections.locationHoursNote}
              </p>
            )}

            <h2 className="mt-10 text-2xs tracking-eyebrow text-text-accent uppercase">
              {footerBrand.socialHeading}
            </h2>
            <nav aria-label={chrome.socialNavLabel}>
              <SocialLinks className="mt-5 flex-col items-start gap-y-2" />
            </nav>
          </div>
        </div>

        {/* ── Baseline ──────────────────────────────────────────────────── */}
        <div className="mt-16 flex flex-col gap-4 border-t border-border-decor pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            © {year} {site.name}. {chrome.allRightsReserved}
          </p>
          <nav aria-label={chrome.legalNavLabel}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legalNav.slice(0, 3).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="duration-fast text-sm text-text-muted underline decoration-1 underline-offset-4 transition-colors hover:text-text-accent hover:decoration-2 focus-visible:focus-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

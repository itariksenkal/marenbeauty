import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { chrome, legalNav } from '@/config/navigation';
import { site } from '@/config/site';

/**
 * Layout shell. The full mega footer arrives at its own milestone; the legal
 * links are here from M12 because a published notice nobody can reach is not
 * published. Contact channels that are unset render nothing at all — never an
 * empty tel: (CLAUDE.md §7).
 */
export function SiteFooter() {
  // Stamped at render, never hardcoded — a stale year reads as an abandoned site.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      <Container as="div" className="py-12">
        <p className="font-display text-lg text-text-primary">{site.name}</p>

        <nav aria-label={chrome.legalNavLabel} className="mt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-text-secondary underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 text-sm text-text-muted">
          © {year} {site.name}. {chrome.allRightsReserved}
        </p>
      </Container>
    </footer>
  );
}

import { Container } from '@/components/layout/Container';
import { chrome } from '@/config/navigation';
import { site } from '@/config/site';

/**
 * Layout shell only. Navigation, the display address and the legal links render
 * from `navigation.ts` at the milestone that needs them. Contact channels that
 * are unset render nothing at all — never an empty tel: (CLAUDE.md §7).
 */
export function SiteFooter() {
  // Stamped at render, never hardcoded — a stale year reads as an abandoned site.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      <Container as="div" className="py-12">
        <p className="font-display text-lg text-text-primary">{site.name}</p>
        <p className="mt-2 text-sm text-text-muted">
          © {year} {site.name}. {chrome.allRightsReserved}
        </p>
      </Container>
    </footer>
  );
}

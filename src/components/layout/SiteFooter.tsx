import { Container } from '@/components/layout/Container';
import { ui } from '@/config/ui';

/**
 * Layout shell only. Navigation, the display address, legal links and the
 * contact channels all arrive with the config layer (M2). Channels that are
 * unset render nothing at all — never an empty tel: (CLAUDE.md §7).
 */
export function SiteFooter() {
  // Stamped at render, never hardcoded — a stale year reads as an abandoned site.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      <Container as="div" className="py-12">
        <p className="font-display text-lg text-text-primary">{ui.brand}</p>
        <p className="mt-2 text-sm text-text-muted">
          © {year} {ui.brand}. {ui.allRightsReserved}
        </p>
      </Container>
    </footer>
  );
}

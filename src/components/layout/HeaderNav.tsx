'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { ServiceListItem } from '@/components/sections/service-list-item';
import { chrome, megaMenuHref, primaryNav } from '@/config/navigation';
import { serviceGroups } from '@/config/services';
import { cn } from '@/lib/cn';

/**
 * The interactive half of the header: the service mega menu and the mobile
 * drawer.
 *
 * NEITHER IS A SIXTH SIGNATURE INTERACTION (docs/MOTION.md §2 rule 5). Both are
 * chrome, in the same category as a hover state or a focus ring: a 220ms
 * opacity-and-transform transition, well inside the 400ms ceiling, animating
 * nothing but compositable properties. The five signatures are the aurora, the
 * sticky panels, the text reveal, the image reveal and the View Transition, and
 * that list is unchanged.
 *
 * Two accessibility obligations are met by hand rather than by a dependency,
 * because neither is hard and Radix would have been a client bundle on every
 * page for one drawer:
 *
 *   - **Focus trap.** While the drawer is open, Tab and Shift+Tab cycle inside
 *     it. Escape closes it and returns focus to the button that opened it — a
 *     drawer that dumps focus at the top of the document is worse than no
 *     drawer.
 *   - **Route change closes it.** `usePathname()` changing means the visitor
 *     navigated; leaving a full-screen menu covering the page they asked for is
 *     the single most common bug in this component.
 *
 * The mega menu is a `<button aria-expanded>` plus a panel, and it opens on
 * CLICK ONLY. A hover-only dropdown is unreachable by keyboard and unusable on
 * touch — but hover-to-open layered on top of a click toggle is worse than
 * either: the pointer opens the menu on its way to the button, so the click
 * that follows reads as "close". It is one control with two contradictory
 * meanings depending on how you arrived. Click only, plus Escape and an
 * outside click to dismiss.
 */
export function HeaderNav({
  services,
}: {
  services: readonly ServiceListItem[];
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  const megaId = useId();
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const megaToggleRef = useRef<HTMLButtonElement>(null);

  /* ── Close everything when the route changes ───────────────────────────
     Adjusted DURING render, not in an effect. React's documented pattern for
     "reset state when a prop changes": the extra render is discarded before
     the browser paints, so the drawer is never visible over the new page for
     a frame. An effect would set state after commit, which is both a
     cascading render and a flash. */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
    setMegaOpen(false);
  }

  /* ── The body must not scroll behind an open drawer ──────────────────── */
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  /* ── Escape closes whichever is open, and focus goes home ────────────── */
  useEffect(() => {
    if (!drawerOpen && !megaOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (drawerOpen) {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      }
      if (megaOpen) {
        setMegaOpen(false);
        megaToggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, megaOpen]);

  /* ── A click outside dismisses the mega menu ─────────────────────────── */
  useEffect(() => {
    if (!megaOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const header = (event.target as Element | null)?.closest?.(
        '[data-site-header]',
      );
      if (!header) setMegaOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [megaOpen]);

  /* ── Focus trap, while the drawer is open ────────────────────────────── */
  const trapFocus = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const panel = drawerRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  /* ── Move focus into the drawer when it opens ────────────────────────── */
  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current
      ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
      ?.focus();
  }, [drawerOpen]);

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const grouped = serviceGroups.map((group) => ({
    ...group,
    items: services.filter((service) => service.group === group.id),
  }));

  return (
    <>
      {/* ── Desktop navigation ──────────────────────────────────────────── */}
      <nav aria-label={chrome.primaryNavLabel} className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {primaryNav.map((item) =>
            item.href === megaMenuHref ? (
              <li key={item.href}>
                <button
                  ref={megaToggleRef}
                  type="button"
                  aria-expanded={megaOpen}
                  aria-controls={megaId}
                  onClick={() => setMegaOpen((open) => !open)}
                  className={cn(
                    'duration-fast rounded-full px-4 py-2 text-sm transition-colors hover:bg-surface-raised focus-visible:focus-ring',
                    isCurrent(item.href)
                      ? 'text-text-primary'
                      : 'text-text-secondary',
                  )}
                >
                  {item.label}
                  <span aria-hidden="true" className="ml-2 text-text-muted">
                    ↓
                  </span>
                </button>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={cn(
                    'duration-fast inline-block rounded-full px-4 py-2 text-sm transition-colors hover:bg-surface-raised focus-visible:focus-ring',
                    isCurrent(item.href)
                      ? 'text-text-primary'
                      : 'text-text-secondary',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        {/*
          The mega panel. Always in the DOM so find-in-page reaches all twenty
          service names, and hidden with `inert` + visibility rather than
          `display: none`, so the transition has something to animate.
        */}
        <div
          id={megaId}
          data-mega-menu=""
          inert={!megaOpen || undefined}
          aria-label={chrome.servicesMenuLabel}
          data-open={megaOpen ? '' : undefined}
          className={cn(
            'absolute inset-x-0 top-full origin-top border-b border-border-subtle bg-surface-page/95 backdrop-blur-md',
            'duration-base transition-[opacity,transform] ease-standard',
            megaOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none invisible -translate-y-2 opacity-0',
          )}
        >
          <div className="mx-auto grid w-full max-w-page grid-cols-5 gap-8 px-gutter py-10">
            {grouped.map((group) => (
              <div key={group.id}>
                <p className="text-2xs tracking-eyebrow text-text-accent uppercase">
                  {group.label}
                </p>
                <ul className="mt-4 space-y-2">
                  {group.items.map((service) => (
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
            ))}
          </div>
          <div className="mx-auto w-full max-w-page px-gutter pb-8">
            <Link
              href="/hizmetler"
              className="text-sm text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
            >
              {chrome.allServices}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile toggle ───────────────────────────────────────────────── */}
      <button
        ref={drawerToggleRef}
        type="button"
        aria-expanded={drawerOpen}
        aria-controls={drawerId}
        onClick={() => setDrawerOpen((open) => !open)}
        className="duration-fast rounded-full border border-border-strong px-4 py-2 text-sm text-text-accent transition-colors hover:bg-surface-raised focus-visible:focus-ring lg:hidden"
      >
        {drawerOpen ? chrome.closeMenu : chrome.openMenu}
      </button>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <div
        id={drawerId}
        ref={drawerRef}
        data-mobile-drawer=""
        role="dialog"
        aria-modal={drawerOpen || undefined}
        aria-label={chrome.primaryNavLabel}
        inert={!drawerOpen || undefined}
        onKeyDown={trapFocus}
        className={cn(
          'fixed inset-0 top-0 z-overlay overflow-y-auto bg-surface-page lg:hidden',
          'duration-base transition-[opacity,transform] ease-standard',
          drawerOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none invisible -translate-y-4 opacity-0',
        )}
      >
        <div className="mx-auto w-full max-w-page px-gutter py-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                drawerToggleRef.current?.focus();
              }}
              className="rounded-full border border-border-strong px-4 py-2 text-sm text-text-accent focus-visible:focus-ring"
            >
              {chrome.closeMenu}
            </button>
          </div>

          <nav aria-label={chrome.primaryNavLabel} className="mt-8">
            <ul className="space-y-1">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item.href) ? 'page' : undefined}
                    className="block border-b border-border-subtle py-4 font-display text-2xl tracking-display text-text-primary focus-visible:focus-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10">
            <p className="text-2xs tracking-eyebrow text-text-accent uppercase">
              {chrome.servicesMenuLabel}
            </p>
            <div className="mt-4 grid gap-8 sm:grid-cols-2">
              {grouped.map((group) => (
                <div key={group.id}>
                  <p className="text-sm text-text-primary">{group.label}</p>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/hizmetler/${service.slug}`}
                          className="text-sm text-text-secondary focus-visible:focus-ring"
                        >
                          {service.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

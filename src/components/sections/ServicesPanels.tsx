'use client';

import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import {
  StickyPanel,
  StickyPanelStack,
} from '@/components/motion/StickyPanelStack';
import { TextReveal } from '@/components/motion/TextReveal';
import { home } from '@/config/home';
import { serviceGroups } from '@/config/services';
import type { CssVars } from '@/lib/css-vars';

import type { ServiceListItem } from './service-list-item';

/**
 * Signature #2 in place — the sticky panel stack (docs/MOTION.md §3.2).
 *
 * One panel per service group. Each carries its own aurora stops, so the wash
 * warms as the visitor moves through them; `--aurora-a` is never touched, which
 * is what keeps the boundaries soft.
 *
 * This is the largest rose area on the page and the main test of
 * docs/DESIGN-SYSTEM.md §1.7 — rose carries the brand through AREA, not detail.
 *
 * Groups with no services yet still render: they are the confirmed categories,
 * and the panel says only the category name. Nothing here claims what a service
 * involves.
 *
 * Props are `ServiceListItem`, deliberately — see `./service-list-item.ts`.
 */
export function ServicesPanels({
  services,
  panelImages,
}: {
  services: readonly ServiceListItem[];
  /**
   * One already-rendered `<ManagedImage>` per group, keyed by group id.
   *
   * Passed in as SERVER-RENDERED NODES rather than resolved here, for the same
   * reason the list is narrowed to `ServiceListItem`: this module is
   * `'use client'`, so importing `@/config/images` to call `getImage` would put
   * the whole 48-entry manifest — every alt, credit, licence and source URL —
   * into the browser bundle to draw five pictures. It also keeps
   * `ManagedImage` the only caller of `next/image` (CLAUDE.md §8).
   */
  panelImages: Readonly<Record<string, React.ReactNode>>;
}) {
  return (
    <section id="hizmetler">
      <Container className="py-section-y-tight">
        <p className="text-xs tracking-eyebrow text-text-accent uppercase">
          {home.sections.servicesEyebrow}
        </p>
        <TextReveal
          lines={home.sections.servicesHeadingLines}
          as="h2"
          className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary"
        />
      </Container>

      <StickyPanelStack>
        {serviceGroups.map((group, index) => {
          const inGroup = services.filter((s) => s.group === group.id);
          const style: CssVars = {
            '--aurora-b': group.auroraB,
            '--aurora-c': group.auroraC,
          };

          return (
            <StickyPanel
              key={group.id}
              index={index}
              total={serviceGroups.length}
              // The warming ramp — the biggest rose lever on the site
              // (docs/DESIGN-SYSTEM.md §1.7). Tuned in src/config/services.ts,
              // not here.
              className={group.surface}
            >
              <div style={style}>
                <Container>
                  {/*
                    Two columns from lg up, text first. A group with one
                    service used to leave most of a full screen empty — the
                    photograph fills that side rather than the list being
                    stretched to pretend there is more of it.
                  */}
                  <div className="grid min-h-[70svh] items-center gap-12 py-16 lg:grid-cols-[3fr_2fr] lg:gap-16">
                    <div>
                      <p className="text-xs tracking-eyebrow text-text-secondary uppercase">
                        {index + 1} / {serviceGroups.length}
                      </p>
                      <h3 className="mt-4 font-display text-4xl tracking-display text-text-primary">
                        {group.label}
                      </h3>

                      {inGroup.length > 0 ? (
                        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                          {inGroup.map((service) => (
                            <li key={service.slug}>
                              <Link
                                href={`/hizmetler/${service.slug}`}
                                // The hover fill is a rounded container like
                                // every other surface on the site — a square
                                // block of colour was the one control that
                                // looked bolted on. The negative margin keeps
                                // the text on the same optical line as the
                                // heading while the fill gets its inset.
                                className="group -mx-3 flex items-baseline justify-between gap-4 rounded-lg border-b border-border-decor px-3 py-3 text-text-primary transition-colors hover:bg-surface-decor/40"
                              >
                                <span>{service.title}</span>
                                <span
                                  aria-hidden="true"
                                  className="text-text-accent"
                                >
                                  →
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="hidden lg:block">
                      {panelImages[group.id]}
                    </div>
                  </div>
                </Container>
              </div>
            </StickyPanel>
          );
        })}
      </StickyPanelStack>

      <Container className="py-section-y-tight">
        <Link
          href="/hizmetler"
          className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {home.sections.servicesLink}
        </Link>
      </Container>
    </section>
  );
}

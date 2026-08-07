import Link from 'next/link';

import { HeaderNav } from '@/components/layout/HeaderNav';
import { HeaderScrollState } from '@/components/layout/HeaderScrollState';
import { toListItems } from '@/components/sections/service-list-item';
import { BrandGlyph } from '@/components/ui/BrandGlyph';
import { Wordmark } from '@/components/ui/Wordmark';
import { channelHref } from '@/config/contact';
import { chrome, homeHref } from '@/config/navigation';
import { getAllServices } from '@/content-layer';

/**
 * The site header.
 *
 * A Server Component that reads the twenty services once and hands the
 * interactive half a NARROWED list — slug, title, group and nothing else
 * (`toListItems`). `HeaderNav` is a client component, so every prop crosses the
 * boundary as JSON; passing whole `Service` objects would serialise twenty MDX
 * bodies into the payload of every page on the site (docs/OPEN-QUESTIONS.md
 * G16, which is exactly this mistake made once already).
 *
 * **The wordmark handoff.** The receiving half of the cross-fade from the
 * pinned hero (docs/MOTION.md §4) is unchanged: opacity comes from
 * `--hero-handoff`, which the hero publishes on `<html>`, and the header needs
 * no knowledge of the hero. Below the threshold it is `visibility: hidden`, not
 * merely transparent — an invisible link a keyboard user can still land on is
 * worse than no link. The nav and the CTA are deliberately NOT part of the
 * handoff: they are navigation, and withholding them until the hero finishes
 * would leave the first screen with no way out.
 *
 * **Scroll state** is a `data-scrolled` attribute on `<html>`, set by an
 * IntersectionObserver rather than a scroll handler. The header's own styling
 * reads it in CSS, so nothing re-renders while scrolling.
 *
 * The CTA is WhatsApp-first and degrades to the form when no channel is
 * configured — the same hierarchy as the closing CTA, so a visitor is never
 * offered two different primary actions. A channel with no value renders
 * nothing at all (CLAUDE.md §7).
 */
export function SiteHeader() {
  const services = toListItems(getAllServices());
  const whatsapp = channelHref('whatsapp');

  return (
    <>
      <HeaderScrollState />
      <header
        data-site-header=""
        className={[
          'sticky top-0 z-header',
          // Transparent at rest so the aurora shows through; the scrolled state
          // is a CSS rule keyed on <html data-scrolled>, defined in globals.css.
          'border-b border-transparent',
          'duration-base transition-[background-color,border-color,backdrop-filter] ease-standard',
        ].join(' ')}
      >
        <div className="relative mx-auto flex w-full max-w-page items-center justify-between gap-6 px-gutter py-4">
          <Link
            href={homeHref}
            data-header-wordmark=""
            className="text-text-primary focus-visible:focus-ring"
          >
            <Wordmark className="h-8 sm:h-10" />
          </Link>

          <div className="flex items-center gap-3">
            <HeaderNav services={services} />

            {whatsapp ? (
              <a
                data-channel="whatsapp"
                href={whatsapp}
                className="duration-fast hidden items-center gap-2 rounded-full bg-accent-solid px-5 py-2 text-sm text-text-on-accent transition-colors hover:bg-accent-solid-hover focus-visible:focus-ring sm:inline-flex"
              >
                <BrandGlyph channel="whatsapp" className="size-4" />
                {chrome.ctaWhatsapp}
              </a>
            ) : (
              <Link
                href="/iletisim"
                className="duration-fast hidden rounded-full bg-accent-solid px-5 py-2 text-sm text-text-on-accent transition-colors hover:bg-accent-solid-hover focus-visible:focus-ring sm:inline-block"
              >
                {chrome.ctaForm}
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

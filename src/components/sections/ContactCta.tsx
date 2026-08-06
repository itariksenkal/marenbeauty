import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { channelHref } from '@/config/contact';
import { home } from '@/config/home';

/**
 * The closing call to action — where the water settles (docs/MOTION.md §1).
 *
 * CTA hierarchy is WhatsApp-first (docs/BRIEF.md §6), degrading to the contact
 * form, which is the only live channel today.
 *
 * Channels that are unset render NOTHING: no disabled button, no greyed-out
 * icon, no "yakında" tooltip. `channelHref` returns `string | null` and never a
 * bare scheme, so an empty `tel:` cannot be emitted even by accident — and
 * `npm run guard` fails the build if one ever reaches output.
 *
 * Every channel link carries `data-channel`, which is how guard rule 3 tells a
 * dead channel button from an ordinary in-page anchor (CLAUDE.md §12).
 */
export function ContactCta() {
  const whatsapp = channelHref('whatsapp');
  const phone = channelHref('phone');

  return (
    <Section
      tone="transparent"
      aurora={{ b: 'var(--mb-rose-beige)', c: 'var(--mb-champagne)' }}
    >
      <Container>
        <div className="mx-auto max-w-lead text-center">
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {home.sections.contactEyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl tracking-display text-balance text-text-primary">
            {home.sections.contactHeadingLines.join(' ')}
          </h2>
          <p className="mt-5 text-text-secondary">
            {home.sections.contactBody}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {/* Primary once configured. Absent entirely until then. */}
            {whatsapp ? (
              <a
                data-channel="whatsapp"
                href={whatsapp}
                className="rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent transition-colors hover:bg-accent-solid-hover"
              >
                {home.sections.contactWhatsappCta}
              </a>
            ) : null}

            {phone ? (
              <a
                data-channel="phone"
                href={phone}
                className="rounded-lg border border-border-strong px-6 py-3 text-sm tracking-wide text-text-accent transition-colors hover:bg-surface-accent"
              >
                {home.sections.contactPhoneCta}
              </a>
            ) : null}

            {/*
              The form is always available, so it is the fallback primary while
              no channel is configured — and stays present afterwards.
            */}
            <Link
              href="/iletisim"
              className={
                whatsapp
                  ? 'rounded-lg border border-border-strong px-6 py-3 text-sm tracking-wide text-text-accent transition-colors hover:bg-surface-accent'
                  : 'rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent transition-colors hover:bg-accent-solid-hover'
              }
            >
              {home.sections.contactFormCta}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

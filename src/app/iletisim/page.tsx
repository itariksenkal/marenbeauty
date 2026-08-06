import type { Metadata } from 'next';

import { ContactForm } from '@/components/forms/ContactForm';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactChannels } from '@/components/sections/ContactChannels';
import { LocationCard } from '@/components/sections/LocationCard';
import { contactForm, type ContactResult } from '@/config/forms';
import { getAllServices } from '@/content-layer';
import { issueFormToken } from '@/lib/spam/form-token';

/**
 * `/iletisim` — the only conversion path, and the only page rendered per
 * request.
 *
 * IT IS DYNAMIC, and it has to be. Two independent reasons:
 *
 *   1. It issues a signed, short-lived, single-use page token
 *      (`src/lib/spam/form-token.ts`). A token baked in at build time would be
 *      identical for every visitor and expire minutes after the deploy.
 *   2. It reads `searchParams`, because the no-JavaScript path posts the form
 *      and comes back here with the outcome in the URL. Reading search params
 *      opts a route out of static rendering anyway.
 *
 * `docs/ARCHITECTURE.md` §2 previously listed this route as Static; that is
 * updated. One SSR page for the one form on the site — everything else stays
 * prerendered.
 *
 * CONSEQUENCE WORTH KNOWING: `npm run guard` scans prerendered output, so a
 * dynamic route emits no `.html` for it to read. The copy is scanned instead by
 * a unit test running the real guard rules over `src/config/forms.ts`
 * (docs/OPEN-QUESTIONS.md G21).
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: contactForm.eyebrow,
  description: contactForm.lead,
};

/** Only the values the handler can actually send back. */
function readResult(value: string | undefined): ContactResult | undefined {
  const match = Object.entries(contactForm.resultValues).find(
    ([, param]) => param === value,
  );
  return match ? (match[0] as ContactResult) : undefined;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params[contactForm.resultParam];
  const result = readResult(Array.isArray(raw) ? raw[0] : raw);

  const services = getAllServices().map((service) => ({
    slug: service.slug,
    title: service.title,
  }));

  return (
    <>
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-rose-beige)', c: 'var(--mb-champagne)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {contactForm.eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {contactForm.heading}
          </h1>
          <p className="mt-6 max-w-lead text-text-secondary">
            {contactForm.lead}
          </p>

          {/* Renders nothing while no channel is configured. */}
          <div className="mt-8">
            <ContactChannels />
          </div>
        </Container>
      </Section>

      <Section tone="raised" rhythm="tight">
        <Container>
          <ContactForm
            formToken={issueFormToken()}
            services={services}
            initialResult={result}
          />
        </Container>
      </Section>

      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-blush)' }}
      >
        <LocationCard />
      </Section>
    </>
  );
}

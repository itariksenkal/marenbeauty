import type { Metadata } from 'next';
import Link from 'next/link';

import { Faq } from '@/components/content/Faq';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { faqPage, generalFaq } from '@/config/faq';
import { serviceGroups, serviceGroupLabel } from '@/config/services';
import { routeSeo } from '@/config/seo';
import { faqPageNode, standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllServices } from '@/content-layer';

/**
 * `/sss` — the site-wide FAQ.
 *
 * The general questions live in `src/config/faq.ts`. The per-service questions
 * do NOT: each service page carries its own `faq` frontmatter and its own
 * `FAQPage` markup, and repeating them here would put the same question on two
 * indexable URLs. This page links to the services that have questions instead,
 * and says how many — which is information the visitor can act on.
 */
export const metadata: Metadata = pageMetadata({
  title: routeSeo.faq.title,
  description: routeSeo.faq.description,
  path: '/sss',
});

export default function FaqRoute() {
  const services = getAllServices();

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: '/sss',
          name: routeSeo.faq.title,
          description: routeSeo.faq.description,
          trail: [{ name: routeSeo.faq.title, path: '/sss' }],
          services,
          // The general questions only. Each service page carries its own
          // FAQPage for its own questions; repeating them here would put the
          // same Q&A on two indexable URLs.
          extra: [faqPageNode('/sss', generalFaq)],
        })}
      />
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-champagne-light)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {faqPage.eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {faqPage.headingLines.join(' ')}
          </h1>
          <p className="mt-6 max-w-lead text-text-secondary">{faqPage.lead}</p>
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight">
        <Container>
          <Faq
            items={generalFaq}
            title={faqPage.generalHeading}
            headingId="genel-sorular"
          />
        </Container>
      </Section>

      <Section tone="sunken" rhythm="tight">
        <Container>
          <h2 className="font-display text-2xl tracking-display text-text-primary">
            {faqPage.servicesHeading}
          </h2>
          <p className="mt-4 max-w-lead text-text-secondary">
            {faqPage.servicesLead}
          </p>

          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {serviceGroups.map((group) => {
              const inGroup = services.filter(
                (service) => service.group === group.id && service.faq.length,
              );
              if (inGroup.length === 0) return null;

              return (
                <div key={group.id}>
                  <h3 className="font-display text-lg tracking-display text-text-primary">
                    {serviceGroupLabel(group.id)}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {inGroup.map((service) => (
                      <li key={service.slug}>
                        <Link
                          href={`/hizmetler/${service.slug}#sss`}
                          className="text-sm text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
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
        </Container>
      </Section>

      <ContactCta />
    </>
  );
}

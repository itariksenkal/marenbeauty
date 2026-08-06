import type { Metadata } from 'next';

import { ServiceGrid } from '@/components/content/ServiceGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { serviceGroups, servicePage } from '@/config/services';
import { routeSeo } from '@/config/seo';
import { standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllServices } from '@/content-layer';

/**
 * Service index — all 20, grouped (docs/ARCHITECTURE.md §2).
 *
 * A Server Component with no copy of its own: every sentence comes from
 * `src/config/services.ts` (CLAUDE.md §7).
 *
 * The group order is the config's, not the content's, so the page reads in the
 * same sequence as the home panels. A group with no services renders nothing —
 * `ServiceGrid` returns null and the heading goes with it, so an empty category
 * never appears as a bare title.
 *
 * Full SEO — canonicals, OG images, JSON-LD — arrives at M13. This sets only
 * the title and description, from copy that already exists.
 */
export const metadata: Metadata = pageMetadata({
  title: routeSeo.services.title,
  description: routeSeo.services.description,
  path: '/hizmetler',
});

export default function ServicesIndexPage() {
  const services = getAllServices();

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: '/hizmetler',
          name: routeSeo.services.title,
          description: routeSeo.services.description,
          type: 'CollectionPage',
          trail: [{ name: routeSeo.services.title, path: '/hizmetler' }],
          services,
        })}
      />
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-rose-beige)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {servicePage.index.eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {servicePage.index.headingLines.join(' ')}
          </h1>
          <p className="mt-6 max-w-lead text-text-secondary">
            {servicePage.index.lead}
          </p>
        </Container>
      </Section>

      {serviceGroups.map((group) => {
        const inGroup = services.filter(
          (service) => service.group === group.id,
        );
        if (inGroup.length === 0) return null;

        return (
          <Section
            key={group.id}
            tone="transparent"
            rhythm="tight"
            aurora={{ b: group.auroraB, c: group.auroraC }}
          >
            <Container>
              <h2 className="mb-8 font-display text-3xl tracking-display text-text-primary">
                {group.label}
              </h2>
              <ServiceGrid services={inGroup} />
            </Container>
          </Section>
        );
      })}

      <Section tone="transparent" rhythm="tight">
        <Container>
          <p className="max-w-reading text-sm text-text-muted">
            {servicePage.disclaimer}
          </p>
        </Container>
      </Section>

      <ContactCta />
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Faq } from '@/components/content/Faq';
import { ImageFigure } from '@/components/content/ImageFigure';
import { ManagedImage } from '@/components/content/ManagedImage';
import { Mdx } from '@/components/content/Mdx';
import { RelatedPosts } from '@/components/content/RelatedPosts';
import { RelatedServices } from '@/components/content/RelatedServices';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { viewTransitionNames } from '@/config/motion';
import {
  serviceGroupLabel,
  serviceGroups,
  servicePage,
  supportingImageIds,
} from '@/config/services';
import { routeSeo } from '@/config/seo';
import { faqPageNode, serviceNode, standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import {
  getAllServices,
  getAllServiceSlugs,
  getPostsByService,
  getServiceBySlug,
  type Service,
} from '@/content-layer';

/**
 * Service detail — 20 statically generated pages (docs/ARCHITECTURE.md §2).
 *
 * THE SKELETON IS docs/CONTENT-PLAN.md §2, and every block is conditional on
 * having data. A service with no `aftercare` shows no "Sonrasında" section, not
 * an empty one.
 *
 * There is NO "Süre" block. `durationLabel` is `null` on every service (C4) and
 * this template never reads it — the field is unrendered, not rendering empty.
 * A unit test asserts the string does not appear in this file.
 *
 * Copy: no Turkish sentence lives here. Section headings come from
 * `src/config/services.ts`; everything else comes from frontmatter or the MDX
 * body (CLAUDE.md §7).
 *
 * SEO beyond title and description — canonicals, OG images, the `FAQPage` and
 * `Service` JSON-LD — arrives at M13, built against docs/SEO.md in one pass.
 */
export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

/** An unknown slug 404s rather than rendering a shell. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  return pageMetadata({
    title: service.seo.title ?? service.title,
    description: service.seo.description ?? service.summary,
    path: `/hizmetler/${service.slug}`,
  });
}

function aurora(service: Service) {
  const group = serviceGroups.find((entry) => entry.id === service.group);
  return group ? { b: group.auroraB, c: group.auroraC } : undefined;
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const related = service.relatedServices
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter((entry): entry is Service => entry !== null);
  const posts = getPostsByService(service.slug);
  const supporting = supportingImageIds(service.slug);

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: `/hizmetler/${service.slug}`,
          name: service.title,
          description: service.summary,
          type: 'ItemPage',
          trail: [
            { name: routeSeo.services.title, path: '/hizmetler' },
            { name: service.title, path: `/hizmetler/${service.slug}` },
          ],
          services: getAllServices(),
          extra: [
            serviceNode(service),
            faqPageNode(`/hizmetler/${service.slug}`, service.faq),
          ],
        })}
      />
      <Section tone="transparent" rhythm="tight" aurora={aurora(service)}>
        <Container>
          <p>
            <Link
              href="/hizmetler"
              className="text-sm text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {servicePage.detail.backToIndex}
            </Link>
          </p>

          <p className="mt-10 text-xs tracking-eyebrow text-text-accent uppercase">
            {service.eyebrow ?? serviceGroupLabel(service.group)}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {service.title}
          </h1>
          <p className="mt-6 max-w-lead text-lg text-text-secondary">
            {service.summary}
          </p>

          {/*
            The View Transition TARGET (docs/MOTION.md §3.5). The card the
            visitor activated carries the same name on the way out, which is
            what makes the two morph rather than cross-fade.

            No ImageReveal here, deliberately: the clip-path wipe and the
            morph would both be animating the same element from different
            start states. The transition IS this image's entrance.
          */}
          <ManagedImage
            id={service.heroImageId}
            sizes="(min-width: 1200px) 1200px, 100vw"
            priority
            className="mt-12 aspect-[16/9] rounded-xl"
            imageClassName="rounded-xl"
            viewTransitionName={viewTransitionNames.serviceHero}
          />
        </Container>
      </Section>

      <Section tone="raised" rhythm="tight">
        <Container>
          <h2 className="font-display text-2xl tracking-display text-text-primary">
            {servicePage.detail.about}
          </h2>
          <div className="mt-6">
            {/* `service.file`, not a path built here — CLAUDE.md §5. */}
            <Mdx source={service.body} file={service.file} />
          </div>

          {/*
            Supporting photography, two frames, from the shared pool
            (`supportingImageIds`). Deterministic per slug, so a rebuild is not
            a redesign, and never `priority` — they sit below the fold and
            competing with the hero for the first bytes is exactly how a hero
            gets slower.
          */}
          {supporting.length > 0 && (
            <div className="mt-16 grid gap-6 sm:grid-cols-2">
              {supporting.map((imageId) => (
                <ImageFigure
                  key={imageId}
                  id={imageId}
                  ratio="landscape"
                  sizes="(min-width: 640px) 50vw, 100vw"
                />
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight" aurora={aurora(service)}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            <section aria-labelledby="nasil-ilerler">
              <h2
                id="nasil-ilerler"
                className="font-display text-2xl tracking-display text-text-primary"
              >
                {servicePage.detail.steps}
              </h2>
              <ol className="mt-6">
                {service.steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="border-t border-border-decor py-5"
                  >
                    <p className="text-2xs tracking-eyebrow text-text-accent uppercase">
                      {index + 1}
                    </p>
                    <p className="mt-2 text-text-primary">{step.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-col gap-16">
              {service.suitableFor.length > 0 ? (
                <section aria-labelledby="kimler-icin">
                  <h2
                    id="kimler-icin"
                    className="font-display text-2xl tracking-display text-text-primary"
                  >
                    {servicePage.detail.suitableFor}
                  </h2>
                  <ul className="mt-6">
                    {service.suitableFor.map((item) => (
                      <li
                        key={item}
                        className="border-t border-border-decor py-3 text-text-secondary"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {service.aftercare.length > 0 ? (
                <section aria-labelledby="sonrasinda">
                  <h2
                    id="sonrasinda"
                    className="font-display text-2xl tracking-display text-text-primary"
                  >
                    {servicePage.detail.aftercare}
                  </h2>
                  <ul className="mt-6">
                    {service.aftercare.map((item) => (
                      <li
                        key={item}
                        className="border-t border-border-decor py-3 text-text-secondary"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="raised" rhythm="tight">
        <Container>
          <Faq items={service.faq} title={servicePage.detail.faq} />
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight" aurora={aurora(service)}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            <RelatedServices services={related} />
            <RelatedPosts
              posts={posts}
              title={servicePage.detail.relatedPosts}
            />
          </div>
          <p className="mt-16 max-w-reading text-sm text-text-muted">
            {servicePage.disclaimer}
          </p>
        </Container>
      </Section>

      <ContactCta />
    </>
  );
}

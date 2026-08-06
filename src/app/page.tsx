import { ImageFigure } from '@/components/content/ImageFigure';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { BlogTeaser } from '@/components/sections/BlogTeaser';
import { ContactCta } from '@/components/sections/ContactCta';
import { ExperienceProcess } from '@/components/sections/ExperienceProcess';
import { HeroWater } from '@/components/sections/HeroWater';
import { LocationCard } from '@/components/sections/LocationCard';
import { ServicesPanels } from '@/components/sections/ServicesPanels';
import { toListItems } from '@/components/sections/service-list-item';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { routeSeo } from '@/config/seo';
import { standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllPosts, getAllServices } from '@/content-layer';

/**
 * The home title deliberately does NOT take the `%s | Maren Beauty` template:
 * it already carries the brand name, and a doubled suffix is the commonest way
 * a home title overruns 60 characters (docs/SEO.md §1).
 */
export const metadata = {
  ...pageMetadata({
    title: routeSeo.home.title,
    description: routeSeo.home.description,
    path: '/',
  }),
  title: { absolute: routeSeo.home.title },
};

/**
 * Home.
 *
 * No copy here — every sentence comes from `src/config/home.ts` (CLAUDE.md §7).
 *
 * Reading the content layer from a route puts it in the build graph, so from
 * now on invalid frontmatter or a dangling reference fails `next build`
 * directly, not only `npm run test` (docs/OPEN-QUESTIONS.md G12 — closed).
 */
export default function HomePage() {
  const services = getAllServices();
  const posts = getAllPosts();

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: '/',
          name: routeSeo.home.title,
          description: routeSeo.home.description,
          services,
        })}
      />
      <HeroWater />
      {/* Narrowed here, on the server: the panel list is a client component,
          so anything passed whole is serialised into the RSC payload. */}
      <ServicesPanels services={toListItems(services)} />

      {/*
        One wide frame between the panel stack and the pinned process section.
        It is a breath, not an illustration of anything — and it is the widest
        image on the site, so it is the one that sets the visual register.
      */}
      <Section tone="transparent" rhythm="tight">
        <Container>
          <ImageFigure
            id="page-home-venue"
            ratio="wide"
            sizes="(min-width: 1200px) 1200px, 100vw"
            rounded="rounded-2xl"
          />
        </Container>
      </Section>

      <ExperienceProcess />
      <TestimonialsSection />
      <BlogTeaser posts={posts} />

      <Section
        tone="transparent"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-blush)' }}
      >
        <LocationCard />
      </Section>

      <ContactCta />
    </>
  );
}

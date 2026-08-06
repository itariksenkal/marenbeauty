import { Section } from '@/components/layout/Section';
import { BlogTeaser } from '@/components/sections/BlogTeaser';
import { ContactCta } from '@/components/sections/ContactCta';
import { ExperienceProcess } from '@/components/sections/ExperienceProcess';
import { HeroWater } from '@/components/sections/HeroWater';
import { LocationCard } from '@/components/sections/LocationCard';
import { ServicesPanels } from '@/components/sections/ServicesPanels';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { getAllPosts, getAllServices } from '@/content-layer';

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
      <HeroWater />
      <ServicesPanels services={services} />
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

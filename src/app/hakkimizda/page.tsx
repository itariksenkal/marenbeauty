import type { Metadata } from 'next';

import { Mdx } from '@/components/content/Mdx';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { ExperienceSteps } from '@/components/sections/ExperienceSteps';
import { LocationCard } from '@/components/sections/LocationCard';
import { home } from '@/config/home';
import { getEditorialPage } from '@/content-layer';

const SLUG = 'hakkimizda';

/**
 * `/hakkimizda` — the centre, the name and the approach.
 *
 * The prose is MDX so the owner can edit it. The visit sequence is rendered
 * from `src/config/experience.ts` — the same four steps the home page pins, via
 * the shared `ExperienceSteps`, so the two can never drift. Unpinned here: the
 * site holds the viewport in exactly two places and this is not one of them
 * (docs/MOTION.md §2.6).
 */
export const metadata: Metadata = {
  title: getEditorialPage(SLUG).title,
  description: getEditorialPage(SLUG).summary,
};

export default function AboutPage() {
  const page = getEditorialPage(SLUG);

  return (
    <>
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-rose-beige)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {page.title}
          </h1>
          <p className="mt-6 max-w-lead text-lg text-text-secondary">
            {page.lead}
          </p>
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight">
        <Container>
          <Mdx source={page.body} file={page.file} />
        </Container>
      </Section>

      <Section tone="raised" rhythm="default">
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {home.sections.experienceEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-display text-text-primary">
            {home.sections.experienceHeading}
          </h2>
          <ExperienceSteps className="mt-12" />
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight">
        <LocationCard />
      </Section>

      <ContactCta />
    </>
  );
}

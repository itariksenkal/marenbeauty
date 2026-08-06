import type { Metadata } from 'next';

import { ImageFigure } from '@/components/content/ImageFigure';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { galleryPage } from '@/config/gallery';
import {
  imageCredits,
  imagesInGroup,
  type ManagedImage,
} from '@/config/images';

/**
 * `/galeri` — the whole launch image set, grouped by the surface it serves.
 *
 * The lead says, above the images, that none of them is the centre. That is the
 * page's most important line: a gallery is read as "photographs of this place",
 * and these are not (`src/config/gallery.ts`).
 *
 * Credits are rendered once at the bottom rather than under all 48 frames —
 * `imageCredits()` dedupes by photographer, which turns 48 captions into a
 * readable list and keeps the grid from becoming a wall of small print.
 */
export const metadata: Metadata = {
  title: 'Galeri',
  description: galleryPage.lead.slice(0, 160),
};

const TONES = ['transparent', 'raised', 'transparent', 'sunken'] as const;

export default function GalleryPage() {
  const credits = imageCredits();

  return (
    <>
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-rose-beige)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {galleryPage.eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {galleryPage.headingLines.join(' ')}
          </h1>
          <p className="mt-6 max-w-lead text-lg text-text-secondary">
            {galleryPage.lead}
          </p>
          <p className="mt-4 max-w-lead text-text-muted">{galleryPage.note}</p>
        </Container>
      </Section>

      {galleryPage.sections.map((section, index) => {
        const images = imagesInGroup(section.group as ManagedImage['group']);
        if (images.length === 0) return null;

        return (
          <Section
            key={section.id}
            id={section.id}
            tone={TONES[index % TONES.length]}
            rhythm="tight"
          >
            <Container>
              <h2 className="font-display text-2xl tracking-display text-text-primary">
                {section.heading}
              </h2>
              <p className="mt-3 max-w-lead text-text-secondary">
                {section.body}
              </p>

              <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, position) => (
                  <li key={image.id}>
                    <ImageFigure
                      id={image.id}
                      ratio="landscape"
                      // Only the very first frame is eager: it is the one
                      // above the fold on a phone, and marking a grid of 48
                      // priority would mean none of them is.
                      priority={index === 0 && position === 0}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      showCredit={false}
                    />
                    <p className="mt-3 text-sm text-text-secondary">
                      {image.alt}
                    </p>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        );
      })}

      <Section tone="transparent" rhythm="tight">
        <Container width="reading">
          <h2 className="font-display text-xl tracking-display text-text-primary">
            {galleryPage.creditsHeading}
          </h2>
          <p className="mt-3 text-text-secondary">{galleryPage.creditsBody}</p>
          <ul className="mt-6 space-y-2">
            {credits.map((credit) => (
              <li
                key={`${credit.credit}-${credit.licence}`}
                className="text-sm"
              >
                <span className="text-text-primary">{credit.credit}</span>
                <span className="text-text-muted"> · </span>
                <a
                  href={credit.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
                >
                  {credit.licence}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactCta />
    </>
  );
}

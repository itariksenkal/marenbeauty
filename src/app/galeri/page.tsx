import type { Metadata } from 'next';

import { ImageFigure } from '@/components/content/ImageFigure';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ContactCta } from '@/components/sections/ContactCta';
import { galleryPage } from '@/config/gallery';
import { imagesInGroup, type ManagedImage } from '@/config/images';
import { routeSeo } from '@/config/seo';
import { standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllServices } from '@/content-layer';

/**
 * `/galeri` — the whole launch image set, grouped by the surface it serves.
 *
 * The lead says, above the images, that none of them is the centre. That is the
 * page's most important line: a gallery is read as "photographs of this place",
 * and these are not (`src/config/gallery.ts`).
 *
 * No photographer attribution is rendered. Neither the Unsplash Licence nor the
 * Pexels Licence requires it, and the owner asked for it removed on 2026-08-07
 * (docs/OPEN-QUESTIONS.md G30). `credit`, `licence` and `sourceUrl` stay
 * recorded per entry in `src/config/images.ts`, which is what `CLAUDE.md` §8
 * asks for and the only way to find an original later.
 */
export const metadata: Metadata = pageMetadata({
  title: routeSeo.gallery.title,
  description: routeSeo.gallery.description,
  path: '/galeri',
});

const TONES = ['transparent', 'raised', 'transparent', 'sunken'] as const;

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: '/galeri',
          name: routeSeo.gallery.title,
          description: routeSeo.gallery.description,
          type: 'CollectionPage',
          trail: [{ name: routeSeo.gallery.title, path: '/galeri' }],
          services: getAllServices(),
        })}
      />
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
                      // The caption below IS the description. Repeating it in
                      // alt makes a screen reader announce the same sentence
                      // twice per frame — 48 times on this page — which axe
                      // reports as image-redundant-alt and a listener would
                      // experience as noise.
                      captioned
                      caption={image.alt}
                    />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        );
      })}

      <ContactCta />
    </>
  );
}

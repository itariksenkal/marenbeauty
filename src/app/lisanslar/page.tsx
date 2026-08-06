import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { legalPage } from '@/config/legal';

/**
 * `/lisanslar` — third-party attribution.
 *
 * Satisfies the CC-BY condition recorded in docs/OPEN-QUESTIONS.md E4 as a
 * PUBLIC surface. The generated `NOTICE` already satisfies it on disk; a
 * licence that obliges attribution is better served by attribution a visitor
 * can actually reach.
 *
 * Read at build time from the generated file, never transcribed. `npm run
 * licenses` regenerates `NOTICE` and fails if the committed copy has drifted
 * from the real dependency tree, so this page cannot quietly go stale.
 *
 * `noindex`: it is a required attribution surface, not search-facing content,
 * and 1,200 lines of package names would be a poor thing to rank for.
 */
export const metadata: Metadata = {
  title: legalPage.licences.title,
  description: legalPage.licences.lead,
  robots: { index: false, follow: true },
};

function readNotice(): string {
  return readFileSync(join(process.cwd(), 'NOTICE'), 'utf8');
}

export default function LicencesPage() {
  const notice = readNotice();

  return (
    <>
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-sand)', c: 'var(--mb-nude)' }}
      >
        <Container width="reading">
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {legalPage.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-display text-text-primary">
            {legalPage.licences.title}
          </h1>
          <p className="mt-6 text-text-secondary">{legalPage.licences.lead}</p>
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight">
        <Container width="reading">
          <h2 className="font-display text-xl tracking-display text-text-primary">
            {legalPage.licences.fontsHeading}
          </h2>
          <p className="mt-3 text-text-secondary">
            {legalPage.licences.fontsBody}
          </p>
          <ul className="mt-4 space-y-2">
            {legalPage.licences.fontLicences.map((licence) => (
              <li key={licence.href}>
                <a
                  href={licence.href}
                  className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
                >
                  {licence.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-sm text-text-muted">
            {legalPage.licences.generatedNote}
          </p>

          {/*
            A <pre> because NOTICE is column-aligned plain text: reflowing it
            into prose would destroy the alignment that makes it readable.
            It scrolls inside its own box so the page body never scrolls
            horizontally at 320px.
          */}
          <pre className="mt-6 overflow-x-auto rounded-lg bg-surface-sunken p-6 text-2xs leading-ui text-text-secondary">
            {notice}
          </pre>
        </Container>
      </Section>
    </>
  );
}

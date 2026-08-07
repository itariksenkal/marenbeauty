import Link from 'next/link';
import type { ReactNode } from 'react';

import { Mdx } from '@/components/content/Mdx';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { legal, legalPage } from '@/config/legal';
import { legalEntity } from '@/config/legal-entity';
import { formatDateLong } from '@/lib/date';
import type { LegalDocument } from '@/content-layer';

/**
 * The shared shell for the three legal documents.
 *
 * A Server Component with no copy of its own — every sentence comes from
 * `src/config/legal.ts` or from the MDX body (CLAUDE.md §7).
 *
 * Two things are rendered HERE rather than written into the three MDX files,
 * and both for the same reason: a compliance statement repeated three times is
 * three chances to drift.
 *
 *   - The **data-controller block**, which carries the unresolved-ünvan state
 *     (docs/OPEN-QUESTIONS.md B2). No entity name is printed while it is
 *     unresolved: not a guess, not a plausible placeholder, and not the
 *     `{{LEGAL_ENTITY}}` token, which is not a name either and which the guard
 *     blocks from reaching output by design.
 *   - The **unreviewed-draft notice** required by C8. It disappears by itself
 *     when `legal.isLawyerReviewed` flips — nothing to remember, nothing to
 *     delete by hand.
 */
export async function LegalDocumentPage({
  document,
  others,
  aside,
}: {
  document: LegalDocument;
  others: readonly LegalDocument[];
  /**
   * Optional interactive block, rendered after the body. Only the cookie
   * policy uses it, for the consent preferences panel — which belongs on the
   * page that explains what it controls, not in a floating widget.
   */
  aside?: ReactNode;
}) {
  const entity = legalEntity();

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
            {document.title}
          </h1>
          <p className="mt-6 text-text-secondary">{document.summary}</p>
        </Container>
      </Section>

      <Section tone="transparent" rhythm="none">
        <Container width="reading">
          {!legal.isLawyerReviewed && (
            <aside className="rounded-lg border border-border-strong bg-surface-raised p-6">
              <p className="font-display text-lg tracking-display text-text-primary">
                {legalPage.draftNotice.heading}
              </p>
              <p className="mt-3 text-sm text-text-secondary">
                {legalPage.draftNotice.body}
              </p>
            </aside>
          )}

          <div className="mt-8 rounded-lg bg-surface-sunken p-6">
            <h2 className="font-display text-lg tracking-display text-text-primary">
              {legalPage.controller.heading}
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              {legalPage.controller.brandLine}
            </p>
            {entity.resolved ? (
              <p className="mt-2 text-sm text-text-secondary">
                {legalPage.controller.resolvedLabel}: {entity.name}
              </p>
            ) : (
              <p className="mt-2 text-sm text-text-muted">
                {legalPage.controller.unresolved}
              </p>
            )}
            <p className="mt-4 text-sm text-text-muted">
              {legalPage.effectiveDateLabel}:{' '}
              {legal.effectiveDate
                ? formatDateLong(legal.effectiveDate)
                : legalPage.noEffectiveDate}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="transparent" rhythm="tight">
        <Container width="reading">
          <Mdx source={document.body} file={document.file} />
          {aside ? <div className="mt-12 max-w-reading">{aside}</div> : null}
        </Container>
      </Section>

      <Section tone="sunken" rhythm="tight">
        <Container width="reading">
          <h2 className="font-display text-xl tracking-display text-text-primary">
            {legalPage.contactHeading}
          </h2>
          <p className="mt-3 text-text-secondary">{legalPage.contactBody}</p>
          <p className="mt-6">
            <Link
              href="/iletisim"
              className="duration-fast inline-flex items-center rounded-full bg-accent-solid px-6 py-3 text-sm text-text-on-accent transition-colors hover:bg-accent-solid-hover focus-visible:focus-ring"
            >
              {legalPage.contactCtaLabel}
            </Link>
          </p>

          {others.length > 0 && (
            <>
              <h2 className="mt-16 font-display text-xl tracking-display text-text-primary">
                {legalPage.otherDocumentsHeading}
              </h2>
              <ul className="mt-4 space-y-2">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/${other.slug}`}
                      className="text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:focus-ring"
                    >
                      {other.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

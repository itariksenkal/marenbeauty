import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import type { BlogCategory, Post } from '@/content-layer';
import type { PaginatedResult } from '@/lib/pagination';

import { CategoryPills } from './CategoryPills';
import { Pagination } from './Pagination';
import { PostGrid } from './PostGrid';

/**
 * One listing, shared by all four listing routes: `/blog`, `/blog/sayfa/[page]`,
 * `/blog/kategori/[slug]` and `/blog/kategori/[slug]/sayfa/[page]`.
 *
 * Every route is then a data lookup and this call, which is what makes twelve
 * posts and fifty posts the same amount of code. Adding a listing later — a tag
 * archive, say — is a route file, not a redesign.
 *
 * Copy comes from the caller because the four listings say different things:
 * the index describes the blog, an archive describes its category, and their
 * empty states are different sentences.
 */
export function PostListing({
  eyebrow,
  heading,
  lead,
  activeCategory,
  result,
  basePath,
  emptyMessage,
}: {
  eyebrow: string;
  heading: string;
  lead: string;
  activeCategory?: BlogCategory;
  result: PaginatedResult<Post>;
  basePath: string;
  emptyMessage: string;
}) {
  return (
    <>
      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-champagne-light)', c: 'var(--mb-nude)' }}
      >
        <Container>
          <p className="text-xs tracking-eyebrow text-text-accent uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-display font-display text-4xl tracking-display text-text-primary">
            {heading}
          </h1>
          <p className="mt-6 max-w-lead text-text-secondary">{lead}</p>

          <div className="mt-10">
            <CategoryPills active={activeCategory} />
          </div>
        </Container>
      </Section>

      <Section
        tone="transparent"
        rhythm="tight"
        aurora={{ b: 'var(--mb-nude)', c: 'var(--mb-rose-beige)' }}
      >
        <Container>
          <PostGrid posts={result.items} emptyMessage={emptyMessage} />
          {result.items.length > 0 ? (
            <div className="mt-16">
              <Pagination result={result} basePath={basePath} />
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}

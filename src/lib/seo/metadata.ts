import type { Metadata } from 'next';

import { absoluteUrl } from '@/config/seo';

/**
 * One place that builds a route's `Metadata`.
 *
 * Every route sets an EXPLICIT absolute canonical (docs/SEO.md §1). Nothing is
 * inferred: inference is how a preview deployment ends up telling Google that
 * `marenbeauty-git-abc123.vercel.app` is the canonical home page.
 *
 * `openGraph.url` is set from the same value, so the canonical and the share
 * card can never point at different pages.
 */
export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  /** Route path, e.g. `/hizmetler/hydrafacial`. */
  path: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type,
      ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

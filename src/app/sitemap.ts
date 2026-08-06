import type { MetadataRoute } from 'next';

import { POSTS_PER_PAGE } from '@/config/blog';
import { LEGAL_SLUGS } from '@/config/legal';
import { absoluteUrl } from '@/config/seo';
import {
  BLOG_CATEGORIES,
  contentLastModified,
  getAllLegalDocuments,
  getAllPosts,
  getAllServices,
  getEditorialPage,
} from '@/content-layer';
import { pagesAfterFirst } from '@/lib/pagination';

/**
 * `sitemap.xml`, generated from the content layer.
 *
 * Three rules, all from docs/SEO.md §1:
 *
 *   - **Drafts are absent.** `getAllPosts()` excludes them by default, and a
 *     draft is not generated as a page either — there is nothing to `noindex`
 *     because there is nothing there.
 *   - **`lastModified` is real.** Posts use `updatedAt ?? publishedAt`.
 *     Everything with a source file uses that file's mtime. Composed pages —
 *     the home page, the service index, `/sss` — use the newest content
 *     timestamp, because "when did this page change" has no single file to
 *     point at, and a build timestamp would move on every deploy while telling
 *     a crawler nothing.
 *   - **No `changefreq`, no `priority`.** Google ignores both, and inventing a
 *     weekly cadence for a site that changes monthly is one more untrue field.
 *
 * NO FILESYSTEM ACCESS HAPPENS HERE. Every date comes from the content layer,
 * which opens these files anyway. A `statSync` on a computed path inside a
 * route makes Turbopack trace the whole project into the server bundle —
 * including the 5 MB of photography under `public/`. That was a real warning on
 * the first version of this file, not a hypothetical.
 *
 * `…/sayfa/1` is never listed, because it is never generated: page 1 of a
 * listing lives at the bare path (`src/lib/pagination.ts`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const services = getAllServices();
  const posts = getAllPosts();
  const legal = getAllLegalDocuments();
  const about = getEditorialPage('hakkimizda');
  const composed = contentLastModified();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: composed },
    { url: absoluteUrl('/hizmetler'), lastModified: composed },
    { url: absoluteUrl('/hakkimizda'), lastModified: about.modifiedAt },
    { url: absoluteUrl('/galeri'), lastModified: composed },
    { url: absoluteUrl('/sss'), lastModified: composed },
    { url: absoluteUrl('/iletisim'), lastModified: composed },
    { url: absoluteUrl('/blog'), lastModified: composed },
  ];

  for (const service of services) {
    entries.push({
      url: absoluteUrl(`/hizmetler/${service.slug}`),
      lastModified: service.modifiedAt,
    });
  }

  for (const post of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
    });
  }

  for (const category of BLOG_CATEGORIES) {
    entries.push({
      url: absoluteUrl(`/blog/kategori/${category}`),
      lastModified: composed,
    });
  }

  // Blog pages 2+, and category archive pages 2+. Page 1 is already listed
  // above at its bare path, and `pagesAfterFirst` starts at 2 by construction.
  for (const page of pagesAfterFirst(posts.length, POSTS_PER_PAGE)) {
    entries.push({
      url: absoluteUrl(`/blog/sayfa/${page}`),
      lastModified: composed,
    });
  }
  for (const category of BLOG_CATEGORIES) {
    const count = posts.filter((post) => post.category === category).length;
    for (const page of pagesAfterFirst(count, POSTS_PER_PAGE)) {
      entries.push({
        url: absoluteUrl(`/blog/kategori/${category}/sayfa/${page}`),
        lastModified: composed,
      });
    }
  }

  for (const slug of LEGAL_SLUGS) {
    const document = legal.find((entry) => entry.slug === slug);
    entries.push({
      url: absoluteUrl(`/${slug}`),
      lastModified: document?.modifiedAt ?? composed,
    });
  }

  // `/lisanslar` is deliberately absent: it is `noindex`, and a sitemap entry
  // for a page we ask not to be indexed is a contradiction a crawler reports.

  return entries;
}

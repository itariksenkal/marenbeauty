import { blog } from '@/config/blog';
import { absoluteUrl, routeSeo } from '@/config/seo';
import { site } from '@/config/site';
import { getAllPosts } from '@/content-layer';

/**
 * `rss.xml` — the blog feed.
 *
 * PRERENDERED, not dynamic. A feed is content, and content on this site is
 * built once and served as a file (`docs/ARCHITECTURE.md` §1). `force-static`
 * keeps it that way: without it a route handler is dynamic by default and this
 * would become a second server-rendered surface for no reason.
 *
 * Drafts are absent, because `getAllPosts()` excludes them — the same
 * exclusion the sitemap and `generateStaticParams` use, from one place.
 *
 * NO FULL CONTENT. The description is the authored `summary`, not the body:
 * a feed reader showing the whole article is a second copy of every page,
 * which is both a duplicate-content problem and a way for the post to be read
 * without the disclaimer that the template renders around it.
 */
export const dynamic = 'force-static';

/** XML text nodes, escaped. Titles carry apostrophes and ampersands. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET(): Response {
  const posts = getAllPosts();
  const updated = posts[0]?.updatedAt ?? posts[0]?.publishedAt;

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      const date = new Date(
        `${post.updatedAt ?? post.publishedAt}T00:00:00Z`,
      ).toUTCString();

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${site.name} — ${routeSeo.blog.title}`)}</title>
    <link>${absoluteUrl('/blog')}</link>
    <description>${escapeXml(blog.index.lead)}</description>
    <language>${site.locale}</language>
    <atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml" />${
      updated
        ? `\n    <lastBuildDate>${new Date(`${updated}T00:00:00Z`).toUTCString()}</lastBuildDate>`
        : ''
    }
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

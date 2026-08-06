import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import manifest, { BACKGROUND_COLOR, THEME_COLOR } from '@/app/manifest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { blogCategories } from '@/config/blog';
import { generalFaq } from '@/config/faq';
import { getImage } from '@/config/images';
import { LEGAL_SLUGS } from '@/config/legal';
import { absoluteUrl, routeSeo, TITLE_SUFFIX } from '@/config/seo';
import { serviceGroupLabel } from '@/config/services';
import { site } from '@/config/site';
import {
  blogPostingNode,
  buildGraph,
  faqPageNode,
  SCHEMA_IDS,
  serviceNode,
  standardGraph,
  type SchemaNode,
} from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import { getAllPosts, getAllPostSlugs, getAllServices } from '@/content-layer';

const ROOT = process.cwd();
const ALLOWANCES = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'guard.allow.json'), 'utf8'),
).allow;

const services = getAllServices();
const posts = getAllPosts();

/**
 * Source with comments removed.
 *
 * Every file here DOCUMENTS the rule it follows, so asserting against raw text
 * matches the explanation rather than the code — the trap this repository has
 * already hit twice.
 */
const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const guardErrors = (text: string) =>
  scanText(text, {
    file: 'fixture',
    ext: '.html',
    allowances: ALLOWANCES,
  }).filter((v: { tier: string }) => v.tier === 'error');

/* ── Titles and descriptions ──────────────────────────────────────────────── */

describe('titles and descriptions', () => {
  it('keeps every route title within 60 characters INCLUDING the suffix', () => {
    // The suffix is what pushes a title over the edge, and it is invisible in
    // the config — which is exactly why it is counted here.
    for (const [key, entry] of Object.entries(routeSeo)) {
      const rendered =
        key === 'home' ? entry.title : `${entry.title}${TITLE_SUFFIX}`;
      expect(rendered.length, `${key}: "${rendered}"`).toBeLessThanOrEqual(60);
    }
  });

  it('writes route descriptions at 150–165 characters', () => {
    for (const [key, entry] of Object.entries(routeSeo)) {
      expect(entry.description.length, key).toBeGreaterThanOrEqual(150);
      expect(entry.description.length, key).toBeLessThanOrEqual(165);
    }
  });

  it('keeps every service and post title within 60 with the suffix', () => {
    for (const service of services) {
      const title = `${service.seo.title ?? service.title}${TITLE_SUFFIX}`;
      expect(title.length, service.slug).toBeLessThanOrEqual(60);
    }
    for (const post of posts) {
      const title = `${post.seo.title ?? post.title}${TITLE_SUFFIX}`;
      expect(title.length, post.slug).toBeLessThanOrEqual(60);
    }
  });

  it('never truncates a body to make a description', () => {
    // `summary` is an authored, required field precisely so this never happens.
    for (const service of services) {
      expect(service.summary.endsWith('…'), service.slug).toBe(false);
      expect(service.body.startsWith(service.summary), service.slug).toBe(
        false,
      );
    }
  });

  it('passes the content guard on every title and description', () => {
    const all = [
      ...Object.values(routeSeo).flatMap((e) => [e.title, e.description]),
      ...services.map((s) => `${s.title} ${s.summary}`),
      ...posts.map((p) => `${p.title} ${p.summary}`),
    ].join('\n');
    expect(guardErrors(all)).toEqual([]);
  });
});

/* ── Canonicals ───────────────────────────────────────────────────────────── */

describe('canonicals', () => {
  it('are absolute and point at the apex, never at a preview origin', () => {
    expect(absoluteUrl('/')).toBe('https://marenbeauty.com');
    expect(absoluteUrl('/hizmetler')).toBe('https://marenbeauty.com/hizmetler');
    expect(site.url.startsWith('https://www.')).toBe(false);
  });

  it('are set explicitly by every page, never inferred', () => {
    const meta = pageMetadata({
      title: 'x',
      description: 'y',
      path: '/sss',
    });
    expect(meta.alternates?.canonical).toBe('https://marenbeauty.com/sss');
    // The share card and the canonical can never disagree.
    expect(meta.openGraph?.url).toBe(meta.alternates?.canonical);
  });

  it('appear on every route file that renders a page', () => {
    const routes = [
      'src/app/page.tsx',
      'src/app/hizmetler/page.tsx',
      'src/app/hizmetler/[slug]/page.tsx',
      'src/app/hakkimizda/page.tsx',
      'src/app/galeri/page.tsx',
      'src/app/sss/page.tsx',
      'src/app/iletisim/page.tsx',
      'src/app/blog/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/app/kvkk/page.tsx',
      'src/app/cerez-politikasi/page.tsx',
      'src/app/kullanim-kosullari/page.tsx',
      'src/app/lisanslar/page.tsx',
    ];
    for (const route of routes) {
      const source = readFileSync(join(ROOT, route), 'utf8');
      expect(
        /pageMetadata\(|alternates:\s*\{\s*canonical/.test(source),
        route,
      ).toBe(true);
    }
  });
});

/* ── Structured data: the two hard rules ──────────────────────────────────── */

/** Every graph the site can produce, in one place. */
function allGraphs(): Record<string, unknown>[] {
  const graphs: Record<string, unknown>[] = [
    standardGraph({
      path: '/',
      name: routeSeo.home.title,
      description: routeSeo.home.description,
      services,
    }),
    standardGraph({
      path: '/sss',
      name: routeSeo.faq.title,
      description: routeSeo.faq.description,
      trail: [{ name: routeSeo.faq.title, path: '/sss' }],
      services,
      extra: [faqPageNode('/sss', generalFaq)],
    }),
  ];

  for (const service of services) {
    graphs.push(
      standardGraph({
        path: `/hizmetler/${service.slug}`,
        name: service.title,
        description: service.summary,
        type: 'ItemPage',
        trail: [{ name: service.title, path: `/hizmetler/${service.slug}` }],
        services,
        extra: [
          serviceNode(service),
          faqPageNode(`/hizmetler/${service.slug}`, service.faq),
        ],
      }),
    );
  }

  for (const post of posts) {
    graphs.push(
      standardGraph({
        path: `/blog/${post.slug}`,
        name: post.title,
        description: post.summary,
        type: 'ItemPage',
        trail: [{ name: post.title, path: `/blog/${post.slug}` }],
        services,
        extra: [
          blogPostingNode(post, absoluteUrl(getImage(post.heroImageId).src)),
          faqPageNode(`/blog/${post.slug}`, post.faq),
        ],
      }),
    );
  }

  return graphs;
}

const GRAPHS = allGraphs();
const ALL_JSON = JSON.stringify(GRAPHS);

describe('no medical typing anywhere', () => {
  it.each([
    'MedicalBusiness',
    'MedicalClinic',
    'MedicalProcedure',
    'MedicalTherapy',
    'MedicalOrganization',
    'Physician',
    'Hospital',
    'MedicalSpecialty',
  ])('never emits %s', (type) => {
    expect(ALL_JSON).not.toContain(type);
  });

  it('types the business as BeautySalon', () => {
    expect(ALL_JSON).toContain('"BeautySalon"');
  });
});

describe('pre-launch omissions — docs/SEO.md §2.5', () => {
  it.each([
    'openingHoursSpecification',
    'aggregateRating',
    'priceRange',
    'PriceSpecification',
    'geo',
    'hasMap',
    'streetAddress',
    'postalCode',
    'foundingDate',
    'numberOfEmployees',
  ])('omits %s while the centre has not opened', (field) => {
    expect(site.isPreLaunch).toBe(true);
    expect(ALL_JSON).not.toContain(`"${field}"`);
  });

  it('emits no review markup, because there are no reviews', () => {
    expect(ALL_JSON).not.toContain('"review"');
    expect(ALL_JSON).not.toContain('"Review"');
  });

  it('publishes no price in the offer catalogue', () => {
    expect(ALL_JSON).toContain('OfferCatalog');
    expect(ALL_JSON).not.toContain('"price"');
    expect(ALL_JSON).not.toContain('"priceCurrency"');
  });
});

describe('BlogPosting', () => {
  it('attributes every post to the Organization, never a Person', () => {
    for (const post of posts) {
      const node = blogPostingNode(post, 'https://example.com/x.webp');
      expect(node.author).toEqual({ '@id': SCHEMA_IDS.organization });
      expect(JSON.stringify(node)).not.toContain('"Person"');
      expect(JSON.stringify(node)).not.toContain('PENDING');
    }
  });

  it('keeps every headline within the 110-character limit', () => {
    for (const post of posts) {
      const node = blogPostingNode(post, 'https://example.com/x.webp');
      expect(String(node.headline).length, post.slug).toBeLessThanOrEqual(110);
    }
  });
});

describe('graph integrity', () => {
  it('declares each @id exactly once per page', () => {
    for (const graph of GRAPHS) {
      const nodes = (graph['@graph'] as SchemaNode[]).filter(
        (node) => Object.keys(node).length > 1,
      );
      const ids = nodes
        .map((node) => node['@id'])
        .filter((id): id is string => typeof id === 'string');
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('resolves every @id reference to a node declared on the same page', () => {
    for (const graph of GRAPHS) {
      const nodes = graph['@graph'] as SchemaNode[];
      const declared = new Set(
        nodes
          .filter((node) => Object.keys(node).length > 1)
          .map((node) => node['@id'])
          .filter((id): id is string => typeof id === 'string'),
      );

      const references: string[] = [];
      const walk = (value: unknown) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (value && typeof value === 'object') {
          const record = value as Record<string, unknown>;
          const keys = Object.keys(record);
          if (keys.length === 1 && keys[0] === '@id') {
            references.push(String(record['@id']));
            return;
          }
          Object.values(record).forEach(walk);
        }
      };
      nodes.forEach(walk);

      for (const reference of references) {
        expect(declared.has(reference), `dangling @id ${reference}`).toBe(true);
      }
    }
  });

  it('deduplicates a node included twice', () => {
    const node = { '@type': 'Thing', '@id': 'https://x/#a', name: 'a' };
    const graph = buildGraph([node, node]);
    expect((graph['@graph'] as unknown[]).length).toBe(1);
  });

  it('emits no {{token}} into any graph', () => {
    expect(ALL_JSON).not.toContain('{{');
  });

  it('passes the content guard over the whole serialised graph', () => {
    // The guard scans build output, where this JSON ends up. This catches a
    // banned term at the point it enters the markup rather than after.
    expect(guardErrors(ALL_JSON)).toEqual([]);
  });
});

describe('FAQPage', () => {
  it('is emitted for every service that has questions', () => {
    for (const service of services) {
      const node = faqPageNode(`/hizmetler/${service.slug}`, service.faq);
      if (service.faq.length === 0) {
        expect(node, service.slug).toBeNull();
      } else {
        expect(node?.['@type'], service.slug).toBe('FAQPage');
      }
    }
  });

  it('never repeats a general question on a service page', () => {
    const general = new Set(generalFaq.map((item) => item.question));
    for (const service of services) {
      for (const item of service.faq) {
        expect(general.has(item.question), item.question).toBe(false);
      }
    }
  });
});

describe('Service nodes', () => {
  it('name a cosmetic serviceType, never a medical one', () => {
    for (const service of services) {
      const node = serviceNode(service);
      const type = String(node.serviceType);
      expect(guardErrors(type), service.slug).toEqual([]);
      expect(type.length).toBeGreaterThan(2);
    }
  });

  it('reference the business as provider by @id', () => {
    for (const service of services) {
      expect(serviceNode(service).provider).toEqual({
        '@id': SCHEMA_IDS.business,
      });
    }
  });
});

/* ── sitemap.xml ──────────────────────────────────────────────────────────── */

describe('sitemap', () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it('lists every published route and nothing else', () => {
    expect(urls).toContain(absoluteUrl('/'));
    expect(urls).toContain(absoluteUrl('/hizmetler'));
    expect(urls).toContain(absoluteUrl('/hakkimizda'));
    expect(urls).toContain(absoluteUrl('/galeri'));
    expect(urls).toContain(absoluteUrl('/sss'));
    expect(urls).toContain(absoluteUrl('/iletisim'));
    expect(urls).toContain(absoluteUrl('/blog'));

    for (const service of services) {
      expect(urls).toContain(absoluteUrl(`/hizmetler/${service.slug}`));
    }
    for (const post of posts) {
      expect(urls).toContain(absoluteUrl(`/blog/${post.slug}`));
    }
    for (const category of blogCategories) {
      expect(urls).toContain(absoluteUrl(`/blog/kategori/${category.id}`));
    }
    for (const slug of LEGAL_SLUGS) {
      expect(urls).toContain(absoluteUrl(`/${slug}`));
    }
  });

  it('excludes drafts', () => {
    const published = new Set(getAllPostSlugs());
    const allWithDrafts = getAllPostSlugs({ includeDrafts: true });
    for (const slug of allWithDrafts) {
      if (published.has(slug)) continue;
      expect(urls).not.toContain(absoluteUrl(`/blog/${slug}`));
    }
  });

  it('excludes the noindex licences page', () => {
    expect(urls).not.toContain(absoluteUrl('/lisanslar'));
  });

  it('never lists a …/sayfa/1', () => {
    for (const url of urls) {
      expect(url).not.toMatch(/\/sayfa\/1$/);
    }
  });

  it('lists no URL twice', () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('gives every entry a real lastModified, and no changefreq or priority', () => {
    for (const entry of entries) {
      expect(entry.lastModified, entry.url).toBeInstanceOf(Date);
      expect(
        Number.isNaN((entry.lastModified as Date).getTime()),
        entry.url,
      ).toBe(false);
      expect(entry).not.toHaveProperty('changeFrequency');
      expect(entry).not.toHaveProperty('priority');
    }
  });

  it('dates posts from their own frontmatter, not from a build clock', () => {
    for (const post of posts) {
      const entry = entries.find(
        (e) => e.url === absoluteUrl(`/blog/${post.slug}`),
      );
      expect((entry?.lastModified as Date).toISOString().slice(0, 10)).toBe(
        post.updatedAt ?? post.publishedAt,
      );
    }
  });

  it('does no filesystem access of its own', () => {
    // A statSync on a computed path inside a route makes Turbopack trace the
    // whole project — including 5 MB of photography — into the server bundle.
    // Comments stripped: the file DOCUMENTS why it does no filesystem
    // access, and matching its own explanation is the trap this repository
    // has hit before (tests/unit/home-sections.test.ts uses the same guard).
    const source = stripComments(
      readFileSync(join(ROOT, 'src/app/sitemap.ts'), 'utf8'),
    );
    expect(source).not.toContain('statSync');
    expect(source).not.toContain('node:fs');
  });
});

/* ── robots.txt and the manifest ──────────────────────────────────────────── */

describe('robots', () => {
  const config = robots();

  it('allows the site and blocks only the API', () => {
    const rule = Array.isArray(config.rules) ? config.rules[0]! : config.rules;
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toEqual(['/api/']);
  });

  it('points at the sitemap and the apex host', () => {
    expect(config.sitemap).toBe(absoluteUrl('/sitemap.xml'));
    expect(config.host).toBe(absoluteUrl('/'));
  });

  it('does not block the noindex page, which would leave it unread', () => {
    expect(JSON.stringify(config)).not.toContain('/lisanslar');
  });
});

describe('manifest', () => {
  const config = manifest();

  it('matches the design tokens it duplicates', () => {
    // JSON cannot read a CSS custom property, so these two hexes are the only
    // ones outside theme.css. This is what stops them drifting.
    const theme = readFileSync(join(ROOT, 'src/styles/theme.css'), 'utf8');
    expect(theme).toContain(`--mb-cream: ${THEME_COLOR}`);
    expect(theme).toContain(`--mb-ivory: ${BACKGROUND_COLOR}`);
  });

  it('claims to be a website, not an app', () => {
    expect(config.display).toBe('browser');
    expect(config.lang).toBe('tr');
  });

  it('references an icon that exists', () => {
    const icon = config.icons?.[0];
    expect(icon?.src).toBe('/icon.svg');
    expect(() =>
      readFileSync(join(ROOT, 'public', 'icon.svg'), 'utf8'),
    ).not.toThrow();
  });

  it('uses palette primitives in the icon, not invented colours', () => {
    const svg = readFileSync(join(ROOT, 'public', 'icon.svg'), 'utf8');
    const theme = readFileSync(join(ROOT, 'src/styles/theme.css'), 'utf8');
    for (const hex of svg.match(/#[0-9a-f]{6}/gi) ?? []) {
      expect(theme.toLowerCase(), hex).toContain(hex.toLowerCase());
    }
  });
});

/* ── Open Graph ───────────────────────────────────────────────────────────── */

describe('open graph cards', () => {
  it('renders no photography', () => {
    const source = readFileSync(join(ROOT, 'src/lib/seo/og.tsx'), 'utf8');
    expect(source).not.toMatch(/\/images\//);
    expect(source).not.toContain('<img');
  });

  it('passes the content guard on every string it can print', () => {
    const strings = [
      ...services.map(
        (s) => `${s.eyebrow ?? serviceGroupLabel(s.group)} ${s.title}`,
      ),
      ...posts.map((p) => `${p.seo.title ?? p.title}`),
      ...blogCategories.map((c) => c.label),
      routeSeo.home.title,
    ].join('\n');
    expect(guardErrors(strings)).toEqual([]);
  });

  it('uses only palette colours', () => {
    const source = readFileSync(join(ROOT, 'src/lib/seo/og.tsx'), 'utf8');
    const theme = readFileSync(join(ROOT, 'src/styles/theme.css'), 'utf8');
    for (const hex of source.match(/#[0-9a-f]{6}/gi) ?? []) {
      expect(theme.toLowerCase(), hex).toContain(hex.toLowerCase());
    }
  });

  it('reads TTF, because satori cannot read the woff2 the site serves', () => {
    const source = readFileSync(join(ROOT, 'src/lib/seo/og.tsx'), 'utf8');
    expect(source).toContain('fraunces-og.ttf');
    expect(source).not.toContain('.woff2');
    // And those TTFs are held to the same Turkish glyph gate — see
    // scripts/verify-fonts.mjs, which fails the build if one drops a glyph.
    const fonts = readFileSync(join(ROOT, 'scripts/verify-fonts.mjs'), 'utf8');
    expect(fonts).toContain('src/fonts/og/fraunces-og.ttf');
    expect(fonts).toContain('src/fonts/og/manrope-og.ttf');
  });
});

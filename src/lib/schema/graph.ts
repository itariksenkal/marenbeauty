import { channelHref, contact, SOCIAL_CHANNELS } from '@/config/contact';
import { absoluteUrl } from '@/config/seo';
import { openingHours, site } from '@/config/site';
import { testimonials } from '@/config/testimonials';
import type { Post, Service } from '@/content-layer';

/**
 * JSON-LD builders — docs/SEO.md §2.
 *
 * TWO CONSTRAINTS SHAPE EVERY FUNCTION HERE, and both are enforced by test:
 *
 *   1. **No medical typing.** `MedicalBusiness`, `MedicalClinic`,
 *      `MedicalProcedure`, `MedicalTherapy` and `Physician` may not appear.
 *      Using one would claim a status the business does not hold — the same
 *      rule the copy guard enforces in prose, applied to markup.
 *   2. **Nothing is emitted that is not true today.** While
 *      `site.isPreLaunch`, there is no `openingHoursSpecification`, no
 *      `aggregateRating`, no `review`, no `priceRange`, no `geo`, no
 *      `foundingDate`. A wrong field is worse than an absent one: it is
 *      inaccurate structured data about a real business, and review markup for
 *      reviews that do not exist violates Google's policy outright.
 *
 * Entities are declared ONCE with stable `@id`s and referenced by `@id`
 * elsewhere, so the organisation is not re-serialised on every page.
 */

export const SCHEMA_IDS = {
  business: `${site.url}/#business`,
  website: `${site.url}/#website`,
  organization: `${site.url}/#organization`,
} as const;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type SchemaNode = { readonly [key: string]: JsonValue };

const ref = (id: string) => ({ '@id': id });

/** Drop every key whose value is null/undefined/empty, recursively. */
function compact(node: Record<string, unknown>): SchemaNode {
  const out: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(node)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    out[key] = value as JsonValue;
  }
  return out;
}

/* ── The three site-wide entities ─────────────────────────────────────────── */

/**
 * `sameAs` appears the moment a social profile is configured, and disappears
 * again if one is removed. Nothing here is written by hand.
 */
function sameAs(): readonly string[] {
  return SOCIAL_CHANNELS.map((key) => channelHref(key)).filter(
    (href): href is string => href !== null,
  );
}

export function organizationNode(): SchemaNode {
  return compact({
    '@type': 'Organization',
    '@id': SCHEMA_IDS.organization,
    name: site.name,
    url: site.url,
    /*
     * The BRAND name, which is known — never the legal entity, which is not
     * (docs/OPEN-QUESTIONS.md B2). `{{LEGAL_ENTITY}}` appears only in legal
     * page copy and never in markup.
     */
    sameAs: sameAs(),
  });
}

export function websiteNode(): SchemaNode {
  return compact({
    '@type': 'WebSite',
    '@id': SCHEMA_IDS.website,
    url: site.url,
    name: site.name,
    inLanguage: site.locale,
    publisher: ref(SCHEMA_IDS.organization),
  });
}

/**
 * `BeautySalon` — a subtype of `HealthAndBeautyBusiness` → `LocalBusiness`.
 * The correct type for a güzellik merkezi, and it carries no medical
 * implication.
 */
export function businessNode(services: readonly Service[]): SchemaNode {
  const telephone = contact.phone?.value ?? null;
  const email = contact.email?.value ?? null;

  return compact({
    '@type': 'BeautySalon',
    '@id': SCHEMA_IDS.business,
    name: site.name,
    url: site.url,
    inLanguage: site.locale,
    address: compact({
      '@type': 'PostalAddress',
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
      // streetAddress and postalCode are ABSENT, not empty (C1).
    }),
    areaServed: { '@type': 'City', name: site.address.region },
    telephone,
    email,
    sameAs: sameAs(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: site.name,
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        // Name and URL only. No price, no PriceSpecification — the site
        // publishes no prices anywhere, not even ranges.
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          url: absoluteUrl(`/hizmetler/${service.slug}`),
        },
      })),
    },
    /*
     * While pre-launch, ALL of the following are omitted rather than guessed:
     * openingHoursSpecification, aggregateRating, review, priceRange, geo,
     * hasMap, foundingDate, numberOfEmployees. `docs/SEO.md` §2.5 lists them
     * and a unit test asserts each is absent.
     *
     * The hours DO exist in config and render on the page, labelled as
     * provisional (C12). A line that says "planlanan" is a different kind of
     * statement from telling a search engine the business is open then.
     */
    ...(site.isPreLaunch
      ? {}
      : {
          openingHoursSpecification: openingHoursNodes(),
          ...(testimonials.length > 0 ? { review: reviewNodes() } : {}),
        }),
  });
}

/**
 * Only ever reached once `isPreLaunch` is false.
 *
 * The hours exist in config today and render on the page as provisional; this
 * is the one place they must NOT appear until they are confirmed, because
 * `openingHoursSpecification` is a statement to a search engine that the
 * business is open at those times.
 */
function openingHoursNodes(): readonly SchemaNode[] {
  return openingHours
    .filter((entry) => entry.opens && entry.closes)
    .map((entry) =>
      compact({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${entry.day}`,
        opens: entry.opens,
        closes: entry.closes,
      }),
    );
}

/** Only ever called once real, consented testimonials exist. */
function reviewNodes(): readonly SchemaNode[] {
  return testimonials.map((entry) =>
    compact({
      '@type': 'Review',
      reviewBody: entry.quote,
      datePublished: entry.givenAt,
      author: { '@type': 'Person', name: entry.author },
    }),
  );
}

/* ── Page-level nodes ─────────────────────────────────────────────────────── */

export type Breadcrumb = { readonly name: string; readonly path: string };

export function breadcrumbNode(
  path: string,
  trail: readonly Breadcrumb[],
): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function webPageNode({
  path,
  name,
  description,
  type = 'WebPage',
  hasBreadcrumb = false,
}: {
  path: string;
  name: string;
  description: string;
  type?:
    'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'ItemPage';
  hasBreadcrumb?: boolean;
}): SchemaNode {
  const url = absoluteUrl(path);
  return compact({
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: site.locale,
    isPartOf: ref(SCHEMA_IDS.website),
    about: ref(SCHEMA_IDS.business),
    ...(hasBreadcrumb ? { breadcrumb: ref(`${url}#breadcrumb`) } : {}),
  });
}

export function faqPageNode(
  path: string,
  items: readonly { readonly question: string; readonly answer: string }[],
): SchemaNode | null {
  if (items.length === 0) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function serviceNode(service: Service): SchemaNode {
  return compact({
    '@type': 'Service',
    '@id': `${absoluteUrl(`/hizmetler/${service.slug}`)}#service`,
    name: service.title,
    // Deliberately a cosmetic category, never a medical one.
    serviceType: service.eyebrow ?? 'Güzellik uygulaması',
    description: service.summary,
    provider: ref(SCHEMA_IDS.business),
    areaServed: { '@type': 'City', name: site.address.region },
    url: absoluteUrl(`/hizmetler/${service.slug}`),
    inLanguage: site.locale,
    // No `offers`, no price. See businessNode.
  });
}

export function blogPostingNode(post: Post, imageUrl: string): SchemaNode {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return compact({
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.title.slice(0, 110),
    description: post.summary,
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    /*
     * The ORGANIZATION, never a fabricated Person. `author` is the literal
     * 'PENDING' in frontmatter, and inventing a byline in markup would be the
     * same lie as inventing one on the page — only harder to notice.
     */
    author: ref(SCHEMA_IDS.organization),
    publisher: ref(SCHEMA_IDS.organization),
    inLanguage: site.locale,
    isPartOf: ref(SCHEMA_IDS.website),
    image: imageUrl,
    keywords: post.tags,
  });
}

export function blogNode(path: string): SchemaNode {
  const url = absoluteUrl(path);
  return {
    '@type': 'Blog',
    '@id': `${url}#blog`,
    url,
    name: `${site.name} Blog`,
    inLanguage: site.locale,
    publisher: ref(SCHEMA_IDS.organization),
  };
}

/* ── Assembly ─────────────────────────────────────────────────────────────── */

/**
 * One `@graph` per page. Nodes are deduplicated by `@id`, so a caller can
 * include the business entity without checking whether something else already
 * did.
 */
export function buildGraph(
  nodes: readonly (SchemaNode | null)[],
): Record<string, unknown> {
  const seen = new Set<string>();
  const graph: SchemaNode[] = [];

  for (const node of nodes) {
    if (!node) continue;
    const id = typeof node['@id'] === 'string' ? node['@id'] : null;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    graph.push(node);
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** The three entities every page references. */
export function siteEntities(services: readonly Service[]): SchemaNode[] {
  return [businessNode(services), websiteNode(), organizationNode()];
}

/**
 * The graph almost every page wants: the three site entities, this page, and
 * its breadcrumb trail — plus whatever else the route adds.
 *
 * Callers pass `extra` rather than assembling the list themselves, so no page
 * can forget the organisation reference and no page can emit it twice.
 */
export function standardGraph({
  path,
  name,
  description,
  type,
  trail,
  services,
  extra = [],
}: {
  path: string;
  name: string;
  description: string;
  type?: Parameters<typeof webPageNode>[0]['type'];
  /** Home is not included: the crumb list always starts there implicitly. */
  trail?: readonly Breadcrumb[];
  services: readonly Service[];
  extra?: readonly (SchemaNode | null)[];
}): Record<string, unknown> {
  const crumbs = trail
    ? [{ name: 'Ana sayfa', path: '/' }, ...trail]
    : undefined;

  return buildGraph([
    ...siteEntities(services),
    webPageNode({
      path,
      name,
      description,
      type,
      hasBreadcrumb: Boolean(crumbs),
    }),
    crumbs ? breadcrumbNode(path, crumbs) : null,
    ...extra,
  ]);
}

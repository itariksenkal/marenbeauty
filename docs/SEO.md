# SEO — Maren Beauty

Metadata strategy, structured data per route, and the local SEO plan.

Two constraints shape everything here:

1. **Maren Beauty is a beauty centre, not a medical institution.** No
   `MedicalBusiness`, `MedicalClinic`, `MedicalProcedure`, `MedicalTherapy` or
   `Physician` type may appear in any markup. Using them would claim a status
   the business does not hold.
2. **The business has not opened.** No hours, no reviews, no ratings, no Google
   Business Profile. Structured data must describe what is true today and
   nothing more.

---

## 1. Metadata strategy

Next.js Metadata API. Every route exports `metadata` or `generateMetadata` —
none inherits by accident.

### Root defaults — `app/layout.tsx`

```ts
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Maren Beauty — Konya Selçuklu Güzellik Merkezi',
    template: '%s | Maren Beauty',
  },
  description: /* from config, 150–160 chars */,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'Maren Beauty' },
  robots: { index: true, follow: true,
            googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false, address: false, email: false },
};
```

`<html lang="tr">`. `og:locale` is `tr_TR`. **No `hreflang`** — the site is
Turkish only and there is no alternate language to declare.

`formatDetection.telephone: false` prevents iOS auto-linking numbers in copy
into `tel:` links we did not author — which would otherwise defeat the
"never emit an empty or unintended `tel:`" rule (`CLAUDE.md` §7).

### Title and description formulas

| Route                   | Title                                            | Description                                    |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `/`                     | `Maren Beauty — Konya Selçuklu Güzellik Merkezi` | Positioning + location + pre-launch status.    |
| `/hizmetler`            | `Hizmetler`                                      | The 20 services, grouped, one sentence.        |
| `/hizmetler/[slug]`     | `{title}`                                        | `summary` frontmatter verbatim (60–165 chars). |
| `/hakkimizda`           | `Hakkımızda`                                     | The approach, in a sentence.                   |
| `/blog`                 | `Blog`                                           | What the blog covers.                          |
| `/blog/[slug]`          | `seo.title ?? title`                             | `seo.description ?? summary`.                  |
| `/blog/kategori/[slug]` | `{category} yazıları`                            | Category description from config.              |
| `/blog/sayfa/[n]`       | `Blog — Sayfa {n}`                               | Same base description.                         |
| `/sss`                  | `Sık Sorulan Sorular`                            | —                                              |
| `/iletisim`             | `İletişim`                                       | Location + how to reach us.                    |
| Legal                   | Page name                                        | Short, factual.                                |

Rules:

- Title ≤ **60 characters** including the template suffix. Enforced by the
  Zod schema on `seo.title`.
- Description **150–165 characters**, written for a human, never keyword-stuffed.
- Never auto-generate a description by truncating the body. `summary` is
  authored for this purpose and is a required field.
- No brand suffix on the home page title — the template is not applied there.

### Canonicals

- Every page sets an explicit absolute canonical. No relying on inference.
- **`/blog/sayfa/1` does not exist**; `/blog` is page 1. Pages 2+ are
  self-canonical and indexable.
- Category archives are self-canonical.
- Trailing slashes off. **Canonical host is the apex,
  `https://marenbeauty.com`** (decided — `docs/OPEN-QUESTIONS.md` C2);
  `www` 301s to it. Enforced in `next.config.ts` **and** in the Vercel domain
  settings — the two must agree or it is a redirect loop.

### Open Graph images

| Scope   | Source                                                        |
| ------- | ------------------------------------------------------------- |
| Default | `app/opengraph-image.tsx` — wordmark on the cream/nude wash   |
| Service | `app/hizmetler/[slug]/opengraph-image.tsx` — service title    |
| Post    | `app/blog/[slug]/opengraph-image.tsx` — post title + category |

Generated at build with `next/og`, 1200×630, using the design tokens and the
self-hosted display font. **No photography in OG images** until real
photography exists — a stock image in a share card reads as a stock business.

OG image text goes through the same content guard: no banned lexicon, no
`{{tokens}}`.

### Robots and sitemap

- `app/robots.ts`: allow all, disallow `/api/`, point at the sitemap.
- `app/sitemap.ts`: generated from the content layer. `lastModified` comes from
  `updatedAt ?? publishedAt` for posts and from file mtime for static routes.
- `draft: true` posts are excluded from the sitemap **and** from
  `generateStaticParams` — they do not exist in production, so there is nothing
  to `noindex`.
- No `changefreq`, no `priority`. Google ignores them.

---

## 2. Structured data

One JSON-LD `<script>` per page, containing a single `@graph`. Entities are
declared once with stable `@id`s and referenced elsewhere — the organisation is
not re-serialised on every page.

Builders live in `src/lib/schema/`, are typed, and are unit-tested against the
pre-launch rules in §2.5.

### 2.1 Stable identifiers

```
https://marenbeauty.com/#business      → BeautySalon (the LocalBusiness)
https://marenbeauty.com/#website       → WebSite
https://marenbeauty.com/#organization  → Organization
<page-url>#webpage                     → WebPage / subtype
<page-url>#breadcrumb                  → BreadcrumbList
```

### 2.2 Per route

| Route                   | Types in `@graph`                                                           |
| ----------------------- | --------------------------------------------------------------------------- |
| `/`                     | `BeautySalon`, `WebSite`, `Organization`, `WebPage`                         |
| `/hizmetler`            | `CollectionPage`, `BreadcrumbList`                                          |
| `/hizmetler/[slug]`     | `Service`, `WebPage`, `BreadcrumbList`, `FAQPage` (when `faq` is non-empty) |
| `/hakkimizda`           | `AboutPage`, `BreadcrumbList`                                               |
| `/blog`                 | `Blog`, `CollectionPage`, `BreadcrumbList`                                  |
| `/blog/[slug]`          | `BlogPosting`, `WebPage`, `BreadcrumbList`, `FAQPage` (when present)        |
| `/blog/kategori/[slug]` | `CollectionPage`, `BreadcrumbList`                                          |
| `/sss`                  | `FAQPage`, `BreadcrumbList`                                                 |
| `/iletisim`             | `ContactPage`, `BreadcrumbList`                                             |
| Legal pages             | `WebPage`, `BreadcrumbList`                                                 |

`BeautySalon` is a subtype of `HealthAndBeautyBusiness` → `LocalBusiness`. It is
the correct type for a güzellik merkezi and carries no medical implication.

### 2.3 The business entity

```jsonc
{
  "@type": "BeautySalon",
  "@id": "https://marenbeauty.com/#business",
  "name": "Maren Beauty",
  "url": "https://marenbeauty.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Selçuklu",
    "addressRegion": "Konya",
    "addressCountry": "TR",
    // streetAddress and postalCode intentionally OMITTED — not guessed
  },
  "areaServed": { "@type": "City", "name": "Konya" },
  "hasOfferCatalog": {/* the 20 services, names + URLs only, no prices */},
  // telephone, sameAs, openingHoursSpecification, aggregateRating,
  // review, priceRange, geo, hasMap — all omitted while unknown
}
```

**Omitted, never faked.** A wrong `streetAddress` or an invented rating is
worse than an absent field: it is inaccurate data about a real business, and
review markup for reviews that do not exist violates Google's policy outright.

`telephone` and `sameAs` appear automatically the moment `src/config/contact.ts`
has values — the schema builder maps `null` to omission.

### 2.4 Service and BlogPosting

`Service` — no price, no offer with a price, no medical typing:

```jsonc
{
  "@type": "Service",
  "name": "Hydrafacial",
  "serviceType": "Cilt bakımı uygulaması",
  "provider": { "@id": "https://marenbeauty.com/#business" },
  "areaServed": { "@type": "City", "name": "Konya" },
  "url": "https://marenbeauty.com/hizmetler/hydrafacial",
  "description": "…summary…",
}
```

`BlogPosting` — author is the **Organization** while the byline is `PENDING`:

```jsonc
{
  "@type": "BlogPosting",
  "headline": "…", // ≤ 110 chars
  "author": { "@id": "https://marenbeauty.com/#organization" },
  "publisher": { "@id": "https://marenbeauty.com/#organization" },
  "datePublished": "…",
  "dateModified": "…",
  "inLanguage": "tr-TR",
  "isPartOf": { "@id": "https://marenbeauty.com/#website" },
}
```

`Organization` uses the **brand name** "Maren Beauty", which is known — not the
legal entity, which is not (`{{LEGAL_ENTITY}}` appears only in legal page copy,
never in schema, and the guard blocks it from reaching output either way).

When a real author name arrives, this switches to a `Person` in one place.

### 2.5 Pre-launch rules — unit-tested

While `site.isPreLaunch === true`, the schema builders **must not emit**:

- `openingHoursSpecification` — hours are unknown
- `aggregateRating`, `review` — no reviews exist
- `priceRange`, `offers.price`, `PriceSpecification` — no prices published
- `geo`, `hasMap`, `streetAddress`, `postalCode` — address not published
- `foundingDate`, `numberOfEmployees` — unknown
- `Event` for an opening — no confirmed date

There is a test asserting each of these is absent. Flipping `isPreLaunch` to
`false` is what allows them, and only once the underlying facts exist.

### 2.6 Validation

Every milestone touching schema must pass:

1. Google Rich Results Test on one URL per route type.
2. Schema.org validator — zero errors, zero warnings on required fields.
3. `npm run test` — unit tests for §2.5 and for `@id` graph integrity.

---

## 3. Local SEO plan

The target is Konya, and specifically Selçuklu. Local visibility for a beauty
centre is driven overwhelmingly by Google Business Profile — which cannot exist
until the business does.

### Phase 1 — pre-launch (now)

What is achievable without a physical presence:

| Action                       | Detail                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Locality in metadata         | "Konya", "Selçuklu" in the home title, description and body copy — naturally, not stuffed.                                              |
| `BeautySalon` + `areaServed` | Correct entity type and service area, no invented address.                                                                              |
| Service pages                | 20 well-written pages are the main organic asset before local signals exist.                                                            |
| Blog clusters                | Informational queries where local ranking factors matter less.                                                                          |
| NAP decision                 | Agree the canonical Name / Address / Phone string **now** so every later listing matches exactly. Recorded in `docs/OPEN-QUESTIONS.md`. |
| Technical hygiene            | Static, fast, accessible, crawlable, correct canonicals.                                                                                |
| Search Console               | Verify the domain via DNS TXT at cutover, submit the sitemap.                                                                           |

**What we do not do pre-launch:** claim to be open, invent hours, create a GBP
for an address that is not operating, buy directory listings, or publish "Konya'nın
en iyi…" claims.

### Phase 2 — at opening

| Action                  | Detail                                                                                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Business Profile | Create and verify. Primary category **"Güzellik salonu"**; secondary categories only for services actually offered.                                                                                                                            |
| Address decision        | The display address is "Konya, Selçuklu" by choice. GBP requires a verifiable address — the owner decides between a public street address or a service-area listing with the address hidden. **Open question — see `docs/OPEN-QUESTIONS.md`.** |
| Hours                   | Real hours → flip `isPreLaunch: false` → `openingHoursSpecification` appears automatically.                                                                                                                                                    |
| Photos                  | Real venue photography → GBP and the image manifest updated together.                                                                                                                                                                          |
| NAP consistency         | Identical string everywhere: GBP, site footer, schema, any directory.                                                                                                                                                                          |
| Apple Business Connect  | Secondary but cheap. Same NAP.                                                                                                                                                                                                                 |

### Phase 3 — post-launch, ongoing

| Action        | Detail                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviews       | Ask real clients, in person, after a real visit. **Never incentivised, never written for them, never gated.** Only then does `aggregateRating` become truthful. |
| GBP posts     | Occasional, factual updates.                                                                                                                                    |
| Q&A           | Seed with genuine questions the team actually receives.                                                                                                         |
| Local content | Only if it is genuinely useful — see below.                                                                                                                     |
| Monitoring    | Search Console queries, GBP insights, Umami. Quarterly review.                                                                                                  |

### Considered and deferred: district landing pages

Pages like `/lazer-epilasyon-meram` are a common local tactic and are usually
thin duplicates — a ranking risk and a bad experience. **Deferred.** Revisit
only if Search Console shows real district-qualified demand, and then only with
genuinely distinct content per page. Never as a template fill.

### Never

- Fake or incentivised reviews, or review markup for reviews that do not exist.
- Invented address, hours, founding date or staff.
- "Konya'nın en iyi", "1 numaralı", or any superlative — unverifiable, and
  against the tone (`docs/BRIEF.md` §5).
- Keyword-stuffed titles, hidden text, doorway pages.
- Medical schema types or treatment language to chase medical-intent queries.

---

## 4. Technical SEO checklist

Per milestone that touches routing or content:

- [ ] Exactly one `h1`; heading levels do not skip.
- [ ] Absolute canonical present and correct.
- [ ] Title ≤ 60 chars, description 150–165 chars.
- [ ] OG image resolves; 1200×630; text passes the content guard.
- [ ] JSON-LD parses; `@id` references resolve; pre-launch rules hold.
- [ ] Breadcrumbs match the visual trail.
- [ ] Route present in `sitemap.xml` with a real `lastModified`.
- [ ] No orphan: at least one internal inbound link (`docs/CONTENT-PLAN.md` §5).
- [ ] Every image has meaningful Turkish `alt`, or `alt=""` if decorative.
- [ ] No render-blocking third-party request; no font CDN.
- [ ] 404 returns a real 404 status, not a 200 soft-404.
- [ ] Any slug change ships with a 301 in `next.config.ts` in the same commit.

---

## 5. Measurement

Pre-launch there is nothing to measure, and that is fine. From launch:

| Signal                                 | Source             | Cadence                |
| -------------------------------------- | ------------------ | ---------------------- |
| Impressions, clicks, position by query | Search Console     | Monthly                |
| Indexed vs submitted                   | Search Console     | Monthly                |
| Page views, entry pages, referrers     | Umami (cookieless) | Monthly                |
| Contact form submissions               | Inbox volume       | Monthly                |
| GBP views, direction requests, calls   | GBP Insights       | Monthly (post-opening) |

Core Web Vitals are monitored, but per the brief **Lighthouse is a target, not
an acceptance criterion**. Correctness and accessibility come first; a
milestone is never blocked on a score.

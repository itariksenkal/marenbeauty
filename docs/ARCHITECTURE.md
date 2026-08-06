# ARCHITECTURE — Maren Beauty

Routes, data model, folder tree and component inventory. Read alongside
`CLAUDE.md` (rules) and `docs/ROADMAP.md` (build order).

---

## 1. Shape of the application

A **fully static Next.js App Router site** with exactly one dynamic surface:
the contact form's route handler.

- Every content route is prerendered at build time via `generateStaticParams`.
- Content is MDX in the repo. There is no database, no CMS API, no runtime
  content fetch.
- The only server work at runtime is `POST /api/contact` and
  `GET /api/altcha`, both on the **Node runtime** (Edge cannot open SMTP).
- `output: 'standalone'` + `Dockerfile` — the site runs identically on Vercel
  and on a plain container (`CLAUDE.md` §3).

Consequence: a content change is a git commit and a rebuild. That is the
deliberate trade for zero vendor lock-in, and it is what makes a Git-backed
admin UI (a later milestone) a drop-in rather than a migration.

---

## 2. Routes

All user-facing slugs are Turkish, ASCII-folded (`CLAUDE.md` §6). `/api/*` is
English because it is not user-facing.

| Route                                | File                                             | Render           | Purpose                                                               |
| ------------------------------------ | ------------------------------------------------ | ---------------- | --------------------------------------------------------------------- |
| `/`                                  | `app/page.tsx`                                   | Static           | Home. The pinned water sequence, services, process, blog teaser, CTA. |
| `/hizmetler`                         | `app/hizmetler/page.tsx`                         | Static           | Service index — all 20, grouped.                                      |
| `/hizmetler/[slug]`                  | `app/hizmetler/[slug]/page.tsx`                  | SSG ×20          | Service detail. View Transition target from the card.                 |
| `/hakkimizda`                        | `app/hakkimizda/page.tsx`                        | Static           | The centre, the approach, the space.                                  |
| `/blog`                              | `app/blog/page.tsx`                              | Static           | **Page 1.** Latest posts + category filter.                           |
| `/blog/sayfa/[page]`                 | `app/blog/sayfa/[page]/page.tsx`                 | SSG              | Pages **2+**, 12 per page. Each self-canonical.                       |
| `/blog/[slug]`                       | `app/blog/[slug]/page.tsx`                       | SSG ×12→50+      | Post detail.                                                          |
| `/blog/kategori/[slug]`              | `app/blog/kategori/[slug]/page.tsx`              | SSG ×6           | Category archive, page 1.                                             |
| `/blog/kategori/[slug]/sayfa/[page]` | `app/blog/kategori/[slug]/sayfa/[page]/page.tsx` | SSG              | Archive pages **2+**. See below.                                      |
| `/sss`                               | `app/sss/page.tsx`                               | Static           | FAQ. `FAQPage` schema.                                                |
| `/iletisim`                          | `app/iletisim/page.tsx`                          | **Dynamic**      | Contact form, location, channels. See below.                          |
| `/kvkk`                              | `app/kvkk/page.tsx`                              | Static           | KVKK Aydınlatma Metni.                                                |
| `/cerez-politikasi`                  | `app/cerez-politikasi/page.tsx`                  | Static           | Cookie policy.                                                        |
| `/kullanim-kosullari`                | `app/kullanim-kosullari/page.tsx`                | Static           | Terms of use.                                                         |
| `/lisanslar`                         | `app/lisanslar/page.tsx`                         | Static           | Third-party attribution, read from the generated `NOTICE`. `noindex`. |
| `/galeri`                            | `app/galeri/page.tsx`                            | Static           | The launch image set, grouped, with credits. See §3.5.                |
| `/api/contact`                       | `app/api/contact/route.ts`                       | **Node runtime** | `POST` → Altcha verify → Zod → Nodemailer. Persists nothing.          |
| `/api/altcha`                        | `app/api/altcha/route.ts`                        | **Node runtime** | `GET` → signed proof-of-work challenge.                               |

### Generated files

| Output                 | File                                       |
| ---------------------- | ------------------------------------------ |
| `sitemap.xml`          | `app/sitemap.ts`                           |
| `robots.txt`           | `app/robots.ts`                            |
| `manifest.webmanifest` | `app/manifest.ts`                          |
| Default OG image       | `app/opengraph-image.tsx`                  |
| Per-service OG         | `app/hizmetler/[slug]/opengraph-image.tsx` |
| Per-post OG            | `app/blog/[slug]/opengraph-image.tsx`      |
| 404                    | `app/not-found.tsx`                        |
| Route error boundary   | `app/error.tsx`                            |
| Root error boundary    | `app/global-error.tsx`                     |

### Not built

- No `/randevu` — there is no booking system (`docs/BRIEF.md` §6).
- No `/fiyatlar` — no prices are published, ever.
- No `/yorumlar` — testimonials are empty until real ones exist.
- No `/en/*` — Turkish only, no i18n scaffolding by decision.
- No auth, no account area, no cart.

### Pagination convention

One rule, in one place (`src/lib/pagination.ts`), shared by the blog index and
every category archive:

> **Page 1 is the bare path. Page numbers start at 2.**

`pagesAfterFirst()` returns `[2 … n]`, so `…/sayfa/1` is never generated and
`dynamicParams = false` makes every ungenerated page number a 404 rather than an
empty grid. `hrefForPage()` maps page 1 back to the bare path, so no component
can emit the duplicate by arithmetic accident. `next.config.ts` redirects
`…/sayfa/1` permanently to the bare path — the page still does not exist, it
simply resolves to the URL that does.

**Category archives are paginated from M9, before they need it.** Fourteen of
the fifty planned posts (`docs/CONTENT-PLAN.md` §4) map to
`cilt-yenileme-rehberi`, which is more than one page of twelve. Adding the route
after those posts existed would have changed archive URLs that were already
published.

An empty collection is **one** page, not zero: `/blog` still renders, with its
empty state.

### Why `/iletisim` is rendered per request

Every other page is prerendered. This one cannot be, for two independent
reasons:

1. **It issues a signed page token** (`src/lib/spam/form-token.ts`). Baked in at
   build time it would be identical for every visitor and expire minutes after
   the deploy.
2. **It reads `searchParams`.** The no-JavaScript path posts the form and comes
   back here with the outcome in the URL, and reading search params opts a route
   out of static rendering anyway.

**One consequence worth knowing:** `npm run guard` scans prerendered output, so
a dynamic route emits no `.html` for it to read. The page's copy is scanned by a
unit test running the real guard rules over `src/config/forms.ts` instead
(`docs/OPEN-QUESTIONS.md` G21).

### Slug permanence

Slugs are permanent. Renaming one requires a `redirects()` entry in
`next.config.ts` in the **same commit**, plus a sitemap rebuild. There is no
"just rename it" path.

---

## 3. Data model

Everything is file-based, typed, and validated at build time. Invalid content
fails the build — it never degrades silently at runtime.

### 3.1 Service — `content/services/*.mdx`

20 files. Filename is the slug.

Both schemas are **`.strict()`**: unknown keys are rejected. That catches typos
(`sumary:` silently becoming an empty field) and enforces that computed values
are never authored — `readingMinutes` in frontmatter is an error, not an
override. Dates use `z.iso.date()` (the Zod 4 form of `z.string().date()`), and
the loader normalises YAML's automatic `Date` conversion back to an ISO string
so authors never need to quote a date.

```ts
const serviceSchema = z.object({
  title: z.string().min(2), // "Hydrafacial"
  eyebrow: z.string().nullable(), // "Cilt bakımı"
  summary: z.string().min(60).max(165), // doubles as meta description
  group: z.enum(SERVICE_GROUPS), // see §3.2
  order: z.number().int(), // sort within group
  heroImageId: z.string(), // → images manifest
  durationLabel: z.string().nullable(), // null until owner confirms
  suitableFor: z.array(z.string()).max(6), // cilt tipleri / ihtiyaçlar
  steps: z
    .array(
      z.object({
        // what happens in the room
        title: z.string(),
        body: z.string(),
      }),
    )
    .min(2)
    .max(6),
  aftercare: z.array(z.string()).max(6),
  faq: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .max(8),
  relatedServices: z.array(z.string()).max(4), // slugs, referential-checked
  seo: z.object({
    title: z.string().max(60).nullable(),
    description: z.string().max(165).nullable(),
  }),
});
```

`durationLabel` is `nullable` and ships as `null` until the owner confirms real
session lengths. A null duration renders nothing — it does not render "—" or a
guess. Logged in `docs/OPEN-QUESTIONS.md`.

The MDX **body** carries the long-form description, written to the copy rules
in `CLAUDE.md` §9.

The loaded `Service` (and `Post`) also carries **`file`** — the repo-relative
source path. Added at M8 so a consumer that needs to _name_ the file, such as an
MDX compile error, never rebuilds the path from the slug: nothing outside
`src/content-layer/` may write a path under `content/` (`CLAUDE.md` §5), and a
unit test enforces it.

### 3.2 Service groups

```ts
const SERVICE_GROUPS = [
  'cilt-bakimi', // Cilt Bakımı
  'epilasyon', // Epilasyon
  'cilt-yenileme', // Cilt Yenileme Uygulamaları
  'kas-kirpik', // Kaş & Kirpik
  'ozel-paket', // Özel Paketler
] as const;
```

### 3.3 Blog post — `content/blog/*.mdx`

```ts
const postSchema = z.object({
  title: z.string().min(10).max(70),
  summary: z.string().min(80).max(165),
  publishedAt: z.string().date(),
  updatedAt: z.string().date().nullable(),
  category: z.enum(BLOG_CATEGORIES),
  tags: z.array(z.string()).max(5),
  service: z.string(), // slug — every post maps to one
  author: z.literal('PENDING'), // never a fabricated name
  heroImageId: z.string(), // one per CATEGORY, not per post
  keyword: z.string(), // primary target keyword
  intent: z.enum(['informational', 'commercial', 'transactional']),
  draft: z.boolean().default(false),
  keyPoints: z.array(z.string()).max(5), // the "Kısaca" block — §6
  faq: z.array(z.object({ question, answer })).max(4), // feeds FAQPage
  seo: z.object({
    title: z.string().max(60).nullable(),
    description: z.string().max(165).nullable(),
  }),
});
```

`author` is the literal `'PENDING'`. The type makes a fabricated byline a
**compile error**, not a review catch. When the owner supplies a real name, the
schema widens in one place and `BlogPosting.author` switches from
`Organization` to `Person`.

`readingMinutes` is **computed** from the body, never authored.

`keyPoints` and `faq` were added at M9 so the post template can implement the
§6 structure from data rather than by parsing headings back out of prose, and so
M13's `FAQPage` JSON-LD has question/answer pairs to work from. Both may be
empty; an empty list renders nothing.

**Drafts have a route in development and none in production.** `visible()`
honours `includeDrafts` only when `NODE_ENV !== 'production'`, so
`generateStaticParams` for `/blog/[slug]` produces the draft under `next dev`
and omits it from the build that ships. That is what gives the post template a
review surface — and browser coverage — before the first real post exists.

### 3.4 Referential integrity — enforced at build

**Eight checks** (`src/content-layer/integrity.ts`). Checks 1–7 were implemented
at M4, check 8 at M8; each has a failing fixture test, and the check id is
stable so tests assert on the specific rule.

| #   | id                        | Fails when                                                                         |
| --- | ------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `related-service-missing` | A `relatedServices` slug has no matching file, or a service references itself.     |
| 2   | `post-service-missing`    | A post's `service` has no matching service.                                        |
| 3   | `image-missing`           | A `heroImageId` is absent from the image manifest.                                 |
| 4   | `invalid-slug`            | A slug is not ASCII kebab-case — Turkish characters are folded, not dropped.       |
| 5   | `slug-title-mismatch`     | **A service** filename does not equal `slugify(title)`.                            |
| 6   | `duplicate-slug`          | Two documents in a collection share a slug.                                        |
| 7   | `draft-referenced`        | Anything published links to a `draft: true` post, which would be a guaranteed 404. |
| 8   | `internal-link-missing`   | A `/hizmetler/<slug>` **or `/blog/<slug>`** link in a body has no matching file.   |

**Check 8 was added at M8**, the first milestone where prose carries contextual
links (`docs/CONTENT-PLAN.md` §5, "Anchor text"). Those are exactly as easy to
break by renaming a file as `relatedServices` is, and just as certain a 404, so
they fail the build the same way rather than waiting to be noticed in
production. **Widened at M10 to cover `/blog/<slug>`**: check 7 catches a link
to a post that is a DRAFT, but a link to a slug that does not exist at all was
nobody's job until the twelve posts started cross-linking each other.

Two clarifications made when this was built:

- **Check 5 applies to services only.** Post slugs are deliberately shorter
  than their titles — `docs/CONTENT-PLAN.md` §4 plans _"Lazer Epilasyon Nedir?
  Uygulama Nasıl İlerler"_ at `/blog/lazer-epilasyon-nedir` — so applying the
  same rule to posts would reject every planned post. Check 4 still requires a
  post filename to be a valid slug.
- **Check 7 is implemented by scanning MDX bodies** for `/blog/<slug>` links,
  since there is no explicit post-to-post reference field. That makes it a real
  broken-link check rather than a vacuous one.

`assertIntegrity()` reports **every** problem in one error, not just the first.

Dangling references are build failures, not 404s in production.

### 3.4b Legal document — `content/legal/*.mdx` (M12)

Three files, deliberately the smallest schema in the project: `title`,
`summary`, `order`. No taxonomy, no relations, no drafts. Legal text is prose
with a title and a description, and a richer schema would be scaffolding nobody
uses.

The **body never names the legal entity.** The data-controller block is rendered
by `LegalDocumentPage` from `src/config/legal-entity.ts`, so the unresolved
state (`docs/OPEN-QUESTIONS.md` B2) is expressed in one place instead of three,
and no MDX file carries a `{{…}}` token that would then have to reach output for
the guard to see it.

### 3.5 Image manifest — `src/config/images.ts`

The only place a path under `public/images/` may appear (`CLAUDE.md` §8).

**GENERATED from M18.** `node scripts/fetch-images.mjs` reads
`scripts/image-set.mjs` — the committed record of which 48 photographs were
chosen — downloads them, converts to WebP at 1600×1200, and writes this file.
Hand-editing it is a mistake the next run silently reverts, so a unit test
asserts the two agree. `ManagedImage` gained a `group` field
(`service | blog | page | gallery`), which is what `/galeri` groups by and what
`supportingImageIds()` draws from.

Everything is **self-hosted**. Nothing is hotlinked, which is what keeps
`content/legal/cerez-politikasi.mdx`'s "no third-party request" true; a unit
test greps `src/` for an image-CDN host and a browser test asserts `/galeri`
issues zero off-origin requests.

```ts
type ManagedImage = {
  readonly id: string;
  readonly src: string;
  readonly alt: string; // Turkish, meaningful
  readonly width: number;
  readonly height: number;
  readonly credit: string | null;
  readonly licence: string; // 'Unsplash Licence' | 'Pexels Licence' | 'CC0-1.0'
  readonly sourceUrl: string | null;
  readonly replaceable: boolean; // true for all launch stock
};
```

Swapping every launch image for real photography is a single-file change. No
component moves.

### 3.6 Testimonials — `src/config/testimonials.ts`

```ts
export const testimonials: readonly Testimonial[] = [];
```

Ships empty and stays empty. `TestimonialsSection` returns `null` on an empty
array — no heading, no "coming soon", no skeleton.

### 3.7 Contact channels — `src/config/contact.ts`

```ts
export const contact = {
  whatsapp: null, // primary once configured
  phone: null,
  instagram: null,
  email: null, // destination inbox PENDING
} as const satisfies Record<string, ContactChannel>;
```

`null` renders nothing at all (`CLAUDE.md` §7). `npm run guard` fails the build
if an empty-target link reaches output.

### 3.8 Site config — `src/config/site.ts`

```ts
export const site = {
  name: 'Maren Beauty',
  domain: 'marenbeauty.com',
  url: 'https://marenbeauty.com',
  locale: 'tr-TR',
  htmlLang: 'tr',
  address: { locality: 'Selçuklu', region: 'Konya', country: 'TR' },
  //         ↑ no streetAddress — omitted, never guessed
  isPreLaunch: true,
} as const;
```

---

## 4. Content pipeline

```
content/**/*.mdx
   │  gray-matter (MIT)            → split frontmatter / body
   │  zod (MIT)                    → validate, type, fail build on error
   │  referential integrity pass   → §3.4
   │  @mdx-js/mdx evaluate() (MIT) → compile body to a React component in RSC
   ▼
src/content-layer/  → typed queries
   ▼
Server Components   → rendered at build via generateStaticParams
```

**`next-mdx-remote` is rejected: MPL-2.0**, outside the licence policy
(`docs/LICENSES.md`). `@mdx-js/mdx`'s `evaluate()` does the same job under MIT
in roughly thirty lines.

Plugins: `remark-gfm`, `rehype-slug`, `rehype-autolink-headings` — all MIT. No
syntax highlighter; this site has no code blocks.

### Content layer API

```ts
getAllServices(): Service[]                      // sorted by group, then order
getServiceBySlug(slug): Service | null
getServicesByGroup(group): Service[]
getAllPosts(opts?): Post[]                       // drafts excluded in production
getPostBySlug(slug): Post | null
getPostsByService(slug): Post[]
getPostsByCategory(category): Post[]
getRelatedPosts(post, limit): Post[]             // same service → same category
getAllSlugs(kind): string[]                      // for generateStaticParams
```

Read once at module scope, cached for the build. Nothing outside
`src/content-layer/` touches `content/` (`CLAUDE.md` §5).

---

## 5. Folder tree

```
marenbeauty/
├─ CLAUDE.md
├─ Dockerfile
├─ .nvmrc                            # 24
├─ next.config.ts                    # standalone output, redirects, image config
├─ eslint.config.mjs
├─ tsconfig.json
├─ package.json
├─ docs/
│  ├─ BRIEF.md  DESIGN-SYSTEM.md  ARCHITECTURE.md  CONTENT-PLAN.md
│  ├─ SEO.md  MOTION.md  ROADMAP.md  DEPLOY.md
│  ├─ LICENSES.md  OPEN-QUESTIONS.md
├─ scripts/
│  ├─ guard.mjs                      # banned lexicon, {{tokens}}, empty links
│  └─ guard.allow.json               # justified exceptions
├─ content/
│  ├─ services/                      # 20 .mdx
│  └─ blog/                          # 12 .mdx now, 50+ later
├─ public/
│  ├─ fonts/                         # Fraunces + Manrope, woff2, subset
│  ├─ images/
│  └─ grain.png                      # pre-rendered 4% noise tile
└─ src/
   ├─ app/
   │  ├─ layout.tsx                  # <html lang="tr">, fonts, aurora, grain
   │  ├─ page.tsx
   │  ├─ hizmetler/…  blog/…  hakkimizda/  iletisim/  sss/
   │  ├─ kvkk/  cerez-politikasi/  kullanim-kosullari/
   │  ├─ api/contact/route.ts        # runtime = 'nodejs'
   │  ├─ api/altcha/route.ts         # runtime = 'nodejs'
   │  ├─ sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx
   │  └─ not-found.tsx  error.tsx  global-error.tsx
   ├─ components/
   │  ├─ ui/  layout/  motion/  sections/  content/  forms/  seo/
   ├─ config/
   │  ├─ site.ts  contact.ts  navigation.ts  images.ts
   │  ├─ legal.ts  analytics.ts  motion.ts  env.ts  testimonials.ts
   ├─ content-layer/
   │  ├─ schemas.ts  services.ts  posts.ts  mdx.ts  integrity.ts
   ├─ lib/
   │  ├─ cn.ts  slug.ts  date.ts  reading-time.ts
   │  ├─ schema/                     # JSON-LD builders
   │  └─ mail/                       # nodemailer transport + templates
   ├─ hooks/
   │  ├─ use-motion-tier.ts  use-scroll-progress.ts  use-reduced-motion.ts
   └─ styles/
      ├─ globals.css  theme.css
```

---

## 6. Component inventory

`S` = Server Component (default). `C` = Client Component (`'use client'`).

### `components/ui/` — shadcn primitives, no business logic

| Component                             |     | Notes                                                           |
| ------------------------------------- | --- | --------------------------------------------------------------- |
| `Button`                              | S   | `variant`: solid / outline / ghost / link. `asChild` for links. |
| `Input` `Textarea` `Label` `Checkbox` | S   | `border-strong` only — §1.5 of design system.                   |
| `Accordion`                           | C   | Radix. FAQ, mobile nav.                                         |
| `Dialog`                              | C   | Radix. Mobile menu only.                                        |
| `Separator` `Tag` `VisuallyHidden`    | S   |                                                                 |

### `components/layout/`

| Component             |     | Notes                                                                                                    |
| --------------------- | --- | -------------------------------------------------------------------------------------------------------- |
| `SiteHeader`          | C   | Transparent over hero → solid on scroll. Hosts the contracted "Maren" wordmark from the pinned sequence. |
| `SiteFooter`          | S   | Nav, display address, legal links, channels (omitted when `null`).                                       |
| `MobileMenu`          | C   | Dialog + focus trap.                                                                                     |
| `SkipLink`            | S   | First focusable. → `#main`.                                                                              |
| `Container` `Section` | S   | Width and rhythm tokens. No ad-hoc padding anywhere else.                                                |
| `Breadcrumbs`         | S   | Visual + `BreadcrumbList` JSON-LD.                                                                       |
| `PreLaunchBand`       | S   | Renders only while `site.isPreLaunch`.                                                                   |

### `components/motion/` — every animated primitive lives here

| Component                          |     | Notes                                                      |
| ---------------------------------- | --- | ---------------------------------------------------------- |
| `MotionTierProvider`               | C   | Resolves `full` / `reduced` / `static` once; context.      |
| `AuroraBackground`                 | C   | Signature #1. Scroll-linked wash. `--z-aurora`.            |
| `GrainOverlay`                     | S   | 4% tile, `pointer-events: none`, `--z-grain`. No JS.       |
| `PinnedSequence`                   | C   | Sticky viewport + scroll progress. **Used exactly twice.** |
| `StickyPanelStack` / `StickyPanel` | C   | Signature #2. 40px top radius, 0.96 scale, dim.            |
| `TextReveal`                       | C   | Signature #3. Line-by-line `clip-path`. Capped at 6 lines. |
| `ImageReveal`                      | C   | Signature #4. `inset()` wipe + inner scale 1.12→1.         |
| `ViewTransitionLink`               | C   | Signature #5. Feature-detected; plain `Link` otherwise.    |
| `WaterForm`                        | C   | The transforming surface tying the narrative together.     |

### `components/content/`

| Component                                 |     | Notes                                                    |
| ----------------------------------------- | --- | -------------------------------------------------------- |
| `Mdx`                                     | S   | Compiled MDX + component map.                            |
| `Prose`                                   | S   | Typographic rhythm for long form. 68ch.                  |
| `ManagedImage`                            | S   | Takes a manifest `id`. **The only `next/image` caller.** |
| `ImageCredit`                             | S   | Renders licence/credit when the manifest has one.        |
| `ServiceCard` / `ServiceGrid`             | S   | Card is the View Transition source.                      |
| `PostCard` / `PostGrid` / `CategoryPills` | S   | No byline. Pills are plain links, so filtering is a URL. |
| `Pagination` / `PostListing`              | S   | Shared by all four listing routes. Renders nothing at 1. |
| `Faq`                                     | S   | Native `<details>`. See below. `FAQPage` JSON-LD at M13. |
| `RelatedServices` / `RelatedPosts`        | S   | Internal linking map (`docs/CONTENT-PLAN.md` §5).        |

**`Faq` is a Server Component built on native `<details>` / `<summary>`, not a
Radix Accordion.** Decided at M8. Twenty service pages would otherwise each ship
a client bundle for a disclosure widget the browser already implements —
correctly, including keyboard handling and screen-reader announcement — and the
native version works before hydration and with JavaScript off. No dependency was
added, so the licence audit is unchanged.

### `components/sections/`

| Component             |     | Notes                                                  |
| --------------------- | --- | ------------------------------------------------------ |
| `HeroWater`           | C   | Pinned stage 1–3.                                      |
| `BrandStory`          | C   | Pinned stage 2, line-by-line reveal.                   |
| `ServicesPanels`      | C   | Sticky stack.                                          |
| `ExperienceProcess`   | C   | Second and last pinned sequence.                       |
| `BlogTeaser`          | S   | 3 latest posts.                                        |
| `LocationCard`        | S   | "Konya, Selçuklu". No map embed (third-party cookies). |
| `ContactCta`          | S   | Water settles. WhatsApp-first hierarchy.               |
| `TestimonialsSection` | S   | Returns `null` while empty.                            |

### `components/forms/`

| Component     |     | Notes                                                       |
| ------------- | --- | ----------------------------------------------------------- |
| `ContactForm` | C   | Progressive enhancement: works without JS via a plain POST. |
| `AltchaField` | C   | Proof-of-work widget, self-hosted.                          |
| `FormField`   | S   | Label + hint + error wiring (`aria-describedby`).           |
| `FormStatus`  | C   | `role="status"`, `aria-live="polite"`. Not a toast.         |

### `components/seo/`

| Component |     | Notes                                                       |
| --------- | --- | ----------------------------------------------------------- |
| `JsonLd`  | S   | Serialises a typed object from `lib/schema/`. One per page. |

---

## 7. Contact request flow

```
/iletisim (SSR)                 → renders a signed, single-use page token
ContactForm (C)  ── enhancement, on top of a form that already works ──
  └─ GET /api/altcha            → signed PoW challenge (HMAC, short TTL)
  └─ solve in a Web Worker      → no user interaction; 8s cap, then give up
  └─ POST /api/contact          → { ad, eposta, mesaj, hizmet?, onay, altcha }
POST /api/contact
  ├─ 1 rate limit per address   → in-memory, best-effort, cheapest check first
  ├─ 2 honeypot must be empty   → a hit answers 200, silently, and sends nothing
  ├─ 3 spam gate                → PoW if JavaScript ran, else the page token.
  │                               Both HMAC-signed, short-TTL and SINGLE-USE
  ├─ 4 zod parse, .strict()     → unknown keys rejected; spam fields dropped
  │                               here so they can never reach the template
  ├─ 5 nodemailer               → Workspace SMTP (587, STARTTLS, app password)
  └─ JSON to fetch, 303 to a plain form POST — nothing written anywhere
```

- `export const runtime = 'nodejs'` on both handlers. **Edge cannot open SMTP.**
- **Two spam paths, both verified server-side.** Proof of work needs a Web
  Worker, so a visitor with JavaScript off cannot produce one — and the form has
  to work anyway. The page therefore also issues a signed, expiring, single-use
  token, which is the floor for that path. Accepting no-JS submissions with no
  check at all would have made the whole Altcha layer decorative: a spammer only
  has to switch JavaScript off.
- **Secrets are split into two tiers** (`src/config/env.ts`): the signing key,
  which the page needs to RENDER, and the mail credential, which is needed only
  to SEND. They were one blob until `/iletisim` returned 500 on a server with no
  mailbox configured (G22).
- The consent checkbox is required, unchecked by default, and links to `/kvkk`.
- Errors return a generic Turkish message, identical for every server-side
  cause. No SMTP detail reaches the client.
- No personal data is persisted anywhere (`CLAUDE.md` §11). The single-use store
  and the rate limiter are in-memory and die with the process; the development
  capture is in memory too, and refused in production.

---

## 8. Rendering and performance

- Server Components by default. `'use client'` is pushed as deep as possible —
  `AuroraBackground` is client, the section wrapping it is not.
- All content routes fully static; ISR is not used.
- Fonts self-hosted, preloaded, `swap`, subset `latin` + `latin-ext`.
- `next/image` with explicit `sizes`; AVIF + WebP; hero gets `priority`.
- The grain overlay is a pre-rendered tile, not a live SVG filter — a
  full-viewport `feTurbulence` repaints on scroll and would break the GPU rule
  (`docs/MOTION.md` §3.6).
- No third-party embeds. No map iframe, no font CDN, no chat widget, no
  social pixel while `analytics.ts` flags are off.

---

## 9. Deliberate non-goals

| Not doing           | Why                                                         |
| ------------------- | ----------------------------------------------------------- |
| Database            | Nothing to persist. The form emails and forgets.            |
| Auth                | No account surface exists.                                  |
| i18n routing        | Turkish only, by decision.                                  |
| Booking integration | No system exists. Revisit post-launch.                      |
| Dark mode           | Decided against; tokens keep it addable.                    |
| Map embed           | Third-party cookies, and there is no street address to pin. |
| Client-side search  | 50 posts do not need it. Revisit past ~150.                 |

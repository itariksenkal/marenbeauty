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

| Route                   | File                                | Render           | Purpose                                                               |
| ----------------------- | ----------------------------------- | ---------------- | --------------------------------------------------------------------- |
| `/`                     | `app/page.tsx`                      | Static           | Home. The pinned water sequence, services, process, blog teaser, CTA. |
| `/hizmetler`            | `app/hizmetler/page.tsx`            | Static           | Service index — all 20, grouped.                                      |
| `/hizmetler/[slug]`     | `app/hizmetler/[slug]/page.tsx`     | SSG ×20          | Service detail. View Transition target from the card.                 |
| `/hakkimizda`           | `app/hakkimizda/page.tsx`           | Static           | The centre, the approach, the space.                                  |
| `/blog`                 | `app/blog/page.tsx`                 | Static           | Latest posts + category filter.                                       |
| `/blog/sayfa/[page]`    | `app/blog/sayfa/[page]/page.tsx`    | SSG              | Pagination, 12 per page. Page 1 canonicalises to `/blog`.             |
| `/blog/[slug]`          | `app/blog/[slug]/page.tsx`          | SSG ×12→50+      | Post detail.                                                          |
| `/blog/kategori/[slug]` | `app/blog/kategori/[slug]/page.tsx` | SSG ×6           | Category archive.                                                     |
| `/sss`                  | `app/sss/page.tsx`                  | Static           | FAQ. `FAQPage` schema.                                                |
| `/iletisim`             | `app/iletisim/page.tsx`             | Static           | Contact form, location, channels.                                     |
| `/kvkk`                 | `app/kvkk/page.tsx`                 | Static           | KVKK Aydınlatma Metni.                                                |
| `/cerez-politikasi`     | `app/cerez-politikasi/page.tsx`     | Static           | Cookie policy.                                                        |
| `/kullanim-kosullari`   | `app/kullanim-kosullari/page.tsx`   | Static           | Terms of use.                                                         |
| `/api/contact`          | `app/api/contact/route.ts`          | **Node runtime** | `POST` → Altcha verify → Zod → Nodemailer. Persists nothing.          |
| `/api/altcha`           | `app/api/altcha/route.ts`           | **Node runtime** | `GET` → signed proof-of-work challenge.                               |

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
  heroImageId: z.string(),
  keyword: z.string(), // primary target keyword
  intent: z.enum(['informational', 'commercial', 'transactional']),
  draft: z.boolean().default(false),
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

### 3.4 Referential integrity — enforced at build

**Seven checks** (`src/content-layer/integrity.ts`). Implemented at M4; each has
a failing fixture test, and the check id is stable so tests assert on the
specific rule.

| #   | id                        | Fails when                                                                         |
| --- | ------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `related-service-missing` | A `relatedServices` slug has no matching file, or a service references itself.     |
| 2   | `post-service-missing`    | A post's `service` has no matching service.                                        |
| 3   | `image-missing`           | A `heroImageId` is absent from the image manifest.                                 |
| 4   | `invalid-slug`            | A slug is not ASCII kebab-case — Turkish characters are folded, not dropped.       |
| 5   | `slug-title-mismatch`     | **A service** filename does not equal `slugify(title)`.                            |
| 6   | `duplicate-slug`          | Two documents in a collection share a slug.                                        |
| 7   | `draft-referenced`        | Anything published links to a `draft: true` post, which would be a guaranteed 404. |

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

### 3.5 Image manifest — `src/config/images.ts`

The only place a path under `public/images/` may appear (`CLAUDE.md` §8).

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
| `PostCard` / `PostGrid` / `CategoryPills` | S   |                                                          |
| `Faq`                                     | C   | Accordion + `FAQPage` JSON-LD.                           |
| `RelatedServices` / `RelatedPosts`        | S   | Internal linking map (`docs/CONTENT-PLAN.md` §5).        |

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
ContactForm (C)
  └─ GET /api/altcha            → signed PoW challenge (HMAC, short TTL)
  └─ solve in a Web Worker      → non-blocking, no user interaction
  └─ POST /api/contact          → { name, email, message, service?, consent, altcha }
       ├─ verify Altcha solution + HMAC + expiry + single-use
       ├─ zod parse; reject unknown keys
       ├─ honeypot field must be empty
       ├─ in-memory rate limit per IP (best-effort; not the primary defence)
       ├─ nodemailer → Google Workspace SMTP (587, STARTTLS, app password)
       └─ 200 { ok: true } — nothing written to disk or database
```

- `export const runtime = 'nodejs'` on both handlers. **Edge cannot open SMTP.**
- Credentials via `src/config/env.ts` (Zod-parsed, throws at startup if absent).
- The consent checkbox is required, unchecked by default, and links to `/kvkk`.
- Errors return a generic Turkish message. No SMTP detail reaches the client.
- No personal data is persisted anywhere (`CLAUDE.md` §11).

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

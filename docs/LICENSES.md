# LICENSES — Maren Beauty

Dependency licence policy, the planned inventory, and rejected alternatives.

> **This table is provisional.** No `npm install` has run — Phase 0 wrote
> documentation only. Every licence below is the expected value for the package
> and **must be replaced with real audit output at milestone M0**
> (`docs/ROADMAP.md`). Where a package has changed licence across versions,
> the audit is authoritative, not this file.

---

## 1. Policy

Every runtime and development dependency must carry one of:

**MIT · MIT-0 · Apache-2.0 · ISC · BSD-2-Clause · BSD-3-Clause · 0BSD ·
CC0-1.0 · Unlicense**

Fonts may additionally be **OFL-1.1**.

Anything else — GPL, LGPL, AGPL, MPL, SSPL, BUSL, CC-BY-NC, "source available",
"free for non-commercial use" — requires an explicit owner-approved exception,
recorded in §5 of this document with a reason. There are no silent exceptions.

### Enforcement

```bash
npm run licenses
```

```
license-checker-rseidelsohn --production --onlyAllow \
  "MIT;MIT-0;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;CC0-1.0;Unlicense;OFL-1.1"
```

Runs as part of `npm run verify` (`CLAUDE.md` §4). A new dependency with a
disallowed licence fails the build — it is not a code-review catch.

The audit tool itself must satisfy the policy; `license-checker-rseidelsohn` is
BSD-3-Clause. Confirm at M0.

---

## 2. Why this matters here

The owner asked for an open-source stack with no proprietary lock-in, and for
the site to remain self-hostable off Vercel. Licence discipline is what makes
that real rather than aspirational: if a dependency's terms restrict commercial
use, redistribution, or self-hosting, the portability guarantee in `CLAUDE.md`
§3 is void.

---

## 3. Planned inventory

### 3.1 Runtime

| Package | Expected licence | Purpose |
| --- | --- | --- |
| `next` | MIT | Framework, App Router |
| `react`, `react-dom` | MIT | UI runtime |
| `motion` | MIT | Animation (`motion/react`) |
| `lucide-react` | ISC | Icons — the only icon set |
| `@radix-ui/react-*` | MIT | Accessible primitives under shadcn/ui |
| `class-variance-authority` | Apache-2.0 | Component variants |
| `clsx` | MIT | Class composition |
| `tailwind-merge` | MIT | Class conflict resolution |
| `zod` | MIT | Validation at every boundary |
| `gray-matter` | MIT | Frontmatter parsing |
| `@mdx-js/mdx` | MIT | MDX compilation via `evaluate()` in RSC |
| `remark-gfm` | MIT | GFM support |
| `rehype-slug` | MIT | Heading ids |
| `rehype-autolink-headings` | MIT | Anchor links |
| `nodemailer` | MIT-0 *(verify — has varied by major version)* | SMTP to Google Workspace |
| `altcha` | MIT | Proof-of-work widget |
| `altcha-lib` | MIT | Server-side challenge and verification |
| `sharp` | Apache-2.0 | Image optimisation (`next/image`) |

### 3.2 Development

| Package | Expected licence | Purpose |
| --- | --- | --- |
| `typescript` | Apache-2.0 | Types |
| `tailwindcss` | MIT | Styling (v4, CSS-first `@theme`) |
| `@tailwindcss/postcss` | MIT | Build integration |
| `eslint` | MIT | Linting |
| `@typescript-eslint/*` | MIT / BSD-2-Clause | TS lint rules |
| `eslint-config-next` | MIT | Next.js rules |
| `prettier` | MIT | Formatting |
| `prettier-plugin-tailwindcss` | MIT | Class ordering |
| `vitest` | MIT | Unit tests |
| `@playwright/test` | Apache-2.0 | E2E and a11y harness |
| `@axe-core/playwright` | **MPL-2.0** ⚠️ | Accessibility assertions — **exception required, see §5** |
| `license-checker-rseidelsohn` | BSD-3-Clause | This audit |
| `@types/*` | MIT | Type definitions |

### 3.3 shadcn/ui

shadcn/ui is **MIT** and is not an npm dependency — components are copied into
`src/components/ui/` and owned by this repo. The MIT notice is retained in
`src/components/ui/LICENSE`. Its transitive Radix packages are ordinary
dependencies and appear in §3.1.

---

## 4. Assets

Assets are not npm packages and are not covered by `npm run licenses`. They are
tracked here and, for images, in `src/config/images.ts`.

### 4.1 Fonts

| Font | Licence | Notes |
| --- | --- | --- |
| Fraunces (variable) | **OFL-1.1** | Display. Self-hosted `woff2`, subset `latin` + `latin-ext`. |
| Manrope (variable) | **OFL-1.1** | Text. Same treatment. |

OFL-1.1 permits embedding, subsetting and commercial use. It requires that the
font not be sold on its own and that the Reserved Font Name is not reused for a
modified version. Subsetting for web delivery is explicitly permitted.

The full OFL text for each family is committed at `public/fonts/OFL-<family>.txt`.

**No runtime font CDN call, ever** (`CLAUDE.md` §2) — a privacy and portability
requirement, not only a performance one.

### 4.2 Icons

Lucide, **ISC**. Notice retained. No other icon set is permitted.

### 4.3 Images

Launch imagery is free stock. Every image is recorded in
`src/config/images.ts` with `licence`, `credit`, `sourceUrl` and
`replaceable: true` (`CLAUDE.md` §8).

| Source | Licence | Attribution |
| --- | --- | --- |
| Unsplash | Unsplash Licence | Not required; recorded anyway |
| Pexels | Pexels Licence | Not required; recorded anyway |
| Public domain / CC0 | CC0-1.0 | Not required; recorded anyway |

Constraints that apply regardless of licence:

- **No stock photograph of a person may be presented as the owner, a staff
  member or a client.** Model releases cover commercial use, not
  misrepresentation, and under Turkish personality-rights law implying a real
  relationship is a separate exposure.
- **No before/after imagery**, whatever its licence.
- Paid stock (Adobe Stock, Stocksy) remains an option — see
  `docs/OPEN-QUESTIONS.md` C7.

### 4.4 Grain texture

`public/grain.png` is generated for this project. No third-party licence.

---

## 5. Exceptions

Exceptions require owner approval. Each entry records the package, its licence,
why it is acceptable, and the scope of the approval.

| Package | Licence | Scope | Status |
| --- | --- | --- | --- |
| `@axe-core/playwright` | MPL-2.0 | **devDependency only.** Never bundled, never distributed. MPL-2.0 is file-level copyleft that applies to modifications of MPL-licensed files; using the tool unmodified in a test harness does not affect this project's licensing. | **Awaiting approval** — `docs/OPEN-QUESTIONS.md` E1 |

No other exception is approved. If none is granted, accessibility testing falls
back to Playwright's built-in assertions plus manual audit — materially weaker,
and recorded as such.

---

## 6. Rejected alternatives

Recorded so they are not reconsidered by accident.

| Rejected | Licence / reason | Chosen instead |
| --- | --- | --- |
| `next-mdx-remote` | **MPL-2.0** — outside policy | `@mdx-js/mdx` `evaluate()` (MIT), ~30 lines |
| Contentlayer | Effectively unmaintained | Hand-rolled loader in `src/content-layer/` |
| GSAP / ScrollTrigger / ScrollSmoother | Not an OSI licence | `motion` (MIT) |
| Lenis, Locomotive Scroll | MIT, **but they replace native scrolling** — banned by `docs/MOTION.md` §2.3 on behaviour, not licence | `position: sticky` + scroll-linked progress |
| Plausible Community Edition | **AGPL-3.0** — outside policy | Umami (MIT) — `docs/OPEN-QUESTIONS.md` E2 |
| Resend | Proprietary SaaS; sending data through a third party | Nodemailer over Google Workspace SMTP |
| Cloudflare Turnstile | Proprietary SaaS; third-party request on every form view | Altcha (MIT), self-hosted proof-of-work |
| `@vercel/analytics` | Proprietary **and** a Vercel-only API (`CLAUDE.md` §3) | Self-hosted Umami |
| `@vercel/kv`, `@vercel/blob`, `@vercel/postgres` | Vercel-only APIs; break portability | Not needed — nothing is persisted |
| Sanity, Contentful, Storyblok | Proprietary hosted CMS; vendor lock-in | MDX in-repo; Git-backed admin UI later |
| Google Fonts CDN | Third-party request, privacy exposure, offline breakage | Self-hosted OFL fonts |
| Google Maps embed | Third-party cookies; and there is no street address to pin | `LocationCard`, text only |

---

## 7. Self-hosted services

Not npm dependencies, but part of the stack and subject to the same policy.

| Service | Licence | Notes |
| --- | --- | --- |
| Umami | MIT | Cookieless analytics, self-hosted — `docs/OPEN-QUESTIONS.md` C5 |
| Node.js 24 | MIT | Runtime |
| Docker base image (`node:24-*`) | MIT (Node) + Debian/Alpine terms | Confirm the base image's own notice at M16 |

---

## 8. Attribution obligations

| Licence | Obligation |
| --- | --- |
| MIT, ISC, BSD-2, BSD-3 | Retain the copyright notice and licence text in distributed source |
| Apache-2.0 | Retain notice, licence and any `NOTICE` file; state significant modifications |
| MIT-0, 0BSD, CC0, Unlicense | None |
| OFL-1.1 | Retain the licence; do not sell the font alone; do not reuse a Reserved Font Name for a modified version |
| MPL-2.0 (if approved) | Retain notice; disclose modifications **to MPL-licensed files only** |

Because dependencies are consumed as npm packages and their notices remain in
`node_modules`, and because the built site distributes no dependency source
verbatim, no separate third-party notice page is required on the website.

**Reassess if that changes** — for example if a vendored library is copied into
`src/` (as shadcn/ui is; its MIT notice is retained at
`src/components/ui/LICENSE`).

---

## 9. Adding a dependency

1. Check the licence **before** installing.
2. If it is outside §1, stop. Open an entry in `docs/OPEN-QUESTIONS.md` and ask.
   Do not install it "temporarily".
3. If it is inside §1, install, add a row to §3 with its purpose, and run
   `npm run licenses`.
4. Verify no transitive dependency broke the policy — the audit covers the whole
   tree, which is the point.
5. If it is a Vercel-only API, it is rejected regardless of licence
   (`CLAUDE.md` §3).

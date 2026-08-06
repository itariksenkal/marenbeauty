# CLAUDE.md — Maren Beauty Working Agreement

This file is the permanent contract for anyone (human or agent) working in this
repository. It outranks habit, convention and personal preference. If a task
seems to require breaking a rule here, stop and raise it in
`docs/OPEN-QUESTIONS.md` instead of breaking it.

**Read before every task:** this file, then `docs/ROADMAP.md` (current
milestone only), then the doc relevant to the task.

---

## 1. What this project is

Maren Beauty — a premium boutique **beauty centre** (güzellik merkezi) in
Konya / Selçuklu, Turkey. Domain: `marenbeauty.com`.

- **Site content language: Turkish.** All user-facing copy, route slugs, and
  content files are Turkish.
- **Code language: English.** Identifiers, comments, commit messages, branch
  names, and every file in `docs/` are English.
- **It is not a medical clinic.** See §9. This constraint shapes copy, schema
  markup, imagery and information architecture. It is not negotiable.
- **The business has not opened yet.** The site ships in pre-launch mode
  (§10).

---

## 2. Stack

Pinned choices. Do not add, swap or upgrade a major dependency without an
entry in `docs/LICENSES.md` and owner sign-off.

| Concern         | Choice                                | Notes                                         |
| --------------- | ------------------------------------- | --------------------------------------------- |
| Runtime         | Node 24                               | Pinned in `.nvmrc` and `package.json#engines` |
| Package manager | npm                                   | Lockfile committed. No pnpm/yarn.             |
| Framework       | Next.js (App Router)                  | Server Components by default                  |
| Language        | TypeScript, `strict: true`            | Plus `noUncheckedIndexedAccess`               |
| Styling         | Tailwind CSS v4 (`@theme`)            | CSS-first tokens, no JS config object         |
| Components      | shadcn/ui (MIT) on Radix              | Vendored into `src/components/ui/`            |
| Icons           | Lucide (ISC)                          | No other icon set                             |
| Motion          | `motion` (MIT), `motion/react`        | See `docs/MOTION.md`                          |
| Content         | MDX + Zod frontmatter                 | Loader is ours; see §5                        |
| Mail            | Nodemailer over Google Workspace SMTP | Node runtime only, never Edge                 |
| Spam            | Altcha (MIT, proof-of-work)           | No third-party CAPTCHA                        |
| Analytics       | Self-hosted Umami, cookieless         | GA4/Pixel gated off; see §11                  |
| Fonts           | Self-hosted OFL via `next/font/local` | Zero runtime font CDN calls                   |
| Hosting         | Vercel                                | **App must stay self-hostable** — §3          |

### Licence policy

Every runtime and dev dependency must be **MIT, MIT-0, Apache-2.0, ISC, BSD-2,
BSD-3, 0BSD, CC0, Unlicense, BlueOak-1.0.0, Python-2.0, CC-BY-4.0 or
CC-BY-3.0**. Fonts may be OFL-1.1. Anything else (GPL, LGPL, AGPL, MPL, SSPL,
source-available, "free for non-commercial") requires explicit owner approval
recorded in `docs/LICENSES.md` §5.

**CC-BY is not a free pass — it obliges attribution.** Every CC-BY package is
credited by author with a licence link in the generated `NOTICE` file.

`npm run licenses` enforces all of this via `licenses.exceptions.json`. Each
exception must carry a licence, scope, reason and approval status — the audit
fails if one is missing, fails if an excepted package later **changes** licence,
and fails if `NOTICE` has drifted from the real dependency tree.

Two named exceptions are approved and stay visible on every run. They are
**not** folded into the allow-list:

| Package                    | Licence                     | Scope                                                                                |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `sharp` / `@img/sharp-*`   | LGPL-3.0-or-later (libvips) | **Production.** Unmodified, dynamically linked. Losing it means losing `next/image`. |
| `lightningcss`, `axe-core` | MPL-2.0                     | Build-time / dev only. File-level copyleft, never modified or shipped.               |

### Pinned versions — do not "upgrade" these

Both are deliberately behind `latest`. Raising either breaks tooling; clean peer
resolution beats a higher version number.

| Pin                            | Why                                                                                                                                                                                                        | Revisit when                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **TypeScript 6.0.3** (not 7.x) | `typescript-eslint` declares `typescript: ">=4.8.4 <6.1.0"`. TS 7 breaks linting.                                                                                                                          | `typescript-eslint` widens its peer range. |
| **ESLint 9.39.5** (not 10.x)   | `eslint-config-next` pulls `eslint-plugin-import`, `-jsx-a11y` and `-react`, all capped at `^9`. ESLint 10 installs only by overriding three peers, which hides the incompatibility rather than fixing it. | `eslint-config-next` updates its plugins.  |

---

## 3. Portability rule

Vercel is the deploy target, not a dependency.

- `output: 'standalone'` in `next.config.ts`.
- A working `Dockerfile` must build and run the site with no Vercel services.
- **No Vercel-only APIs.** No `@vercel/kv`, `@vercel/blob`, `@vercel/postgres`,
  `@vercel/analytics`, `waitUntil` from `@vercel/functions`, or Edge Config.
- Anything environment-specific goes behind an interface in `src/lib/` with a
  plain-Node implementation.
- If it does not run under `docker run`, it is broken.

---

## 4. Commands

```bash
npm run dev            # local dev server
npm run build          # production build (standalone output)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format:check   # prettier --check .
npm run fonts          # F1 — Turkish glyph coverage, read from the woff2 cmap
npm run guard          # repo guard rules — see §9, §12
npm run test           # vitest run (unit)
npm run test:e2e       # playwright — browser tests against the production build
npm run test:a11y      # playwright + axe on every static route
npm run licenses       # licence audit + regenerates NOTICE
npm run verify         # everything above, in order — THE gate
```

`npm run dev` then **`/styleguide`** is the design-system review surface: every
colour token with its computed contrast, the type scale set in Turkish, the
glyph specimen, spacing, radii, shadows and every control state. Development
only — it 404s in production and is `noindex` regardless.

### The verification command

**After every task, run:**

```bash
npm run verify
```

Defined as:

```
typecheck && lint && format:check && fonts && build && guard && test && test:e2e && test:a11y && licenses
```

`guard` and `test:e2e` run **after** `build`: the first inspects build output,
the second drives the site in a real browser.

`test:e2e` has **two projects**, and both matter:

| Project       | Server       | Covers                                                                                    |
| ------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `production`  | `next start` | What visitors get. Also asserts `/styleguide` 404s.                                       |
| `development` | `next dev`   | Dev-only routes, which 404 in production and are therefore invisible to every other gate. |

The `development` project exists because `/styleguide` — and the motion demo —
are dev-only. Without it, a broken design-review surface sits broken while
`npm run verify` stays green. It also catches failures that only appear before
the stylesheet lands, which is how the skip-link bug hid.

**Neither project ever reuses a running server.** A left-over server keeps
serving the previous build — or worse, a module graph it compiled while a file
was momentarily broken, which then survives the fix. That has already cost this
project a debugging session (`docs/OPEN-QUESTIONS.md` G13).

**Kill background servers when you are done with them.** On Windows `pkill` does
not reliably match them; use
`Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next|turbopack' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`.
A task is not done until `npm run verify` exits 0. Do not report completion on
a partial run, and do not weaken a rule to make it pass — fix the code or raise
the conflict.

---

## 5. Folder conventions

```
/
├─ CLAUDE.md
├─ Dockerfile
├─ .nvmrc
├─ docs/                     # English. Specs, not code.
├─ content/                  # Turkish. Authored content, no JSX.
│  ├─ services/*.mdx         # 20 files, slug = filename
│  └─ blog/*.mdx             # slug = filename
├─ public/
│  ├─ fonts/                 # OFL licence texts only — publicly reachable
│  └─ images/                # referenced ONLY via the image manifest
├─ NOTICE                    # GENERATED by npm run licenses — never hand-edit
├─ scripts/
│  └─ guard.mjs              # §12
└─ src/
   ├─ app/                   # routes only — see docs/ARCHITECTURE.md
   ├─ components/
   │  ├─ ui/                 # shadcn primitives, unstyled-ish, no business logic
   │  ├─ layout/             # header, footer, shells
   │  ├─ motion/             # every animated primitive lives here
   │  ├─ sections/           # page-level composed blocks
   │  └─ content/            # MDX renderers, prose, cards
   ├─ config/                # THE only home for tunable values — §7
   ├─ content-layer/         # MDX loading + Zod schemas + typed queries
   ├─ lib/                   # framework-agnostic helpers, pure where possible
   ├─ fonts/                 # self-hosted .woff2 — NOT public/, see below
   ├─ hooks/
   └─ styles/                # globals.css, theme.css (@theme tokens)
```

Rules:

- A component that fetches or reads content does not also animate. Split them.
- `src/lib/` must not import from `src/components/`.
- `src/components/ui/` must not import from `src/config/` or `content-layer/`.
  Primitives take props; they do not reach for data.
- Nothing outside `src/content-layer/` may read from `content/` directly.
- Nothing outside `src/config/images.ts` may reference a path in
  `public/images/`.
- **`.woff2` files live in `src/fonts/`, not `public/fonts/`.** `next/font/local`
  fingerprints and serves them from `/_next/static/media`; a copy under
  `public/` would be served raw as well, shipping every font twice. Only the
  OFL licence texts belong in `public/fonts/`, where they are publicly
  reachable — which is the point of a licence text.

---

## 6. Naming

| Thing              | Convention                           | Example                            |
| ------------------ | ------------------------------------ | ---------------------------------- |
| Component file     | `PascalCase.tsx`                     | `ServicePanel.tsx`                 |
| Non-component file | `kebab-case.ts`                      | `format-date.ts`                   |
| Directory          | `kebab-case`                         | `content-layer/`                   |
| Type / interface   | `PascalCase`, no `I` prefix          | `ServiceFrontmatter`               |
| Zod schema         | `camelCase` + `Schema`               | `serviceSchema`                    |
| Hook               | `useThing`                           | `useMotionTier`                    |
| Boolean            | `is` / `has` / `should` prefix       | `isPreLaunch`                      |
| CSS token          | `--color-*`, `--space-*`, `--ease-*` | `--color-surface-raised`           |
| Route slug         | Turkish, **ASCII-folded**, kebab     | `cilt-bakimi`                      |
| Content file       | matches its slug exactly             | `content/services/cilt-bakimi.mdx` |

**Slug rule:** Turkish characters are folded, never dropped —
`ı→i, İ→i, ş→s, ğ→g, ü→u, ö→o, ç→c`. So `Cilt Bakımı → cilt-bakimi`,
`Yaşlanma Karşıtı → yaslanma-karsiti`. Slugs are permanent; changing one
requires a redirect entry in `next.config.ts`.

---

## 7. No hardcoded values

Every value that could plausibly change lives in `src/config/`, typed.

| File            | Owns                                                       |
| --------------- | ---------------------------------------------------------- |
| `site.ts`       | Brand name, domain, locale, display address, feature flags |
| `contact.ts`    | Phone / WhatsApp / Instagram / email channels              |
| `navigation.ts` | Header, footer and mobile menu trees                       |
| `images.ts`     | The image manifest — §8                                    |
| `legal.ts`      | Legal-page placeholders and effective dates                |
| `analytics.ts`  | Analytics provider + consent flags                         |
| `motion.ts`     | Durations, easings, thresholds — §13                       |

### Contact channels

Channels are **optional and absent by default**. The type is:

```ts
type ContactChannel = { readonly value: string; readonly label: string } | null;
```

- A `null` channel renders **nothing** — no button, no icon, no placeholder,
  no disabled state, no "yakında" tooltip.
- **Never emit `href="tel:"`, `href="mailto:"`, `href="https://wa.me/"` or any
  other channel URL with an empty value.** `npm run guard` fails the build on
  an empty-target link.
- Components receive the resolved channel as a prop. They never import config
  and decide for themselves.

### Strings

No user-facing Turkish string may be written inline in a component. Copy lives
in `content/` (long form) or `src/config/` (labels, nav, CTA text). A component
containing a Turkish sentence is a bug.

---

## 8. Images

Photography arrives only after the venue opens. Until then every image is
placeholder stock, and the whole set must be swappable without touching a
single component.

- One manifest: `src/config/images.ts`. Every entry is typed:

  ```ts
  type ManagedImage = {
    readonly id: string; // stable key components reference
    readonly src: string; // path under /public/images
    readonly alt: string; // Turkish, descriptive, never empty for content images
    readonly width: number;
    readonly height: number;
    readonly credit: string | null;
    readonly licence: string; // e.g. 'Unsplash Licence', 'CC0-1.0'
    readonly sourceUrl: string | null;
    readonly replaceable: true; // false only once real photography lands
  };
  ```

- Components take an `id` and resolve through the manifest. **No component
  contains an image path.**
- Always `next/image`. Explicit `sizes`. Above-the-fold hero gets `priority`.
- One narrow visual family for launch: warm neutral interiors, soft daylight,
  shallow depth, no cool tones, no clinical white, no clutter.
- **No stock photograph of a person may be presented as the owner, a staff
  member or a client.** Faces are allowed only as clearly generic atmosphere.
- **No before/after imagery, ever** — including side-by-side layouts,
  sliders, or two images captioned to imply progression.

---

## 9. Copy rules — Turkish, enforced

Maren Beauty is a beauty centre. Turkish law reserves treatment language and
health claims for medical institutions. This applies to service pages, blog
posts, meta descriptions, alt text, schema markup, form copy and OG images —
everywhere, no exceptions.

### Blocking lexicon — build fails (16 terms)

| Never write  | Write instead                            |
| ------------ | ---------------------------------------- |
| tedavi       | bakım, uygulama                          |
| terapi       | uygulama, seans                          |
| kür          | bakım programı                           |
| iyileştirir  | görünümünü iyileştirmeye yardımcı olur   |
| yok eder     | görünümünü azaltmaya destek olur         |
| garanti      | — (no substitute; remove the claim)      |
| kesin sonuç  | — (no substitute; remove the claim)      |
| mucize       | — (remove)                               |
| kalıcı çözüm | — (remove)                               |
| kanıtlanmış  | — (remove)                               |
| %100         | — (remove)                               |
| risksiz      | — (remove)                               |
| yan etkisiz  | — (remove)                               |
| ağrısız      | — (remove; describe the session instead) |
| 1 numaralı   | — (remove)                               |
| en iyi       | — (remove; rewrite the sentence)         |

Matching is stem-based with Turkish suffixes (`tedavi` catches `tedavisi`,
`tedaviler`, `tedavide`). False positives go in
`scripts/guard.allow.json` with a one-line justification — never by
weakening the pattern.

Two deliberate strictnesses:

- **`en iyi`** also flags benign phrasing such as "en iyi şekilde desteklemek".
  Rewrite the sentence; do not add an allowlist entry.
- **`%100` is blocking** while other percentages only warn, so the guard must
  test `%100` **before** the generic percentage rule or the blocking hit is
  masked.

### Warning lexicon — reported, does not fail the build

`klinik` · `tıbbi` · `doktor kontrolünde`

**`tıbbi` must stay non-blocking.** The required disclaimer contains it:

> Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.

This is load-bearing, not a preference. A fixture test asserts that this exact
sentence passes the guard (`docs/OPEN-QUESTIONS.md` F8). Anyone promoting
`tıbbi` to blocking breaks the disclaimer and the test fails first.

### Also banned

- **Efficacy percentages and statistics.** No "%90 oranında", no
  "3 seansta", no invented survey numbers. If a number is not verifiable and
  attributable, it does not ship.
- **Fabricated social proof.** Testimonials ship as an empty array. No
  invented names, no invented ratings, no placeholder reviews — not even in
  a commented-out block.
- **Diagnosis or advice.** No "cildinizde X varsa Y yapın" framing that reads
  as clinical guidance.
- **Lorem ipsum.** Every string that ships is real Turkish copy.

### Content posture — never invent specifics

Copy stays **general and non-specific**. The business has not opened and few
operational details are confirmed.

| Never publish                                         | Why                                                       |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Session durations                                     | Not confirmed. A published duration is a promise.         |
| Product or device brand names                         | Not confirmed, and naming a device is a capability claim. |
| Staff names, credentials, qualifications              | No team is named publicly yet.                            |
| Claims about equipment                                | Unverifiable, and edges toward medical positioning.       |
| Depths, concentrations, wavelengths, machine settings | Regulatory exposure and unverifiable.                     |
| Session counts, intervals, recovery times             | Outcome promises in disguise.                             |

**Where a section would need a fact we do not have, cut the section rather than
pad it.** A shorter page that is entirely true beats a longer one padded with
plausible detail. The effort goes into design and motion quality, not into
invented detail.

### Required tone

Calm, precise, unhurried, adult. Short sentences. Second person plural
(`siz`) — warm but not familiar. Describe **what happens in the room** and
**how it feels**, not what it cures. When a benefit must be stated, phrase it
as appearance and support: "cildin nemli görünmesine destek olur", never
"cildi nemlendirir ve onarır".

Full guidance: `docs/BRIEF.md`.

---

## 10. Pre-launch mode

`site.ts` exports `isPreLaunch: boolean`. While `true`:

- No `openingHoursSpecification` in structured data. Hours are unknown.
- No `aggregateRating`, no `review`, no `priceRange`.
- No claims that depend on a Google Business Profile that does not exist.
- An honest "yakında açılıyoruz" state in the header and contact section — a
  real sentence, not a countdown, not a fake date.
- Contact copy says what actually happens: a message reaches the team and is
  answered when the centre opens.

Flipping `isPreLaunch` to `false` must not require touching any component.

---

## 11. Analytics and consent (KVKK)

- Default: **self-hosted Umami, cookieless, no consent banner required.**
- GA4 and Meta Pixel are implemented behind `analytics.ts` flags that are
  **`false` until the owner starts advertising**. While `false`, no script tag,
  no network request, no cookie — the code path must be fully absent from the
  bundle, not merely inactive.
- When enabled, they load **only after explicit opt-in**. Consent Mode v2
  defaults to denied. Rejecting is exactly as easy as accepting.
- No personal data is persisted by the contact form. It sends an email and
  forgets.

---

## 12. Guard script

`scripts/guard.mjs`, run by `npm run guard` **after `npm run build`**.

Scans build output — `.next/server/app/**/*.{html,rsc}` and
`.next/static/chunks/**/*.js` — **not** `docs/` or source. That is deliberate:
this file and `docs/` discuss the banned words openly and must never trip the
guard.

Rules, all of which fail the build with a file, line and excerpt:

**Error tier — exit non-zero:**

1. **Blocking lexicon** (§9, 16 terms) — stem + Turkish suffix matching.
2. **Unresolved tokens** — any `{{…}}` reaching output, e.g. `{{LEGAL_ENTITY}}`.
3. **Empty channel links** — `href="tel:"`, `href="mailto:"`, `href="tel:#"`,
   bare `wa.me/` with no number.
4. **Lorem ipsum** — `lorem ipsum`, `dolor sit amet`.

**Warning tier — reported, exit 0:**

5. **Warning lexicon** (§9) — `klinik`, `tıbbi`, `doktor kontrolünde`.
6. **Percentage claims** — `%\d`. Reviewed by hand before merge. Note `%100` is
   rule 1, and is tested **before** this rule so the blocking hit is not masked
   by the warning.

Exit non-zero on any error-tier hit. Print every violation of either tier, not
just the first. `scripts/guard.allow.json` ships empty — the exception
mechanism exists but is deliberately unused.

### Four implementation details that are load-bearing

**Word boundaries are Unicode-aware, not `\b`.** JavaScript's `\b` is ASCII-only
and treats `ü` as a _non-word_ character, so `/\bkür/` matches inside `şükür`.
The guard uses `(?<![\p{L}\p{N}])` / `(?![\p{L}\p{N}])` with the `u` flag.
Reverting this reintroduces false positives on ordinary Turkish words.

**`kür` uses an explicit suffix whitelist**, not a greedy one. Greedy matching
would flag `kürk` (fur), `kürek` (oar) and `küresel` (global). Every other stem
is unambiguous enough for greedy suffixes.

**Percentage rules are text-only.** They scan `.html`/`.rsc` but not `.js`,
because minified framework code is full of `n%100` modulo arithmetic — a guard
that fails the build when the framework formats a number is a guard nobody
trusts. Rule 2 is likewise narrowed in JavaScript to SHOUTING tokens, since
`{{` is ordinary syntax there.

**Escaped text is decoded before matching** — `\uXXXX` and HTML entities — so a
banned word cannot slip through as `tedav\u0069`. Decoding is line-preserving,
so reported line numbers stay true.

### Channel-link contract

Rule 3 checks anchors two ways: any bare-scheme `href` (`tel:`, `mailto:`,
`sms:`, a numberless `wa.me/`) in either HTML or RSC-payload form, **and** any
`<a>` carrying `data-channel` whose href is `#` or empty.

So every contact-channel link must carry
`data-channel="whatsapp|phone|email|instagram"`. That attribute is what lets the
guard tell a dead channel button from an ordinary in-page anchor. Components
built at M11 must set it.

---

## 13. Motion budget

Authoritative spec: `docs/MOTION.md`. The hard limits:

- **No discrete transition exceeds 400ms.** Scroll-linked animation has no
  duration but its smoothing/settle must stay ≤200ms.
- **Only `transform`, `opacity`, `clip-path` and `filter` are animated.** Never
  `width`, `height`, `top`, `left`, `margin`, or `background-position`.
- **`prefers-reduced-motion: reduce` is honoured everywhere.** Reduced means
  the final state, immediately — not a faster animation.
- **Scroll is never hijacked.** Native scrolling is preserved; only animation
  _progress_ is bound to scroll position. No scrolljacking, no forced snapping,
  no `preventDefault` on wheel or touch.
- **Exactly five signature interactions and one grain overlay.** Adding a sixth
  requires owner approval. Decoration is not a feature.
- **Pinned storytelling in exactly two places** — the hero→brand-story opening
  and the process section. Nowhere else.
- Degrade to static on low-end devices via `useMotionTier()`.
- Every animated element must be GPU-composited. If it triggers layout or
  paint on scroll, it does not ship.

---

## 14. Styling rules

- **No inline hex colours. No `rgb()`, `hsl()`, `oklch()` literals in
  components.** Every colour is a semantic token from `docs/DESIGN-SYSTEM.md`,
  used as a Tailwind utility or `var(--color-*)`.
- Use **semantic** tokens (`text-secondary`, `surface-raised`), not primitives
  (`cocoa`, `ivory`). This is enforced structurally, not by review: primitives
  are declared as `--mb-*`, outside every Tailwind namespace, so **no utility is
  generated for them**. `bg-ivory` does not exist and never compiles.
- Tailwind's default palette, type scale, spacing, radii, shadows and easings
  are cleared with `*: initial` in `theme.css`. `bg-red-500` and the stock
  `text-lg` do not exist either. If a utility you expect is missing, the value
  is missing from the design system — add it there, deliberately.
- No arbitrary values for spacing, radius, shadow or type — no
  `p-[13px]`, no `text-[17px]`. If the scale lacks it, the scale is wrong;
  change the scale deliberately.
- Arbitrary values are permitted **only** for genuinely one-off geometry
  (a specific `clip-path`, a gradient stop position), with a comment saying why.
- `color-scheme: light`. **No dark mode.** Every colour is nonetheless a
  semantic token so a dark theme stays addable without refactoring.
- Class order is enforced by `prettier-plugin-tailwindcss`. Do not hand-sort.
- `cn()` from `src/lib/cn.ts` for conditional classes. No string concatenation.

---

## 15. TypeScript rules

- `strict: true`, `noUncheckedIndexedAccess: true`, `noEmit`.
- **No `any`.** No `as` casts to silence an error — narrow properly. `unknown`
  plus a Zod parse at every boundary.
- Config and content objects are `readonly` / `as const`.
- Every external input (frontmatter, form body, env vars) is validated with Zod
  at the boundary. Env vars go through one `src/config/env.ts` that parses
  `process.env` once and throws at startup on a missing required value.
- Server Components by default. `'use client'` only when a component needs
  state, effects, or browser APIs — and then as deep in the tree as possible.
- No default exports except where Next.js requires them (`page.tsx`,
  `layout.tsx`, `route.ts`, `error.tsx`, `not-found.tsx`).

---

## 16. Accessibility

Non-negotiable, and ranked above visual polish and Lighthouse scores.

- Semantic HTML first. `<div onClick>` is never acceptable.
- One `<h1>` per page; heading levels never skip.
- Visible focus on every interactive element, using the focus-ring token
  (≥3:1 against every surface it can appear on — verified in
  `docs/DESIGN-SYSTEM.md`).
- Body text meets WCAG AA 4.5:1; large text and UI boundaries meet 3:1. Only
  the pairings listed as permitted in `docs/DESIGN-SYSTEM.md` may be used.
- All content images have meaningful Turkish `alt`. Decorative images have
  `alt=""` and `aria-hidden`.
- Forms: real `<label>`s, `aria-describedby` for hints and errors, errors
  announced politely, never colour-only signalling.
- Keyboard-complete: every flow works without a mouse. Skip link to `#main`.
- `<html lang="tr">`.
- Animation never conveys information that is unavailable when it is disabled.

---

## 17. Git

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Conventional Commits, English, imperative: `feat(services): add sticky panel stack`.
- One milestone per branch. Commit only when `npm run verify` passes.
- Never commit `.env*`, real credentials, or client photographs.
- Do not touch DNS, Vercel project settings, or the Google Workspace console.
  Those are the owner's; `docs/DEPLOY.md` is a checklist for a human.

---

## 18. Never do

1. Never write medical, treatment or efficacy claims (§9).
2. Never invent a statistic, percentage, testimonial, review, rating or author
   name.
3. Never ship lorem ipsum or English placeholder copy.
4. Never hardcode a colour, spacing value, string, phone number, URL or image
   path in a component.
5. Never render a contact link with an empty target.
6. Never invent the legal entity name — use `{{LEGAL_ENTITY}}`.
7. Never guess the street address, opening hours or a launch date.
8. Never add before/after imagery or any layout implying it.
9. Never use a stock photo of a person as the owner, staff or a client.
10. Never add a dependency outside the licence policy (§2).
11. Never introduce a Vercel-only API (§3).
12. Never exceed the motion budget or hijack scroll (§13).
13. Never disable a lint rule, weaken a guard pattern, or add `// @ts-expect-error`
    to make `verify` pass.
14. Never do more than one roadmap milestone per session.
15. Never mark work complete on a partial `npm run verify`.

---

## 19. Definition of done

A task is done when **all** are true:

- [ ] `npm run verify` exits 0.
- [ ] Every new string is real Turkish copy from `content/` or `src/config/`.
- [ ] Every new colour, space and radius is a token.
- [ ] Every new image goes through the manifest with licence recorded.
- [ ] Keyboard-navigable, focus-visible, screen-reader sane.
- [ ] `prefers-reduced-motion` verified by hand.
- [ ] Works at 320px, 768px, 1280px and 1920px.
- [ ] Anything uncertain is written into `docs/OPEN-QUESTIONS.md` rather than
      guessed.
- [ ] The roadmap milestone's acceptance criteria are met — all of them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

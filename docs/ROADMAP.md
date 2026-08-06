# ROADMAP — Maren Beauty

Ordered milestones. **One milestone per session** (`CLAUDE.md` §18.14). Do not
start the next one because the current one finished early — stop, report, let
the owner review.

Each milestone states its goal, the files it touches, acceptance criteria that
are all binary, and the exact verification command. A milestone is done only
when every box is ticked and the command exits 0.

**Status legend:** ☐ not started · ◐ in progress · ☑ done

---

## M0 — Repository foundation ☑ **DONE 2026-08-06**

**Goal.** A Next.js App Router project that builds, typechecks, lints and
formats cleanly on Node 24, with the licence policy enforced. No design, no
content, no components.

**Files touched** — as planned, plus four additions noted below.

```
package.json  package-lock.json  .nvmrc  tsconfig.json
next.config.ts  eslint.config.mjs  .prettierrc  .prettierignore  .editorconfig
.gitignore  .env.example  Dockerfile  .dockerignore
postcss.config.mjs                       ← added: Tailwind v4 requires it
scripts/stub.mjs                         ← added: test / test:a11y placeholders
scripts/guard.mjs                        ← added: guard placeholder, self-failing
scripts/licenses.mjs                     ← added: see G4
licenses.exceptions.json                 ← added: see G4 / E4
src/app/layout.tsx  src/app/page.tsx  src/styles/globals.css
```

**Acceptance criteria**

- [x] `.nvmrc` contains `24`; `package.json#engines.node` is `>=24 <25`.
- [x] `tsconfig.json` has `strict: true` **and** `noUncheckedIndexedAccess: true`.
      Next.js rewrote `jsx` to `react-jsx` on first build; both required flags
      survived.
- [x] `next.config.ts` sets `output: 'standalone'`. Also carries the apex
      canonical redirect (C2).
- [x] ESLint flat config; `prettier-plugin-tailwindcss` installed and ordering
      classes — **verified against a probe file**:
      `p-4 flex text-sm items-center bg-white` → `flex items-center bg-white p-4 text-sm`.
- [x] ESLint `no-restricted-syntax` rule rejects numeric duration literals in
      `src/components/` (`docs/MOTION.md` §7) — **verified**: a probe with
      `duration: 0.6` and `delay: 120` produced 2 errors. Probe deleted.
- [x] `<html lang="tr">` in the root layout.
- [x] `.env.example` lists every variable with a comment; no real secret in git.
      `SMTP_USER` / `MAIL_FROM` / `MAIL_TO` all `info@marenbeauty.com` (B1).
- [x] Every npm script from `CLAUDE.md` §4 exists. `guard`, `test` and
      `test:a11y` are stubs that **announce themselves loudly**; `guard`
      additionally **fails the build** the moment `content/**/*.mdx` exists, so
      it cannot silently pass once it becomes load-bearing — verified both ways.
- [x] `npm run licenses` passes, and `docs/LICENSES.md` §3.0 now holds **actual
      audit output**: 474 packages, 454 conforming, 20 exceptions.
      The policy as written was not satisfiable by this stack; nothing was
      widened silently. **Ruled at M1 — see `docs/OPEN-QUESTIONS.md` E4:** four
      permissive licences added to the allow-list, `sharp` and `lightningcss`
      approved as named exceptions, CC-BY admitted on condition that a generated
      `NOTICE` ships. Now 476 packages, **0 violations**.
- [x] Initial commit on `main`, pushed.

**Deviations, all recorded in `docs/OPEN-QUESTIONS.md`**

- **TypeScript 6.0.3, not 7.0.2** (G1) — `typescript-eslint` peers cap at `<6.1.0`.
- **ESLint 9.39.5, not 10.8.0** (G3) — `eslint-config-next`'s plugins cap at `^9`.
- **`licenses` is a wrapper script**, not the raw `--onlyAllow` CLI (G4) — the
  raw flag exits on the first violation and would have hidden 19 of the 20
  findings.

**Verify** — `npm run verify` (the full gate) exits **0**.

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build && npm run licenses
```

---

## M1 — Design tokens, fonts, layout shell ☑ **DONE 2026-08-06**

**Goal.** `docs/DESIGN-SYSTEM.md` expressed as code. Header, footer, container,
section, skip link. Nothing else renders.

**Files touched** — as planned, plus the additions noted below.

```
src/styles/theme.css  src/styles/globals.css
src/app/layout.tsx  src/app/fonts.ts
src/fonts/*.woff2                        ← NOT public/fonts, see deviations
public/fonts/OFL-fraunces.txt  public/fonts/OFL-manrope.txt
src/components/layout/{SiteHeader,SiteFooter,SkipLink,Container,Section}.tsx
src/lib/cn.ts
src/lib/contrast.ts                      ← added: styleguide computes ratios
src/config/ui.ts                         ← added: shell strings, see deviations
src/app/styleguide/{page.tsx,tokens.ts}  ← added: the review surface
scripts/verify-fonts.mjs                 ← added: F1 as a hard gate
NOTICE  licenses.exceptions.json  scripts/licenses.mjs   ← E4 rulings
```

**Acceptance criteria**

- [x] Every token in `docs/DESIGN-SYSTEM.md` §1–§7 exists in the `@theme` block,
      primitives and semantics both. Presence verified in the **built CSS**, not
      the source.
- [x] `color-scheme: light` set; no dark-mode media query anywhere.
- [x] Fraunces + Manrope self-hosted via `next/font/local`, `woff2`, subset
      `latin` + `latin-ext`. **Zero network requests to any font host** —
      verified by grepping the entire build output for `gstatic`/`googleapis`:
      0 hits, and all four faces resolve to `/_next/static/media/*.woff2`.
- [x] **F1 — Turkish glyphs. HARD GATE, PASSED.** `npm run fonts` decodes each
      shipped `.woff2`, reads the real `cmap` and asserts all 20 required
      codepoints. Both families pass. Wired into `npm run verify`, so a future
      font change that drops `ğ` fails the build.
- [x] Skip link is the first focusable element and moves focus to `#main`.
- [x] Focus ring uses `--color-focus-ring` and is visible on every surface —
      `clay` clears 3:1 against all six, shown computed in `/styleguide` §4.
- [x] Zero hex literals outside `theme.css` — grep clean across `src/**`
      (`.ts`, `.tsx`, `.css`). All 18 colour primitives live in `theme.css`.
- [x] Review surface exists: **`/styleguide`**, dev-only, `noindex`, and it
      **404s in production** — verified in the production build output.

**Additional scope, as instructed**

- [x] F1 promoted from a note to a hard gate (above).
- [x] `/styleguide` renders the full system on one page: primitives, every
      colour token with **computed** contrast against each surface, the type
      scale set in Turkish, the glyph specimen at display and body sizes,
      spacing, radii, shadows, and every button/input state. It reads
      `theme.css` at build time, so it cannot drift from what ships.

**Deviations, all recorded in `docs/OPEN-QUESTIONS.md`**

- **`.woff2` in `src/fonts/`, not `public/fonts/`** — `next/font/local`
  fingerprints and serves them from `/_next/static/media`; a copy under
  `public/` ships every font twice. Only the OFL texts stay in `public/fonts/`,
  where a licence text belongs. `CLAUDE.md` §5 updated.
- **`src/config/ui.ts` added** — the shell needs a skip-link label, and
  components may not contain Turkish (`CLAUDE.md` §7). Ten lines; M2 folds it
  into `site.ts` / `navigation.ts` and deletes it.
- **The throwaway swatch route was replaced, not deleted** — the original
  criterion said to delete it; the owner asked for a permanent `/styleguide`
  review surface instead.
- **Buttons and inputs in `/styleguide` are specimens, not primitives** — the
  real `components/ui/` primitives arrive with shadcn later and must match
  them. Building them now would pre-empt that milestone.
- **G5 / G6** — two silent failures found and fixed: `max-w-prose` resolving to
  Tailwind's 65ch instead of our 68ch, and `next/font` dropping a
  `unicode-range` passed via a constant.

**Two findings worth carrying forward**

- Fraunces ships `wght` default **900** and `WONK` default **1**. Using the
  family without correcting both gives a black, quirky display face. Corrected
  in `globals.css`; `opsz` deliberately left out of `font-variation-settings`
  so `font-optical-sizing: auto` keeps working.
- Fraunces is **226 KB** across both subsets because it keeps all four axes.
  Pinning `opsz` measures at 122 KB but costs optical sizing over a 30–240px
  range. Not taken silently — recorded as an M15 performance decision.

**Follow-up applied 2026-08-06 (carried into M2's session)**

- **Skip link rewritten.** It was hidden with `sr-only`, which depends entirely
  on the stylesheet. In dev, Turbopack injects CSS via JS, so for the first
  few hundred ms the link rendered `position: static` in normal flow — a stray
  visible link above the header, measured at `y: 8, height: 17`. Now positioned
  and hidden by **inline critical CSS hoisted into `<head>`**, so it is out of
  the viewport from the first paint and would stay hidden even if the
  stylesheet 404'd. Appearance still comes from tokens.
- **Duplicate `<main id="main">` removed.** The M0 placeholder page rendered its
  own `<main>` inside the layout's, producing two landmarks and a duplicate id.
  The layout owns it.
- **Four browser tests added** (`tests/e2e/skip-link.spec.ts`), including one
  that loads the page **with the stylesheet blocked**. That one fails on the
  old implementation with exactly the reported symptom, and is what makes this
  a regression test rather than a snapshot of current behaviour.

**Verify** — `npm run verify` exits **0**.

```bash
npm run verify
```

---

## M2 — Config layer ☑ **DONE 2026-08-06**

**Goal.** Every tunable value has a typed home. No component yet reads a literal.

**Files touched**

```
src/config/{site,contact,navigation,images,legal,analytics,motion,env,testimonials}.ts
src/lib/slug.ts
src/lib/slug.test.ts       ← added: the 20-name slug table
src/config/motion.test.ts  ← added: motion.ts vs theme.css drift guard
vitest.config.mts          ← added: unit test runner
```

**Acceptance criteria**

- [x] `site.ts` matches `docs/ARCHITECTURE.md` §3.8, `isPreLaunch: true`, and
      `address` has **no** `streetAddress` field at all — verified at runtime:
      keys are exactly `["locality","region","country"]`.
- [x] `contact.ts` — all four channels `null`, `ContactChannel` exactly as
      `CLAUDE.md` §7. Typed as `Record<Key, ContactChannel>` rather than
      inferred from the literals, so consumers stay nullable-typed instead of
      narrowing to `null` and making every guard look like dead code.
      `channelHref()` returns `string | null` — **never a bare scheme**, so a
      caller cannot accidentally emit `href="tel:"`.
- [x] `images.ts` exports a typed, empty-but-valid manifest with the
      `ManagedImage` shape including `licence` and `replaceable`. `getImage()`
      throws on an unknown id so a bad reference fails static generation rather
      than rendering a broken box.
- [x] `testimonials.ts` exports `[]` with the full `Testimonial` type declared,
      including a required `consentGiven: true` — publishing someone's words
      without recorded consent is a KVKK problem, so the type will not allow it.
- [x] `env.ts` parses `process.env` with Zod and throws with every missing
      variable named — verified by running it with an empty environment.
- [x] `motion.ts` re-exports the CSS motion tokens; **no duration literal
      appears anywhere else** — grep clean across `src/**` outside `motion.ts`
      and its test.
- [x] `slugify()` folds `ı İ ş ğ ü ö ç` correctly and is unit-tested against all
      20 service names. **71 unit tests pass.**
- [x] **M1's `src/config/ui.ts` folded in and deleted, as promised.** The brand
      name is `site.name`; the two shell labels are `chrome` in
      `navigation.ts`. No component imports a strings file of its own.

**Two things worth carrying forward**

- **`env.ts` is split into eager public / lazy server tiers.** Secrets are
  parsed on first access and memoised — still exactly once — because
  `next build` evaluates route modules during route collection, so an eager
  parse of required secrets would make a local build impossible without a
  populated `.env.local`. That is a worse failure than the one it prevents.
  M11's contact route calls `assertServerEnv()` at module scope, so a
  misconfigured deployment still fails immediately rather than silently
  accepting submissions it cannot deliver. Recorded as G7.
- **`motion.ts` and `theme.css` hold the same values twice** — CSS cannot be
  read by the `motion` library, and vice versa. The drift risk is closed rather
  than tolerated: `motion.test.ts` parses `theme.css` and asserts every
  duration, easing, stagger and transform matches. Change one without the other
  and the test fails.

**Verify** — `npm run verify` exits **0**.

```bash
npm run verify
```

---

## M3 — Content guard script ☑ **DONE 2026-08-06**

**Goal.** The build refuses to ship banned language, unresolved tokens or dead
links. Built before any content exists, so no bad copy can ever land.

**Files touched**

```
scripts/guard.mjs  scripts/guard.allow.json
tests/unit/guard.test.ts   ← added: 62 fixture tests
package.json  .github/workflows/ci.yml
docs/OPEN-QUESTIONS.md
```

**Acceptance criteria**

- [x] Scans `.next/server/app/**/*.{html,rsc}` and
      `.next/static/chunks/**/*.js`. **Does not scan `docs/` or source.**
      28 build artefacts scanned on a clean run.
- [x] Rule 1 — **blocking lexicon, all 16 terms**, each with its own fixture
      test. Catches `tedavisi`/`tedaviler`/`tedavide`, and does **not** flag
      `kürk`, `kürek`, `şükür`, `küresel`, `küre`, `kürkçü`, `kürekçi` (F7).
- [x] Rule 2 — `{{…}}` in output fails the build.
- [x] Rule 3 — empty-target links fail, in both HTML and RSC-payload form.
- [x] Rule 4 — `lorem ipsum` / `dolor sit amet` fail.
- [x] Rule 5 — warning lexicon `klinik`, `tıbbi`, `doktor kontrolünde`
      reported, exit 0.
- [x] Rule 6 — `%\d` warns, tested **after** rule 1, so `%100` reports as
      blocking and is not masked (F9). Verified both ways: a line containing
      `%100 etkili, nem %30 arttı` yields exactly one blocking hit and exactly
      one warning.
- [x] **F8 — the C9 disclaimer passes unmodified.** Fixture test on the exact
      sentence: no blocking violation, exactly one advisory hit (`tıbbi`).
- [x] Reports **every** violation with file, line, column, excerpt and tier.
      Demonstrated end-to-end against a deliberately bad page: 13 blocking
      violations reported in one run, exit 1.
- [x] `guard.allow.json` supports exact-phrase exceptions; an entry without a
      `reason` is rejected. **Ships empty**, and a test asserts it stays empty.
- [x] Fixture tests: a clean page passes, a bad page fails on every rule.
      **62 guard tests; 133 unit tests total.**
- [x] CI runs `npm run verify` on every push and pull request.

**Four decisions worth carrying forward**

- **Unicode word boundaries, not `\b`.** JavaScript's `\b` is ASCII-only and
  treats `ü` as a non-word character, so `/\bkür/` matches inside `şükür` —
  a test asserts the naive form fails and ours does not. This is the single
  detail that separates a working Turkish guard from one that flags ordinary
  words.
- **`kür` takes an explicit suffix whitelist** while every other stem uses a
  greedy suffix, because greedy matching flags `kürk`, `kürek` and `küresel`.
- **Percentage rules are text-only.** Minified framework code is full of
  `n%100` modulo arithmetic; failing a build on that would make the guard
  untrustworthy. Rule 2 is narrowed in JavaScript for the same reason — `{{`
  is ordinary syntax there.
- **Escaped text is decoded before matching**, so `tedav\u0069` cannot slip
  through. Line-preserving, so reported line numbers stay true.

**New contract for M11:** every contact-channel link must carry
`data-channel="whatsapp|phone|email|instagram"`. That attribute is how rule 3
distinguishes a dead channel button from an ordinary in-page anchor. Recorded
in `CLAUDE.md` §12.

**Verify** — `npm run verify` exits **0**.

```bash
npm run build && npm run guard && npm run test
```

---

## M4 — Content layer ☑ **DONE 2026-08-06**

**Goal.** MDX + Zod + referential integrity. Two throwaway fixture files prove
the pipeline; real content comes later.

**Files touched**

```
src/content-layer/{schemas,load,mdx,integrity,services,posts,index}.ts
src/lib/{date,reading-time}.ts
content/services/ornek-hizmet.mdx   ← renamed from _fixture, see deviations
content/blog/ornek-yazi.mdx         ← deleted at M8/M10
src/config/images.ts                ← one fixture entry, deleted at M8
tests/unit/content-layer.test.ts    ← added: 42 tests
```

**Acceptance criteria**

- [x] Schemas match `docs/ARCHITECTURE.md` §3.1 and §3.3, including
      `author: z.literal('PENDING')` and `durationLabel` nullable. Both are
      `.strict()`, so an authored `readingMinutes` or a typo'd key is an error.
- [x] MDX compiles through `@mdx-js/mdx` `evaluate()` in a Server Component.
      **`next-mdx-remote` is not installed** — asserted by a test that reads
      `package.json`, not just by intention.
- [x] Invalid frontmatter fails the **build**, naming the file and every
      offending field. **Proven end to end:** a deliberately broken fixture
      produced
      `Invalid frontmatter in content/services/ornek-hizmet.mdx: group … order …`
      and `next build` exited 1.
- [x] **All seven** integrity checks implemented, each proven by a failing
      fixture test. Integrity failure also proven against `next build`: two
      dangling references reported together, exit 1.
- [x] `readingMinutes` computed from the body, never authored.
- [x] Content read once at module scope; the full query API from §4 exists.
- [x] Nothing outside `src/content-layer/` reads from `content/` — enforced by
      a test that walks `src/**` and greps, not by convention.

**Corrections made to the docs**

- **Seven integrity checks, not six.** `docs/ARCHITECTURE.md` §3.4 always
  listed seven bullets; this milestone's criterion said "six". The doc is now
  an explicit numbered table with stable check ids.
- **Check 5 is services-only.** Applying "filename equals `slugify(title)`" to
  posts would reject every post in `docs/CONTENT-PLAN.md` §4, whose slugs are
  deliberately shorter than their titles. Posts are still covered by check 4.
- **Check 7 scans MDX bodies** for `/blog/<slug>` links, since there is no
  explicit post-to-post reference field. Without that it would have been a
  vacuous check that could never fire.

**Deviations**

- **Fixtures renamed** `_fixture.mdx` → `ornek-hizmet.mdx` / `ornek-yazi.mdx`.
  A leading underscore is not a valid slug, so the original name would have
  forced either weakening slug validation or special-casing the loader — both
  worse than renaming a file that is deleted at M8 anyway.
- **One fixture entry added to `src/config/images.ts`**, so the fixtures'
  `heroImageId` resolves and integrity check 3 is exercised end to end rather
  than only in a unit test. Marked in the file and deleted with the fixtures.
- **`z.iso.date()`** rather than `z.string().date()` — the Zod 4 form. The
  loader also normalises YAML's automatic `Date` conversion back to an ISO
  string, so frontmatter dates never need quoting. That matters because the
  owner will eventually write this frontmatter herself.

**One thing to be precise about**

Invalid content fails `next build` **only once a route imports the content
layer**, which happens at M8. That was verified by temporarily adding the
import — both failure modes above were reproduced against a real build.

Today the guarantee still holds, via a different gate: `npm run test` imports
the content layer at module scope, so invalid content fails `npm run verify`
and therefore CI. From M8 it fails `next build` directly as well.

**Verify** — `npm run verify` exits **0**. 179 unit tests, 4 browser tests.

```bash
npm run verify
```

---

## M5 — Motion foundation ☑ **DONE 2026-08-06**

**Goal.** Motion tier resolution, aurora, grain, and the reusable primitives —
on a demo route.

**Files touched**

```
src/components/motion/{MotionTierProvider,AuroraBackground,GrainOverlay,
                       PinnedSequence,StickyPanelStack,TextReveal,
                       ImageReveal,ViewTransitionLink,motion-tier-script}.tsx
src/hooks/{use-motion-tier,use-scroll-progress,use-reduced-motion}.ts
src/lib/css-vars.ts            ← added: typed CSS custom properties
src/app/layout.tsx  src/styles/theme.css  public/grain.png
src/app/motion/page.tsx        ← KEPT, not deleted — see scope change
tests/unit/motion.test.ts                  ← 25 contract tests
tests/e2e/development/motion.spec.ts       ← 10 browser tests
```

**Acceptance criteria**

- [x] Tier resolved **before first paint** by an inline script writing
      `data-motion-tier` on `<html>`. Asserted in a browser at
      `waitUntil: 'commit'`, i.e. as early as the document exists.
- [x] `?motion=static|reduced|full` overrides in development, **ignored in
      production** — the flag is substituted at build time, so the branch is a
      literal `false` and disappears. Asserted both ways.
- [x] Aurora: 3 blobs, blur set once and **never animated** (asserted by
      comparing computed `filter` before and after a real scroll), `contain`
      applied, `will-change` dropped on scroll idle.
- [x] Grain: pre-rendered 160px tile, **4% verified from computed style**,
      `pointer-events: none`, `aria-hidden`, **no `mix-blend-mode`**, no SVG
      filter. All asserted, with CSS comments stripped first so the file's own
      explanation cannot satisfy the check.
- [x] `PinnedSequence` uses `position: sticky` + `100svh`. **No wheel,
      touchmove or touchstart listener exists anywhere in `src/`**, nothing
      calls `preventDefault` near a scroll event, the one scroll listener is
      `passive: true`, and no smooth-scroll library is installed — four
      separate tests.
- [x] `TextReveal` takes an **array of authored lines**; no runtime measurement
      or splitting anywhere.
- [x] `ViewTransitionLink` feature-detects `document.startViewTransition`,
      falls back to a plain link, applies `view-transition-name` only to the
      activated element, and clears it in a `finally` so a leaked name cannot
      break the next transition.
- [x] **Composite-only scrolling — measured, not claimed.** CDP
      `Performance.getMetrics` reads `LayoutCount` before and after twelve real
      scroll events; the assertion is that layouts do not scale with scroll.
- [x] Every primitive verified at all three tiers, in a browser.

**Scope change, as instructed**

The criterion said _"demo route deleted before commit"_. The owner asked
instead for a **real review surface**, so `/motion` is kept — dev-only, 404 in
production, `noindex`, and covered by the `development` Playwright project so
it cannot quietly break.

It shows: grain on/off pairs over ivory, rose beige, nude and espresso at the
shipping 4%; the aurora frozen at four scroll positions plus live behind the
page; rose applied per `docs/DESIGN-SYSTEM.md` §1.7 (large fill, tinted card,
divider, image overlay); all three tiers side by side; the pinned sequence; the
sticky panel stack; and the motion budget as numbers.

**Three bugs found while building it**

- **A render prop cannot cross the Server → Client boundary.** `PinnedSequence`
  originally took `children` as a function of scroll progress, which threw
  _"Functions are not valid as a child of Client Components"_. Children are now
  plain `ReactNode` and descendants read `usePinnedProgress()` — otherwise
  every caller would have had to become a Client Component.
- **Hydration mismatch on `<html>`.** The inline script writes
  `data-motion-tier` before hydration, so the client tree legitimately differs.
  Fixed with `suppressHydrationWarning` on `<html>` — the React-sanctioned way
  to say so — and by making `MotionTierProvider` render its scoped attribute
  **only for a forced tier**, so the root provider no longer duplicates it.
- **`setState` inside an effect** in two hooks. Rewritten with
  `useSyncExternalStore`, which is the correct pattern for `matchMedia` and for
  a DOM attribute, and gets the server snapshot right rather than correcting
  after hydration. Not silenced with a disable.

**One deviation**

`src/lib/css-vars.ts` was added so CSS custom properties can be typed in a
`style` prop. The usual workarounds are `as any` or an eslint-disable, both
banned (`CLAUDE.md` §15, §18.13), and neither is necessary.

**Verify** — `npm run verify` exits **0**. 204 unit tests, 20 browser tests.

```bash
npm run verify
```

---

## M6 — Home: pinned opening ☑ **DONE 2026-08-06**

**Goal.** The five-stage water sequence — the first thing anyone sees.

**Files touched**

```
src/app/page.tsx
src/components/sections/{HeroWater,BrandStory}.tsx
src/components/motion/WaterForm.tsx
src/components/motion/TextReveal.tsx      ← progress-driven mode added
src/components/layout/SiteHeader.tsx      ← receiving half of the handoff
src/config/home.ts                        ← ALL copy, placeholder
src/config/site.ts                        ← site.wordmark
src/hooks/use-media-query.ts  src/styles/theme.css
tests/e2e/production/hero.spec.ts                     ← 10 tests
tests/e2e/production-reduced/hero-reduced-motion.spec.ts ← 2 tests
```

**Acceptance criteria**

- [x] All five stages implemented at the progress ranges in `docs/MOTION.md` §4.
- [x] Wordmark handoff is a **cross-fade between two elements**, not a DOM move.
      The hero publishes `--hero-handoff` on `<html>`; the header reads it and
      needs no knowledge of the hero. Asserted, including that no `h1` ever ends
      up inside the header.
- [x] **Correct after a mid-page refresh** — the hero seeds from the current
      scroll position, not from zero. Asserted by scrolling to 0.75, reloading,
      and checking the state survived.
- [x] Pinned distance **300svh desktop / 180svh below 768px**, both measured
      against the viewport in a browser. Stages 2–3 overlap on mobile.
- [x] Brand story lines are authored arrays; the text is **in the DOM from
      first paint** — asserted at `domcontentloaded`, before any reveal — and
      only `clip-path`/`transform` change, so find-in-page locates it.
- [x] Stages not yet reached are `inert`, and nothing is inert once the
      sequence completes. `inert` does not hide text from find-in-page, which
      is why it is the right tool here.
- [x] Keyboard traversal is sane: focus never lands on the withheld header
      wordmark, which is `visibility: hidden` rather than merely transparent.
- [x] **No horizontal scroll at 320px**, checked at four points through the
      sequence.
- [x] The stage is exactly one viewport tall and sized in `svh`, which is what
      stops it jumping when mobile chrome collapses. (The no-jump behaviour
      itself remains a manual check on a real device — a headless browser has
      no dynamic chrome.)
- [x] Reviewed at `reduced` **as a composition**: no pinning, every line
      visible and unclipped, header wordmark present, nothing inert.

**Copy, as instructed**

Real Turkish, and **placeholder pending the owner's approval**
(`docs/OPEN-QUESTIONS.md` C10). It lives entirely in `src/config/home.ts`; no
component contains a sentence.

It states nothing about the business that is not already confirmed — no team,
no room, no services, no durations, no opening date beyond "yakında". It says
only where the name comes from, the category, the district, and that the centre
is not open yet. The district is interpolated from `site.address` and a test
asserts it still appears, so the first screen anyone sees cannot carry a stale
location.

**Three test-harness bugs found — each would have made a green run meaningless**

- **`scroll-behavior: smooth` made the scroll helper lie.** `window.scrollTo`
  animated, successive calls interrupted each other, and the page never arrived
  where the test believed. Four tests "passed" against a page still at scroll 65. Fixed with `behavior: 'instant'`.
- **`waitUntil: 'commit'` returns before `<body>` exists**, so the
  first-paint assertion was reading the inline script rather than the copy.
- **`use: { reducedMotion: 'reduce' }` had no effect** at describe, file OR
  project level. Probed directly: `matchMedia` still reported `false`, so the
  reduced-motion tests were running against the full tier while claiming
  otherwise — worse than not having them. Now applied with
  `page.emulateMedia()` in a `beforeEach`, which is verifiable. Once it worked,
  it immediately caught the SSR tier bug below.

**A real bug the tests exposed: SSR always assumes the `full` tier**

The server cannot know the motion tier, so it renders the full-tier structure —
a pinned wrapper, a sticky stage, reveal lines carrying inline `clip-path`, and
`inert` on unreached stages. React corrected all of it on hydration, but a
**reduced-motion visitor saw a pinned, clipped page until then.** The failing
test was right and the implementation was wrong.

Fixed two ways, both taking effect before hydration:

- **CSS tier correction.** `[data-motion-tier='reduced'|'static']` branches
  un-pin the sequence and un-clip the reveal lines from the first paint. The
  tier attribute is written by the inline script, so this is correct before any
  JavaScript runs. `!important` is required to override the animation library's
  inline styles — the narrow, correct use of it.
- **`inert` applied imperatively**, from a module-level helper after mount,
  rather than as React state. State-driven `inert` shipped in the HTML; now the
  markup a reduced-motion visitor receives never had it at all.

**One more hygiene fix**

`free-ports.mjs` now also runs as `posttest:e2e`. Playwright does not shut its
dev webServer down cleanly on Windows, so a run left a stray behind that broke
the next one.

**Verify** — `npm run verify` exits **0**. 204 unit tests, 32 browser tests.

```bash
npm run verify
```

---

## M7 — Home: remaining sections ☑ **DONE 2026-08-06**

**Goal.** Sticky service panels, the second and final pinned sequence, blog
teaser, location, contact CTA.

**Files touched**

```
src/components/sections/{ServicesPanels,ExperienceProcess,BlogTeaser,
                         LocationCard,ContactCta,TestimonialsSection}.tsx
src/components/layout/{PreLaunchBand,Section}.tsx
src/components/motion/StickyPanelStack.tsx   ← rewritten, see below
src/config/{services,experience,home}.ts
src/app/{page,layout}.tsx
tests/unit/home-sections.test.ts             ← 29 tests
tests/e2e/production/home-sections.spec.ts   ← 10 tests
```

**Acceptance criteria**

- [x] Sticky stack matches `docs/MOTION.md` §3.2: **40px top radius measured in
      computed style**, scale toward 0.96, dim via an overlay's `opacity` —
      asserted to contain no `filter` or `brightness`.
- [x] `ExperienceProcess` is the second and last pinned section. A test asserts
      **exactly two** files under `src/components/sections/` use
      `PinnedSequence`, by name.
- [x] `TestimonialsSection` returns `null`; nothing in the DOM. Verified in the
      browser by searching the rendered text.
- [x] `PreLaunchBand` renders only while `isPreLaunch`, with one honest
      sentence — asserted to contain no year and no countdown timer.
- [x] `LocationCard` shows "Konya, Selçuklu" from `site.address` and embeds no
      map: zero `iframe` elements on the page.
- [x] CTA is WhatsApp-first and, with every channel `null`, renders **zero**
      `[data-channel]` elements, zero `href="tel:"`/`"mailto:"`, zero
      `href="#"`, and zero disabled controls. The form CTA becomes the primary.
- [x] Aurora `--aurora-b`/`--aurora-c` set per panel; **`--aurora-a` never
      overridden anywhere** — asserted across all of `src/`, and confirmed in
      the browser to be identical at the top and at 60% scroll.
- [x] Text over the aurora checked at **worst case**, computed: `text-primary`
      and `text-secondary` clear AA against every stop in use, including the
      raw colour for overlapping blobs. `text-muted` does **not** (3.26:1 on
      blush), which is why `tone="transparent"` permits only the first two —
      and a test asserts it keeps failing, so the bar cannot quietly move.
- [x] Palette review — see below.

**Palette: the page no longer reads beige**

Sampled the rendered page before and after. The five full-viewport panels were
the problem: left at ivory they measured **cooler than the page itself**
(`#faf7f3` against cream's `#faf4ec`), and they are the largest area on the
site.

They now run a warming ramp, verified in computed style:

| Panel         | Surface    | Warmth (r−b) |
| ------------- | ---------- | ------------ |
| Cilt Bakımı   | ivory      | 5            |
| Epilasyon     | sand       | 20           |
| Cilt Yenileme | nude       | 30           |
| Kaş & Kirpik  | rose-beige | 36           |
| Özel Paketler | nude       | 30           |

Only `ink`/`espresso`/`cocoa` sit on the warmer surfaces, per §1.5 rule 4.
**The ramp is a config value** in `src/config/services.ts`, so the balance is
tuned there rather than in a component — and per §1.7 the lever is always
_area_, never rose text or rose borders, which fail contrast.

**A real bug the browser tests caught: the panels never scaled**

`StickyPanel` derived its progress from `useScroll({ target: panelRef })`. A
sticky element's own bounding rect **stops moving the moment it pins**, so the
progress was always 0 and the scale sat at exactly 1 — the signature
interaction did nothing at all, in `/motion` as well as here, and had been
"working" since M5 purely because nothing measured it.

Progress now comes from the **stack**, with each panel taking its slice by
index. The unit test pins the cause, not just the symptom.

**Two more bugs fixed**

- **`inert` was never cleared at reduced motion.** The effect returned early
  before the sync, so a brief full-tier render before the tier resolved could
  leave content inert — for exactly the visitor who must not get it.
- **A skip-link assertion was measuring the wrong thing.** It asserted the
  header starts at y=0, which the new pre-launch band legitimately broke. Re-aimed
  at the actual intent: the skip link must add no layout height.

**Facts we do not have render as absence, not placeholder**

`ExperienceProcess` ships with **no steps** and therefore renders nothing —
every step would be a claim about how the centre operates
(`docs/OPEN-QUESTIONS.md` C11). Adding two steps makes the pinned section
appear with no other change. The same pattern as `testimonials` and
`channelHref`.

**G12 closed:** the home page now reads the content layer, so invalid
frontmatter or a dangling reference fails `next build` directly.

**Verify** — `npm run verify` exits **0**, twice in a row. 236 unit tests,
42 browser tests.

```bash
npm run verify
```

---

## M8 — Services: 20 pages ☑ **DONE 2026-08-06**

**Goal.** The site's primary asset. Index, detail template, all 20 MDX files,
and the View Transition.

**Files touched** — as planned, plus the additions noted below.

```
src/app/hizmetler/page.tsx
src/app/hizmetler/[slug]/page.tsx
src/components/content/{ServiceCard,ServiceGrid,RelatedServices,RelatedPosts,
                        Faq,ManagedImage,ImageCredit,Mdx,Prose}.tsx
content/services/*.mdx                     ← 20 files
src/config/images.ts  src/config/services.ts  src/config/motion.ts
src/content-layer/{integrity,schemas,services,posts}.ts   ← check 8, `file`
src/components/sections/service-list-item.ts  ← added, see G16
scripts/generate-placeholders.mjs             ← added, see C7
scripts/guard.mjs  src/styles/globals.css
```

**Acceptance criteria**

- [x] All 20 services from `docs/CONTENT-PLAN.md` §1 exist, correct slugs,
      correct groups. Asserted against a literal slug→group map copied from the
      plan, not derived from the content.
- [x] Every page follows the §2 skeleton; body prose **350–600 words** of real
      Turkish. Measured: **350–420**, i.e. at the floor. Reaching even 350
      honestly meant writing about what each page deliberately does not say.
- [x] **No prices, no ranges, anywhere.** No before/after. No percentages. No
      session-count promises. Asserted per service over frontmatter and body
      together.
- [x] **Content posture held** — no durations, device or product brand names,
      staff credentials, equipment claims, depths, concentrations or machine
      settings. Four regex checks, with **Unicode-aware word boundaries** (see
      G15).
- [x] `npm run guard` passes on all 20 — **0 blocking, 0 percentage claims**;
      105 advisory hits, every one of them the required `tıbbi` disclaimer.
      Reviewed in full; see G14 below for the false positives removed first.
- [x] `durationLabel` is `null` on every service and the template contains
      neither `durationLabel` nor "Süre" — asserted against the source.
- [x] `relatedServices` resolves for all 20, and the graph is **fully
      reciprocal**: 0 one-way links, 3–4 siblings each, no orphans.
- [x] Every image goes through the manifest with `licence` and `sourceUrl`
      recorded. One narrow visual family. No person, and no photograph at all —
      see C7.
- [x] View Transition morphs card → detail hero, `view-transition-name` applied
      only to the activated card and cleared afterwards. Proven by intercepting
      `startViewTransition` and sampling the DOM **at capture time**.
- [x] Fixture MDX from M4 deleted, along with the `fixture-placeholder` manifest
      entry. A test asserts none of the three comes back.

**Deviations and additions, all deliberate**

**G14 — the guard was reporting hundreds of false positives.** `next/image`
emits `?url=%2Fimages%2F…` once per breakpoint, and `%2` matches the percentage
rule. Twenty service pages produced a wall of warnings, none of them a claim.
Fixed the way the inline-style false positive was fixed at M7: the rule stays
exactly as strict, and URL-bearing attributes are masked out of its input.
`content="…"` is deliberately not masked, because a meta description is prose.
Recorded in `CLAUDE.md` §12; four new fixture tests, including one asserting a
claim in a `content` attribute still blocks.

**C7 — no stock photography.** Photography arrives after the venue opens, and
the honest options were a stock photo of a room that is not this one, a stock
photo of a person who does not work here (already banned by `CLAUDE.md` §8), or
neither. The launch set is instead **abstract warm gradient artwork generated
from the palette** by `scripts/generate-placeholders.mjs`, one per service, in
the same visual family as the aurora. Consequences: `credit` and `sourceUrl` are
`null` because the artwork is ours, `licence` is the real `CC0-1.0`, and `alt`
is **empty** — the images carry no information, so decorative markup is the
correct accessibility answer and no alt text had to be invented either. All 20
stay `replaceable: true`.

**G15 — a test regex reproduced the exact bug `CLAUDE.md` §12 warns about.** The
equipment check used `/nm\b/`, and JavaScript's `\b` is ASCII-only, so it matched
inside _düşünmüyoruz_ and failed a page with no equipment reference at all. The
posture checks now use `(?<![\p{L}\p{N}])` / `(?![\p{L}\p{N}])` with `/u`, like
the guard, and a test pins the boundary behaviour so the next added term cannot
reintroduce it.

**G16 — all twenty MDX bodies were being serialised into the home page.**
`ServicesPanels` is a client component, so its props cross the boundary as JSON;
it was taking whole `Service` objects to render twenty titles. A browser test
found body copy in the payload. Props are now narrowed **on the server** via
`toListItems()`, which had to live in its own module: anything exported from a
`'use client'` file is a client reference and calling it during server rendering
fails the build.

**Faq is a Server Component on native `<details>`**, not a Radix Accordion
(`docs/ARCHITECTURE.md` §6 updated). Twenty pages would each have shipped a
client bundle for a widget the browser already implements correctly, and the
native one works before hydration and with JavaScript off. No dependency added.

**No `ImageReveal` on the detail hero.** It is the View Transition target; a
`clip-path` wipe and a morph would animate the same element from two different
start states. The transition is that image's entrance.

**Integrity check 8 added** (`internal-link-missing`) — a `/hizmetler/<slug>`
link written in a body must resolve. M8 is the first milestone where prose
carries contextual links, and a dangling one is a guaranteed 404.

**`Service.file` added** so the detail page can name the source file for an MDX
compile error without writing a `content/` path outside the content layer, which
`CLAUDE.md` §5 forbids and a test enforces.

**Reciprocity upgraded from warning to assertion.** The plan's table had sixteen
one-way links. The graph was re-authored symmetric (`docs/CONTENT-PLAN.md` §1
column revised) and a test now fails on any one-way link.

**Verify** — `npm run verify` exits **0**. 358 unit tests, 60 browser tests.

```bash
npm run verify
```

---

## M9 — Blog system ☑ **DONE 2026-08-06**

**Goal.** Index, categories, pagination, post template. No posts yet.

**Files touched** — as planned, plus the additions noted below.

```
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
src/app/blog/kategori/[slug]/page.tsx
src/app/blog/sayfa/[page]/page.tsx
src/app/blog/kategori/[slug]/sayfa/[page]/page.tsx  ← added, see G18
src/components/content/{PostCard,PostGrid,CategoryPills,RelatedPosts,
                        Pagination,PostListing}.tsx
src/config/blog.ts        src/lib/pagination.ts     ← added
src/config/images.ts      src/content-layer/{schemas,posts,index}.ts
next.config.ts            scripts/generate-placeholders.mjs
content/blog/sablon-onizleme.mdx                    ← added, see G17
```

**Acceptance criteria**

- [x] Six categories from `docs/CONTENT-PLAN.md` §3, each with an archive route.
      All six exist from the start, empty or not — they are the confirmed
      taxonomy, not a reflection of what happens to be published. A unit test
      asserts the config covers exactly the six schema categories.
- [x] Pagination at 12 per page; **`/blog/sayfa/1` does not exist**; `/blog` is
      page 1 and pages 2+ are self-canonical. Proven at 0, 12, 13, 25 and 50
      items against the pure function, and asserted in the browser: every
      `…/sayfa/<n>` currently 404s, and `…/sayfa/1` **redirects** to the bare
      path rather than 404ing (see below).
- [x] Post template implements the §6 structure — `h1`, lead, hero, body,
      "Kısaca", SSS, mapped service, related posts, one CTA. Driven in a real
      browser, which needed G17 below.
- [x] No byline while `author` is `'PENDING'`. The template **never reads the
      field**, so a byline cannot appear by accident; asserted in the source and
      in the rendered page, along with the absence of "Admin", "Editör" and an
      empty avatar element.
- [x] `draft: true` posts are absent from `generateStaticParams` and every
      listing — now provable, because there is a draft to prove it against. The
      production build generates **zero** post pages, `/blog/sablon-onizleme`
      404s, and no build artefact contains its title. The **sitemap** arrives at
      M13 and will consume `getAllPosts()`, which excludes drafts by default.
- [x] Related posts follow the linking rules; zero orphans. `getRelatedPosts`
      scores same-service above same-category and always excludes the post
      itself; every post links up to its mapped service hub, and the block
      renders nothing while a post is alone.
- [x] Empty states are real sentences, not placeholders. Two of them — "no posts
      at all" and "none in this category" — each ending with a link to the pages
      that do exist. Asserted: no skeleton, no `aria-busy`, no "yükleniyor", and
      no "yakında" inside `<main>`.

**Additions and deviations, all deliberate**

**G17 — a template with nothing to render is a template nobody has seen.** With
no published posts, `/blog/[slug]` generates **zero pages**, so no production
test can load it and `npm run verify` would have stayed green over a completely
broken post template. The same class of hole as `/styleguide` at M5 (G13).
Closed with a single `draft: true` preview post, visible under `next dev` and
absent from the production build, driven by ten tests in the `development`
Playwright project. It states nothing about the business — it describes the
template — and **it is deleted at M10**, when twelve real posts make it
redundant. If the owner would rather ship the milestone with the template
unexercised, deleting the file is the only change needed.

**G18 — category archives are paginated now, not later.** Fourteen of the fifty
planned posts (`docs/CONTENT-PLAN.md` §4) map to `cilt-yenileme-rehberi`, which
is more than one page of twelve. Adding `/blog/kategori/[slug]/sayfa/[page]`
after those posts were published would have changed live archive URLs — exactly
the retrofit "twelve now, fifty later" is meant to avoid. It shares the same
`src/lib/pagination.ts` primitive, so it cost one route file.

**`…/sayfa/1` redirects rather than 404s.** The criterion is that the page does
not exist, and it does not — it is never generated. But it is the first URL a
visitor types after seeing `…/sayfa/2`, so `next.config.ts` resolves it
permanently to the bare path. The duplicate stays unreachable either way.

**Empty listings are `noindex, follow`.** Seven thin pages offered for indexing
would be a real defect, and the flag flips by itself the moment a post
publishes — nothing to remember. Full canonical and robots handling is still
M13's; this is here because M9's own criteria are about page-1 canonicals.

**The post schema gained `keyPoints` and `faq`.** §6 specifies a "Kısaca" block
and 2–4 questions, and neither existed in the frontmatter. Structured rather
than written into the body, so the template places them consistently and M13's
`FAQPage` JSON-LD has pairs to work from.

**Blog heroes are one per category, not one per post.** Fifty posts do not need
fifty pieces of artwork, and a per-post image would mean inventing one every
time a post is written. Six entries, same generated family as the services.

**`Faq` and `RelatedPosts` now take their heading as a prop** rather than
reading the service-page config, because both are shared by service pages and
posts and a component should not have to know which page it is on.

**Verify** — `npm run verify` exits **0**. 393 unit tests, 86 browser tests.
Guard: **0 blocking, 0 percentage claims**, 105 advisory — unchanged, all still
the required `tıbbi` disclaimer on the service pages.

```bash
npm run verify
```

---

## M10 — Blog: 12 posts ☑ **DONE 2026-08-06**

**Goal.** Batch 1 written and published — one post per distinct service.

**Files touched** — as planned, plus the additions noted below.

```
content/blog/*.mdx                        ← 12 files
content/blog/sablon-onizleme.mdx          ← DELETED, as scheduled at M9
tests/e2e/development/blog-preview.spec.ts ← deleted with it
src/config/legal.ts                       ← the disclaimer's one home
src/config/blog.ts  src/app/blog/[slug]/page.tsx
src/config/services.ts  src/content-layer/integrity.ts
src/components/content/PostCard.tsx
```

`src/config/images.ts` was **not** touched: blog heroes are one per category
(M9), so twelve posts needed no new artwork and no new manifest entry. That was
the point of doing it that way.

**Acceptance criteria**

- [x] Exactly the 12 posts in `docs/CONTENT-PLAN.md` §4 Batch 1, with the
      planned slugs, keywords, categories and service mappings — asserted
      against a literal copy of the plan, not derived from the content.
- [x] 900–1400 words each, real Turkish, lead paragraph answers the question
      immediately. Measured **909–1119**; see the note on variety below.
- [x] `author: 'PENDING'` on all 12, and the template still never reads the
      field.
- [x] `npm run guard` clean — **0 blocking, 0 percentage claims** across
      `/blog`. Full output reported below.
- [x] Every post links up to its service hub in context, plus 2–3 lateral links
      and exactly one CTA to `/iletisim` (asserted inside `<main>`, so the
      footer's nav link is not miscounted). **Zero orphans**: every post has an
      inbound link from another post.
- [x] Every service hub shows its related posts — the twelve with a Batch 1
      post do; the eight Batch 2 services correctly show nothing.
- [x] No before/after imagery. All images through the manifest.
- [x] Fixture MDX from M4 deleted (already done at M8), and the M9 preview post
      deleted here as scheduled. A test asserts neither comes back.

**Notes and additions**

**Sameness was the real risk, and the first draft had it.** Twelve posts written
in one pass came out 909–972 words — a 52-word spread across the whole batch,
which is the clearest signal there is that a machine wrote them. Rewritten so
length follows the topic: the broad ones (`lazer-epilasyon`, `kalıcı makyaj`,
`leke`, `gelin`) run 1014–1119; the narrow ones answering a single question stay
near 910. A unit test now asserts the spread, the section-count variety and that
no two posts open with the same sentence — blunt proxies, but they fail on the
failure mode that matters.

**No numeric claims at all.** Not "3 seans", not "2 hafta", not a percentage,
not a study reference or an "uzmanlar diyor ki". Several posts say explicitly
why the number is absent, which turned out to be the most distinctive material
in the batch. Asserted per post over frontmatter and body together. The one
number a reader sees is the computed reading time.

**The disclaimer moved to one home** (`src/config/legal.ts`) and is rendered by
the post template on every post, rather than written into twelve MDX files.
Twelve copies of a compliance sentence is twelve chances to drift. A test
asserts it is NOT in any body.

**Integrity check 8 widened to `/blog` links.** Rule 7 catches a link to a
draft; a link to a slug that does not exist at all was nobody's job until twelve
posts started cross-linking each other.

**`PostCard` heading fixed from h3 to h2.** A listing's only h1 is its page
title, so an h3 card heading skipped a level on every blog listing at once. It
was invisible while there were no cards to render, and a browser test caught it
the moment there were.

**A note on the twelfth title.** `docs/CONTENT-PLAN.md` §4 plans "Gelin Bakım
Takvimi: Düğüne Kaç Ay Kala Ne Planlanır", and the content posture forbids
publishing month counts. The title is kept as planned and the lead answers the
question honestly in its first sentence: the sequence is what matters, not the
count, and the post says why no table appears. Flag it if that reads as a
bait-and-switch — the alternative is a title change and a plan deviation.

**Verify** — `npm run verify` exits **0**. 552 unit tests, 88 browser tests.

```bash
npm run verify
```

---

## M11 — Contact form ◐ **BUILT 2026-08-06 — blocked on the SMTP credential**

**Goal.** The only live conversion path. Altcha + Nodemailer, nothing persisted.

**Files touched** — as planned, plus the additions noted below.

```
src/app/api/contact/route.ts   src/app/api/altcha/route.ts
src/app/api/dev/outbox/route.ts        ← added, dev-only capture reader
src/app/iletisim/page.tsx
src/components/forms/{ContactForm,FormField,FormStatus}.tsx
src/components/forms/{useAltcha.ts,altcha-worker.ts}   ← instead of AltchaField
src/components/sections/ContactChannels.tsx            ← added
src/lib/mail/{transport,templates,outbox}.ts
src/lib/spam/{challenge,form-token,single-use,rate-limit}.ts   ← added
src/lib/contact/schema.ts   src/config/{env,forms,contact}.ts
next.config.ts  playwright.config.ts  .env.example
```

**Acceptance criteria**

- [x] Both handlers `export const runtime = 'nodejs'`. Asserted at the source.
- [x] Altcha challenge is HMAC-signed, short-TTL, single-use; verified
      server-side. Proven by solving a real challenge and replaying it: the
      second attempt is refused. Solving happens in a Web Worker with no user
      interaction — a browser test confirms `/api/altcha` is fetched and the
      submission carries a solved payload.
- [x] Zod validation rejects unknown keys; honeypot must be empty; best-effort
      per-address rate limit. All three exercised over HTTP against the real
      build, not only in unit tests.
- [x] Nodemailer over Google Workspace SMTP, port 587, **STARTTLS with
      `requireTLS`** so the connection fails rather than falling back to
      plaintext. Credentials from `env.ts`.
- [x] **Nothing is persisted.** No database, no file, no log line carrying the
      body, the name or the address — asserted by reading the handler's own
      `console.*` calls. The single-use store, the rate limiter and the
      development capture are all in memory.
- [x] Consent checkbox is required, unchecked by default, links to `/kvkk`.
      `z.literal(true)` — an unticked box is a validation failure, not a silent
      default.
- [x] Every channel link carries `data-channel`. No channel is configured, so
      none renders; a browser test asserts zero `[data-channel]`, zero dead
      hrefs and zero disabled controls on `/iletisim`.
- [x] **Works without JavaScript.** A real `action`/`method`, a 303 back to the
      page, and the outcome rendered server-side from the query string. Driven
      in a browser context with JavaScript disabled, and it delivers.
- [x] Errors, success and pending announced via `role="status"` /
      `aria-live="polite"`. The region is in the DOM from first paint, empty —
      a live region added at the same moment as its message is frequently not
      announced at all.
- [x] Field errors wired with `aria-describedby` and `aria-invalid`, with a `✕`
      glyph so the state is never colour-only. Every control has a real
      `<label>`, asserted by walking `HTMLInputElement.labels` in the browser.
- [x] SMTP detail never reaches the client. A failed delivery returns one
      generic message; the response body is checked for `SMTP`, `ECONN`,
      `auth`, `password` and `gmail`.
- [x] Destination inbox comes from env — **still blocked on the owner**
      (`docs/OPEN-QUESTIONS.md` B1/B3). Verified against a **local capture**
      rather than a test mailbox, on instruction. Nothing was weakened and no
      fallback address was invented.

**How the missing credential was handled**

`MAIL_TRANSPORT=capture` composes the identical message with nodemailer's own
stream transport and hands the bytes to an in-memory outbox, read back by a
dev-only `/api/dev/outbox`. The development browser suite fills the real form —
with and without JavaScript — and asserts the resulting RFC822 message: headers,
`Reply-To`, and the decoded Turkish body.

Two independent guards stop that reaching production: `env.ts` refuses the
capture transport when `NODE_ENV` is production, and the outbox route 404s
there. Both are asserted, the second by the production suite.

**What is left: set the six SMTP variables.** No code changes with them.

**Additions and deviations**

**A signed page token, for the no-JavaScript path.** Proof of work needs a Web
Worker, so a visitor with JavaScript off cannot produce one — and the form must
work anyway. Accepting those submissions with no server-side check would have
made Altcha decorative: a spammer only has to switch JavaScript off. The page
issues a short-lived, single-use HMAC token instead, which proves the submission
came from a page we served, recently, once. Not a cookie; nothing is stored.

**`AltchaField.tsx` became `useAltcha.ts` + `altcha-worker.ts`.** There is no
field to render — the solved payload is attached to the FormData at submit — so
a component would have been an empty wrapper around a hook.

**`/iletisim` is rendered per request**, not static as `docs/ARCHITECTURE.md` §2
originally listed. It issues a per-visitor token and reads `searchParams`; both
force it. §2 updated, with the consequence for the guard recorded as G21.

**Three bugs found by running it, not by reading it** — G20, G22, G23 in
`docs/OPEN-QUESTIONS.md`. The one worth naming here: the contact page returned
**500 with no mailbox configured**, because one env schema coupled the signing
key to the SMTP credential. A page that sends nothing must not need a mail
credential to render.

**Verify** — `npm run verify` exits **0**. 596 unit tests, 114 browser tests.

```bash
npm run verify
```

Still outstanding for this milestone: a real send to the live mailbox, once B3
exists.

---

## M12 — Legal pages ☑ **DONE 2026-08-07**

**Goal.** KVKK aydınlatma metni, cookie policy, terms — with the legal entity
unresolved and a gate enforcing that it cannot ship unresolved.

**Files touched** — as planned, plus the additions noted below.

```
src/app/{kvkk,cerez-politikasi,kullanim-kosullari,lisanslar}/page.tsx
src/config/legal.ts  src/config/legal-entity.ts     ← added, see G24
content/legal/*.mdx  src/content-layer/legal.ts     ← added
src/components/content/LegalDocumentPage.tsx        ← added
scripts/guard.mjs  scripts/guard.allow.json  scripts/preflight.mjs ← added
src/components/layout/SiteFooter.tsx  src/config/navigation.ts
.env.example  package.json
tests/unit/legal-pages.test.ts  tests/e2e/production/legal.spec.ts
```

**Acceptance criteria**

- [x] **No plausible-sounding name is invented anywhere.** The pages name no
      entity while it is unresolved: they say the ünvan is pending and when it
      lands. A test asserts no company-form suffix appears in any body or in the
      page copy, and a browser test asserts the same on the rendered page.
- [x] Guard rule 2 proven, **demonstrated twice**: a test runs the real
      `scripts/guard.mjs` against a fixture build tree containing
      `{{LEGAL_ENTITY}}` and asserts exit 1 with `[unresolved-token]` and the
      file named; and the token was injected into a real production build's
      `kvkk.html`, which produced
      `.next/server/app/kvkk.html:93:25231 [unresolved-token]` and exit 1, then
      exit 0 on restore.
- [x] KVKK text states what the form collects (four fields, named), that it is
      emailed and **not stored** by the site, and all nine Art. 11 rights — a
      test counts them.
- [x] Cookie policy is accurate for a cookieless setup: it says the site sets no
      cookies and describes none it does not set. A test asserts
      `activeProviders()` is empty alongside the sentence, so the two cannot
      drift.
- [x] Footer links to all three from every page; the form's consent checkbox
      links to `/kvkk` — asserted **scoped to the form**, since the footer now
      links there too and a consent notice that relies on the footer is not one.
- [x] **`/lisanslar`** renders the generated `NOTICE`, read at build time from
      the file rather than transcribed, `noindex`, with the OFL texts linked.
      Asserted to contain the CC-BY attributions and not to scroll the page body
      at 320px.
- [x] `docs/OPEN-QUESTIONS.md` records the pending legal review (C8, and the
      draft notice renders from `legal.isLawyerReviewed`), plus **G24** and
      **G25** below.

**The one deviation, and it is a real one — G24**

The criterion as written ("a page containing `{{LEGAL_ENTITY}}` fails the
production build") and the standing rule that `npm run verify` exits 0 at every
commit cannot both hold while B2 is open: the guard is inside `verify`.

The gate therefore **moved from the build to the deploy, and got stronger**.
`npm run preflight` refuses a production deployment while the ünvan is
unresolved, the legal text is unreviewed, the SMTP credential is missing, or the
signing key is absent — four blockers where there was one, wired into
`vercel.json`'s build command. Guard rule 2 is unchanged and is now proven
rather than assumed. Full reasoning in `docs/OPEN-QUESTIONS.md` G24.

**G25 — the allow file has its first entry.** KVKK m. 11/1-e says "silinmesini
veya **yok edilmesini** isteme", and `yok ed` is a blocking term. Quoting
statute is exactly what the exception mechanism is for; the entry is scoped to
that phrase and a test asserts "Lekeleri yok eder." still blocks.

**Guard on the M12 build:** 311 artefacts scanned, **0 blocking**, 165 advisory
— unchanged, all still the required `tıbbi` disclaimer. The four new pages
contribute **zero** advisories.

**Verify** — `npm run verify` exits **0**. 616 unit tests, 127 browser tests.

```bash
npm run verify
```

---

## M17 — Remaining pages and configured facts ☑ **DONE 2026-08-07**

**Not in the original plan.** Added because `/hakkimizda` and `/sss` were in
`docs/ARCHITECTURE.md` §2 from the start but never got a milestone, and the
header had linked to both since M1. M13's sitemap and canonicals need every
route to exist, so this runs before it.

Also the milestone where **the empty configuration gets filled in**, on
instruction: contact channels, social profiles, opening hours and the visit
sequence.

**Files touched**

```
src/app/{hakkimizda,sss}/page.tsx
content/pages/hakkimizda.mdx   src/content-layer/pages.ts       ← new collection
src/config/{contact,site,experience,faq,home}.ts
src/components/sections/{ExperienceSteps,SocialLinks}.tsx       ← added
src/components/sections/{ExperienceProcess,ContactChannels,LocationCard}.tsx
tests/unit/site-pages.test.ts   tests/e2e/production/site-pages.spec.ts
```

**Acceptance criteria**

- [x] `/hakkimizda` renders from MDX, one `h1`, no skipped heading level, and
      names no person, credential or team member — while keeping the referral
      sentence that tells a reader to see a specialist.
- [x] `/sss` asks ten general questions, none duplicating a per-service one — a
      test compares against every service's `faq` frontmatter, because the same
      question on two indexable URLs is a real defect. Native `<details>`, so
      the answers open with JavaScript disabled; a browser test proves it.
- [x] **Every contact channel is configured and live**, each carrying
      `data-channel`, each resolving to a complete href. The bare-scheme
      invariant is unchanged and now asserted in three browser tests as well as
      in unit tests.
- [x] All four social profiles render. Google points at a **working Maps
      search**, not a fabricated `g.page` URL that would 404 on a visitor.
- [x] Opening hours render, grouped into ranges by a computed function rather
      than authored twice, and are labelled provisional on screen (C12).
- [x] The visit sequence has four steps, rendered from one source in two places
      — pinned on the home page, static on `/hakkimizda`. The pinned version
      changes **only opacity**; all four steps are in the DOM at
      `domcontentloaded`, asserted.
- [x] Guard: 323 artefacts, **0 blocking**, 184 advisory. The 19 new advisories
      are `tıbbi` on `/sss` (the disclaimer and the question that asks about it)
      and `klinik` on `/hakkimizda` (the sentence explaining what the design
      avoids looking like). Both reviewed.

**Everything added here is a placeholder, and every one is labelled**

| Placeholder             | Where                      | Recorded |
| ----------------------- | -------------------------- | -------- |
| `0500 000 00 00`        | `src/config/contact.ts`    | STATUS   |
| Social handles ×4       | `src/config/contact.ts`    | STATUS   |
| Opening hours           | `src/config/site.ts`       | C12      |
| Visit sequence, 4 steps | `src/config/experience.ts` | C11      |

`0500` is not an allocated Turkish mobile prefix, which is the point: the number
cannot be dialled by mistake and cannot be read as a real one somebody forgot to
change. A test pins it.

**Two things that did NOT change, deliberately**

- **Testimonials still ship empty.** The instruction to fill every section and
  the instruction "no fabricated reviews" collide here, and the second wins —
  it is in `CLAUDE.md` §9, it is a KVKK problem (the type requires recorded
  consent), and review markup for reviews that do not exist violates Google's
  policy outright. `TestimonialsSection` returns null, so no empty section
  renders either.
- **No street address.** Guessing one is banned (`CLAUDE.md` §18.7) and it is
  the one fact a wrong value actively harms — a visitor who drives somewhere.

**No icon set was added.** `CLAUDE.md` §2 pins Lucide as the only permitted one,
and Lucide has no TikTok glyph and is retiring brand marks generally — so an
icon row would have meant a second icon set (forbidden) or hand-drawn
trademarks (worse). The social links are words. It suits a typographic brand
better anyway.

**Verify** — `npm run verify` exits **0**. 639 unit tests, 150 browser tests.

```bash
npm run verify
```

---

## M13 — SEO ☐

**Goal.** `docs/SEO.md` implemented end to end.

**Files touched**

```
src/lib/schema/*.ts  src/components/seo/JsonLd.tsx
src/app/sitemap.ts  src/app/robots.ts  src/app/manifest.ts
src/app/**/opengraph-image.tsx
generateMetadata across every route
```

**Acceptance criteria**

- [ ] Every route sets an explicit absolute canonical. Titles ≤ 60 chars,
      descriptions 150–165.
- [ ] One JSON-LD `@graph` per page with the stable `@id`s from §2.1; entities
      referenced, never duplicated.
- [ ] Types per route match §2.2. **No `MedicalBusiness`, `MedicalClinic`,
      `MedicalProcedure`, `MedicalTherapy` or `Physician` anywhere** — asserted
      by test.
- [ ] `streetAddress` and `postalCode` absent from `PostalAddress`.
- [ ] Pre-launch omissions in §2.5 each covered by a passing unit test.
- [ ] `BlogPosting.author` references the Organization, never a fabricated
      Person.
- [ ] OG images render for site, service and post; text passes the guard.
- [ ] Sitemap excludes drafts, carries real `lastModified`.
- [ ] Rich Results Test clean on one URL per route type.

**Verify**

```bash
npm run verify
```

Plus Rich Results Test and the Schema.org validator.

---

## M14 — Analytics and consent ☐

**Goal.** The consent gate **live at launch**, every tag off, and no analytics
backend deployed.

Per `docs/OPEN-QUESTIONS.md` C5 and C6: advertising is expected within 12
months, so the gate ships now — tracking must never be able to start before
consent exists. Umami is the chosen engine but is **not stood up at launch**;
there is no traffic to measure and a second server is real cost for zero return.

**Files touched**

```
src/config/analytics.ts  src/components/analytics/*.tsx
src/app/cerez-politikasi/page.tsx
```

**Acceptance criteria**

- [ ] **Consent gate is live**: opt-in only, Consent Mode v2 default denied,
      rejecting exactly as easy as accepting, choice persisted, re-openable.
- [ ] **No analytics backend is deployed.** No Umami instance, no VPS, no DNS
      record. The Umami adapter exists behind an off flag.
- [ ] Umami, GA4 and Meta Pixel adapters all exist and are all `false`, and are
      **absent from the production bundle** — verified by searching the built
      chunks, not by inspecting source.
- [ ] With flags off: **zero cookies set, zero third-party requests** — verified
      in a clean browser profile.
- [ ] Switching any adapter on later is a config change, not a refactor.
      Demonstrated by flipping a flag in a local build.
- [ ] Cookie policy describes actual behaviour — **it does not describe cookies
      the site does not set.** At launch that means: none.
- [ ] `UMAMI_*` env vars documented as unused-at-launch and **not required** by
      `env.ts`; a missing value is not a startup failure (G2).

**Verify**

```bash
npm run verify
```

Plus a clean-profile network + storage inspection.

---

## M15 — Accessibility and performance pass ☐

**Goal.** The whole site, audited by hand. This milestone fixes; it does not add.

**Files touched** — wherever the audit finds problems.

**Acceptance criteria**

- [ ] `npm run test:a11y` — axe on every static route, **zero violations**.
- [ ] Full keyboard traversal of every route, including both pinned sequences
      and the mobile menu. No traps, no unreachable content, focus always visible.
- [ ] Screen reader pass (NVDA or VoiceOver) on home, a service page, a post and
      the contact form. Reading order matches visual order.
- [ ] Every colour pairing in use appears in the permitted table in
      `docs/DESIGN-SYSTEM.md` §1.4. Text over aurora and imagery checked at
      worst case.
- [ ] All three motion tiers reviewed on every route.
- [ ] 320 / 768 / 1280 / 1920px — no horizontal scroll, nothing clipped.
- [ ] 200% browser zoom and 320px reflow both usable.
- [ ] Turkish glyphs render correctly everywhere, including OG images.
- [ ] No CLS from image reveals or font swap.
- [ ] Lighthouse recorded as a **number, not a gate** — regressions
      investigated, never traded against accessibility.

**Verify**

```bash
npm run verify && npm run test:a11y
```

---

## M16 — Self-host verification ☐

**Goal.** Prove the portability rule. The site must run with no Vercel.

**Files touched**

```
Dockerfile  .dockerignore  docs/DEPLOY.md
```

**Acceptance criteria**

- [ ] Multi-stage Dockerfile on a Node 24 base, non-root user, standalone output.
- [ ] `docker build` then `docker run` serves the complete site on a clean
      machine with only env vars supplied.
- [ ] Every route renders; the contact form sends successfully from the
      container.
- [ ] Grep confirms **no `@vercel/*` import and no Vercel-only API** anywhere in
      `src/`.
- [ ] Image optimisation works in the container (`sharp` present).
- [ ] `docs/DEPLOY.md` self-host section verified against the actual run and
      corrected where it was wrong.

**Verify**

```bash
npm run verify && docker build -t marenbeauty . && docker run --rm -p 3000:3000 --env-file .env.local marenbeauty
```

---

## Launch — owner-executed ☐

Not a build milestone. `docs/DEPLOY.md` is a checklist for a human.

- [ ] Vercel project connected, env vars set, Node 24 runtime.
- [ ] DNS cutover per `docs/DEPLOY.md`, **MX records untouched**.
- [ ] SPF, DKIM and DMARC verified alongside Google Workspace.
- [ ] Test send from production reaches the destination inbox.
- [ ] Search Console verified, sitemap submitted.
- [ ] Every `{{LEGAL_ENTITY}}` resolved; guard passes on the production build.

**Nothing in `docs/DEPLOY.md` is executed by an agent.** DNS, Vercel settings
and the Workspace console are the owner's (`CLAUDE.md` §17).

---

## Post-launch backlog — not scheduled

Ordered by expected value, to be scheduled one at a time after launch.

| #   | Item                      | Notes                                                                                    |
| --- | ------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Google Business Profile   | Needs the address decision (`docs/OPEN-QUESTIONS.md`). Biggest local lever.              |
| 2   | Flip `isPreLaunch: false` | Real hours → opening hours in schema. One config change.                                 |
| 3   | Real photography          | Swap the manifest, set `replaceable: false`. No component changes.                       |
| 4   | Contact channels          | Phone / WhatsApp / Instagram appear the moment config has values.                        |
| 5   | Blog Batch 2              | Posts 13–50, ~2 per week.                                                                |
| 6   | Git-backed admin UI       | So the owner publishes without a developer. Same MDX files. Licence-check the CMS first. |
| 7   | Real author byline        | Widen the schema; `BlogPosting.author` becomes a `Person`.                               |
| 8   | Testimonials              | Only from real clients, unincentivised. Then `aggregateRating` becomes truthful.         |
| 9   | Booking integration       | Only if the owner adopts a booking system.                                               |
| 10  | District landing pages    | Only if Search Console shows real demand, and only with distinct content.                |

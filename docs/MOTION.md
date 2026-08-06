# MOTION — Maren Beauty

Art direction and the technical contract for every moving thing on the site.
Tokens live in `docs/DESIGN-SYSTEM.md` §7; this document says what they build.

---

## 1. The idea

**Maren** relates to the sea. The motion carries that, and it is the only place
the sea is allowed to appear — never as illustration, never as a wave graphic,
never in blue (`docs/BRIEF.md` §2).

One continuous water-surface form transforms down the page:

| Position    | State of the form                                                       |
| ----------- | ----------------------------------------------------------------------- |
| Hero        | **Still.** A held surface. Nothing moves but the light.                 |
| Brand story | **Spreading.** The surface widens as the wordmark contracts away.       |
| Services    | **Dispersed.** Broken into light refraction, sitting behind the panels. |
| Contact CTA | **Settled.** Gathered again, at rest.                                   |

Between those states the page has **no hard section boundaries**. A single
gradient wash runs the full length of the document and shifts with scroll
position, so sections dissolve into one another rather than stacking.

The register is calm, continuous, unhurried. If an animation draws attention to
itself as an animation, it is wrong.

---

## 2. Non-negotiables

These outrank any visual idea, including everything below.

1. **Nothing discrete exceeds 400ms.** Scroll-linked motion has no duration,
   but its smoothing must settle within 200ms.
2. **Only `transform`, `opacity`, `clip-path`, `filter` animate.** Never
   `width`, `height`, `top`, `left`, `margin`, `background-position`,
   `box-shadow`, or `border-radius` on a per-frame basis.
3. **Scroll is never hijacked.** Native scrolling is preserved exactly. Only
   animation _progress_ is bound to scroll position.
   - No `preventDefault` on `wheel` or `touchmove`.
   - No smooth-scroll library. **Lenis, Locomotive and GSAP ScrollSmoother are
     banned** — the first two rewrite native scrolling; GSAP is also outside the
     licence policy (`docs/LICENSES.md`).
   - No forced `scroll-snap` on long sections.
   - The scrollbar always tells the truth about position.
4. **`prefers-reduced-motion: reduce` is honoured everywhere**, and means the
   _final state immediately_ — not a shorter animation.
5. **Exactly five signature interactions plus the grain overlay.** A sixth
   requires owner approval. Decoration is not a feature.
6. **Pinned storytelling in exactly two places**: the hero → brand story
   opening, and the process section. Nowhere else.
7. **Everything animated is GPU-composited.** If it triggers layout or paint
   during scroll, it does not ship.
8. **Motion never carries information alone.** Anything revealed by animation
   is present and readable with animation disabled.

---

## 3. The five signature interactions

### 3.1 Signature #1 — Scroll-linked aurora background

The continuous wash. Radial gradients, heavily blurred, drifting with scroll.

**Structure**

```
<div class="aurora" aria-hidden="true">   <!-- fixed, inset:0, z:-1, contain:strict -->
  <span class="blob blob-a" />            <!-- radial-gradient, ≤60vmax -->
  <span class="blob blob-b" />
  <span class="blob blob-c" />
</div>
```

**Colour** — from `docs/DESIGN-SYSTEM.md` §1.6. `--aurora-a` stays `cream` for
the entire document, which is what removes section boundaries. Sections
override `--aurora-b` / `--aurora-c` only, via a CSS variable set on the section
wrapper. The gradient is therefore **data, not markup**.

**Motion** — each blob gets `translate3d()` and `scale()` driven by document
scroll progress. Amplitude is small: ≤18vmax translation, 0.9–1.25 scale across
the whole page.

**Performance rules**

- `filter: blur(90px)` is set **once** and never animated. Animating a blur
  radius re-rasterises every frame.
- Blobs are their own compositing layers: `will-change: transform`, added on
  mount and removed when the aurora leaves the viewport.
- Container gets `contain: layout paint size` so blur cannot invalidate the rest
  of the page.
- Smoothed with a spring so the wash lags the scroll very slightly. Tune to
  settle within `--duration-settle` (200ms). The aurora is the **only**
  scroll-linked element permitted smoothing — everything else stays locked to
  the finger.

**Contrast safety** — text is never placed directly on the aurora without a
token surface or a scrim behind it. Because the wash moves, contrast is verified
at its **worst case across the whole scroll range**, not at rest
(`docs/DESIGN-SYSTEM.md` §1.5 rule 8).

**Tiers** — `reduced`: blobs freeze at their at-rest position, no scroll
binding. `static`: the whole layer is replaced by a flat CSS
`linear-gradient(cream → sand)`, no blur, no JS, no compositing layers.

---

### 3.2 Signature #2 — Sticky stacked panels (services)

Each service group is a panel that slides up, sticks, and lets the next panel
cover it.

**Structure**

```
<section class="stack">                    <!-- height: (n+1) * 100svh -->
  <article class="panel" />                <!-- position: sticky; top: 0 -->
  <article class="panel" />
  …
</section>
```

**Specification**

| Property             | Value                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| Panel top radius     | `var(--radius-panel)` = `40px 40px 0 0`                                       |
| Outgoing panel scale | `1 → var(--motion-panel-scale)` = `0.96`                                      |
| Transform origin     | `top center`                                                                  |
| Outgoing dim         | overlay `opacity 0 → var(--motion-panel-dim)` (`0.55`), colour `--scrim-soft` |
| Separation           | `--shadow-panel` (casts upward)                                               |
| Easing               | `--ease-water`                                                                |

The dim is a child overlay animated via `opacity` — **not** a `filter:
brightness()` on the panel, which would force the whole subtree onto a filter
layer.

`position: sticky` is computed before transforms, so scaling a sticky panel does
not break stickiness. This is why the effect needs no JS layout work.

**Tiers** — `reduced` and `static`: panels become a normal stacked list, full
scale, no dim, no sticky. Content order and reading experience are identical.

---

### 3.3 Signature #3 — Line-by-line clip-path text reveal

For display headings and the brand-story lines.

**Per line**

| From                            | To               |
| ------------------------------- | ---------------- |
| `clip-path: inset(0 0 100% 0)`  | `inset(0 0 0 0)` |
| `transform: translateY(0.36em)` | `translateY(0)`  |

Duration `--duration-slow` (320ms), easing `--ease-entrance`, stagger
`--stagger-line` (60ms), **capped at `--stagger-cap` (6) lines** — six lines at
60ms plus 320ms lands at 620ms total, which is the practical ceiling for a
staggered group. Longer headings reveal as one block.

**Lines are authored, never measured.**

Text is supplied as an array of strings — one entry per visual line — from
`content/` or `src/config/`. There is **no runtime text splitting**. This is a
deliberate decision:

- no layout thrash from measuring text;
- no CLS when the webfont swaps in and re-wraps;
- no mid-word splits;
- it renders correctly server-side, before hydration;
- screen readers read the spans in order as ordinary text.

`--measure-display: 20ch` (`docs/DESIGN-SYSTEM.md` §2.4) exists so authored
lines wrap where the author intended at every viewport. Authors must check
their line arrays at 320px, 768px and 1440px.

**Trigger** — `IntersectionObserver` at 25% visibility, fires **once**. Never
re-triggers on scroll-up; re-animating read text is annoying and, on a long
page, expensive.

**Tiers** — `reduced` / `static`: fully visible, no clip, no transform, no
observer.

---

### 3.4 Signature #4 — Image reveal

Every content image entering the viewport for the first time.

| Layer         | From                                                  | To                                      |
| ------------- | ----------------------------------------------------- | --------------------------------------- |
| Frame         | `clip-path: inset(100% 0 0 0 round var(--radius-xl))` | `inset(0 0 0 0 round var(--radius-xl))` |
| Inner `<img>` | `scale(1.12)`                                         | `scale(1)`                              |

Duration `--duration-slowest` (400ms — the ceiling, used here deliberately),
easing `--ease-water`. Frame and inner run together; the inner scale is what
gives the wipe its weight.

The `round` value is identical at both ends so `inset()` interpolates cleanly.
Reserve layout with `width`/`height` from the image manifest — the reveal must
never cause CLS.

**Tiers** — `reduced` / `static`: image renders at final state, no clip, no
scale.

---

### 3.5 Signature #5 — View Transitions (service card → service detail)

Navigating from a `ServiceCard` on `/hizmetler` to `/hizmetler/[slug]` morphs
the card image into the detail hero.

**Progressive enhancement, always.** Feature-detect
`document.startViewTransition`. Where absent, `ViewTransitionLink` renders a
plain `next/link` and navigation is instant — no polyfill, no fallback
animation, no layout shift.

**The uniqueness rule:** a `view-transition-name` must be unique in the
document at capture time. Names are therefore assigned **only to the card the
user activated** — set via a data attribute on click, cleared on transition end.
Never put `view-transition-name` on all 20 cards at once; the transition silently
fails if two elements share a name.

```css
::view-transition-group(*) {
  animation-duration: var(--duration-slow); /* 320ms — under the cap */
  animation-timing-function: var(--ease-water);
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none;
  }
}
```

Only the hero image and the service title participate. Morphing more than two
elements reads as a slideshow.

**Tiers** — `reduced` / `static`: disabled entirely; plain navigation.

---

### 3.6 The grain overlay (site-wide, not a signature)

4% grain across the whole viewport, above everything.

| Property    | Value                                                     |
| ----------- | --------------------------------------------------------- |
| Source      | **Pre-rendered PNG tile** in `public/grain.png`, repeated |
| Opacity     | `var(--grain-opacity)` = `0.04`, fixed                    |
| Position    | `fixed; inset: 0`                                         |
| Layer       | `var(--z-grain)` = 60                                     |
| Interaction | `pointer-events: none`, `aria-hidden="true"`              |
| Blend       | **None.** No `mix-blend-mode`.                            |

Deliberately **not** a live `<svg><feTurbulence>` filter. A full-viewport SVG
filter re-rasterises on scroll and on any repaint underneath it, which violates
rule 7. The tile is generated once (a build-time or design-time step) and served
as a static image — visually identical, effectively free.

`mix-blend-mode` is avoided for the same reason: a full-screen blend layer
forces the entire page into a single composited group.

Grain is texture, not motion. It stays on under `prefers-reduced-motion`. It is
dropped on the `static` tier only as a bandwidth/paint saving.

---

## 4. The pinned opening — storyboard

The only place the site holds the viewport. One `PinnedSequence`: a tall outer
container with a `position: sticky; top: 0; height: 100svh` stage inside.

Scroll distance: **300vh** desktop, **180vh** below 768px. `svh` — not `vh` —
so mobile browser chrome resizing does not cause a jump.

| p             | Stage           | What happens                                                                                                                                                                |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.00 – 0.18` | **Still water** | Oversized serif **"Maren"** at `--text-hero`. The surface behind is held — only the aurora breathes. One positioning line below, already visible. Nothing else on screen.   |
| `0.18 – 0.42` | **Contraction** | The wordmark scales and translates toward its resting place in the top bar, handing off to `SiteHeader`. Simultaneously the water spreads: aurora blobs widen and separate. |
| `0.42 – 0.72` | **Brand story** | Story lines reveal one by one (§3.3), progress-driven rather than time-driven so the reader controls the pace.                                                              |
| `0.72 – 0.92` | **Dispersal**   | The surface breaks into light refraction — blobs scale up, separate, and drop in opacity. The venue image opens behind them via the image reveal (§3.4).                    |
| `0.92 – 1.00` | **Release**     | The stage settles to its final composition; the pin releases into normal document flow.                                                                                     |
| —             | **Normal flow** | Services (sticky panels), experience/process (second pinned sequence), blog teaser.                                                                                         |
| —             | **Settling**    | At the contact CTA the water form returns, gathers and comes to rest.                                                                                                       |

**Handoff detail.** The hero wordmark and the header wordmark are two elements,
cross-faded by scroll progress across `0.18 – 0.42`. One does not travel into
the other's DOM position. That keeps the header a plain sticky element with no
JS-driven layout, and it survives a mid-page refresh.

Below 768px, stages 2 and 3 merge: the wordmark contracts while the first two
story lines reveal, so the sequence is shorter without losing a beat.

### The second pinned sequence — process

`ExperienceProcess`. Three to four steps of what a visit is like, each holding
briefly as scroll advances. Same `PinnedSequence` primitive, ~200vh, no new
techniques. **This is the last pinned section on the site.**

---

## 5. Pinning technique

```
<section style="height: 300svh">          <!-- the scroll distance -->
  <div style="position: sticky; top: 0; height: 100svh">
    …stage…
  </div>
</section>
```

Progress comes from `useScroll({ target, offset: ['start start', 'end end'] })`
and is mapped with `useTransform`. **No smoothing on pinned progress** — the
stage must track the finger exactly. Only the aurora is smoothed (§3.1).

Why this and not a JS pinning library:

- Native scroll is untouched. Scrollbar, keyboard paging, `Home`/`End`,
  find-in-page, and browser scroll restoration all behave normally.
- No wheel or touch listeners, so no passive-listener jank and no fighting
  iOS momentum scrolling.
- It degrades to nothing: remove the sticky rule and the content is a normal
  tall section that still reads correctly.

**Where supported, prefer CSS scroll-driven animations.** Feature-detect
`CSS.supports('animation-timeline: view()')` and use `animation-timeline:
scroll()` / `view()` — these run off the main thread entirely. Fall back to
Motion's `useScroll` otherwise. Both paths must produce the same visual result;
the CSS path is an optimisation, not a different design.

**Accessibility inside a pinned stage**

- Focusable elements inside a stage that is not yet at its readable progress
  must not be reachable. Use `inert` on stages that are visually absent.
- A keyboard user tabbing into the sequence must land somewhere sensible; the
  page must never scroll to a position the user cannot reach with the keyboard.
- Content revealed at `p = 0.9` must still be findable by browser find-in-page.
  It is in the DOM the whole time — only `clip-path` and `opacity` change.

---

## 6. Motion tiers

```ts
type MotionTier = 'full' | 'reduced' | 'static';
```

Resolved **once**, before first paint, by a tiny inline script in `<head>` that
writes `data-motion-tier` onto `<html>`. CSS branches on the attribute, so
there is no flash of animated content and no hydration dependency.

| Tier      | When                                                                                                                    | Behaviour                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `reduced` | `prefers-reduced-motion: reduce`                                                                                        | Everything at final state. No scroll binding, no reveals, no view transitions. Aurora frozen. Grain stays. |
| `static`  | `navigator.connection.saveData`, or `deviceMemory ≤ 4`, or `hardwareConcurrency ≤ 4`, or `prefers-reduced-data: reduce` | Aurora → flat gradient. Panels → plain stack. No pinning. No reveals. Grain dropped.                       |
| `full`    | Everything else, **including when those APIs are unavailable**                                                          | The full art direction.                                                                                    |

`deviceMemory` and `connection` are Chromium-only. Absent means `full` — we do
not punish Safari and Firefox for not reporting.

QA override: `?motion=static` / `?motion=reduced` / `?motion=full` forces a tier
for testing. Development only; ignored in production builds.

**Reduced motion is a first-class layout, not a fallback.** Every section must
be reviewed at `reduced` for composition, spacing and rhythm — not merely
checked for "does it still work".

---

## 6b. The server does not know the tier

Server rendering happens before any tier detection, so the HTML is always the
**`full`** structure: a pinned wrapper, a sticky stage, reveal lines carrying
inline `clip-path`, and so on. React corrects it on hydration.

That correction is too late. A reduced-motion visitor would see a pinned,
clipped page for as long as hydration takes.

So the tier is corrected **in CSS, before hydration**:

```css
[data-motion-tier='reduced'] [data-pinned-sequence] {
  height: auto !important;
}
[data-motion-tier='reduced'] [data-reveal-line] {
  clip-path: none !important;
}
```

The attribute is written by the inline script before first paint, so these
apply with no JavaScript. `!important` is necessary because they override
inline styles written by the animation library — this is the narrow case where
it is correct.

**The rule that follows:** any tier difference that changes STRUCTURE or
VISIBILITY needs a CSS branch, not only a React branch. React branches are for
behaviour that cannot be expressed in CSS — scroll binding, `inert`, event
listeners. Anything a reduced-motion visitor would otherwise _see_ must be
handled before hydration.

`inert` is applied imperatively after mount for the same reason: rendered from
React state it would ship in the HTML, and a reduced-motion visitor would
receive inert content until hydration removed it.

---

## 7. Budget and enforcement

| Limit                              | Value                            |
| ---------------------------------- | -------------------------------- |
| Max discrete duration              | **400ms** (`--duration-slowest`) |
| Max scroll-linked settle           | **200ms** (`--duration-settle`)  |
| Max staggered items                | **6** (`--stagger-cap`)          |
| Max total stagger span             | ~620ms (6 × 60ms + 320ms)        |
| Pinned sections                    | **Exactly 2**                    |
| Signature interactions             | **Exactly 5** + grain            |
| Concurrent animated layers in view | **≤ 8**                          |
| Aurora blobs                       | **3**                            |
| Hover lift                         | `-4px`                           |

**Enforcement**

- Every duration, easing, stagger and threshold comes from
  `src/config/motion.ts`, which re-exports the CSS tokens. There is one source.
- ESLint `no-restricted-syntax` forbids numeric duration literals inside
  `src/components/` — a raw `duration: 0.6` fails lint, not review.
- Adding a sixth signature interaction or a third pinned section is an
  `docs/OPEN-QUESTIONS.md` entry requiring owner approval, not a code change.

---

## 8. Implementation notes

- Library: `motion` (MIT), imported as `motion/react`. No GSAP (licence), no
  ScrollTrigger, no smooth-scroll wrapper.
- Prefer `motion/react`'s `useScroll` + `useTransform` over `useState` +
  listeners. Never `setState` in a scroll handler.
- `will-change: transform` is added on mount and **removed when the element
  leaves the viewport**. Leaving it on permanently costs memory on every layer.
- Every scroll-linked element is `aria-hidden` if it is purely decorative
  (aurora, water form, grain).
- Animated components live in `src/components/motion/` and are the only place
  `'use client'` appears for animation reasons (`CLAUDE.md` §5).
- A component that animates does not also fetch or read content.

---

## 8b. Review surface

`npm run dev` → **`/motion`**. Dev-only, `noindex`, 404 in production, and
covered by the `development` Playwright project so it cannot quietly break.

It exists to be judged by eye, at shipping values:

| Section         | What to judge                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Grain weight    | On/off pairs over ivory, rose beige, nude and espresso at the real 4%. Grain reads strongest on dark.  |
| Aurora          | Frozen at four scroll positions for side-by-side comparison, plus live behind the page.                |
| Rose in use     | §1.7 applied — large fill, tinted card, divider, image overlay.                                        |
| Three tiers     | `full` / `reduced` / `static` side by side. Review `reduced` for composition, not merely for function. |
| Pinned sequence | The sticky stage, at 250svh.                                                                           |
| Sticky panels   | 40px radius, 0.96 scale, 0.55 dim.                                                                     |
| Budget          | The numbers, from `src/config/motion.ts`.                                                              |

Force a tier with `?motion=full|reduced|static`. The override is
development-only: the flag is substituted at build time, so in production the
branch is a literal `false` and disappears from the bundle.

---

## 9. QA checklist

Run before any motion work is marked done:

- [ ] `prefers-reduced-motion: reduce` — every section reviewed for composition,
      not just function. No motion anywhere. Grain still present.
- [ ] `static` tier via `?motion=static` — flat gradient, plain stacks, readable.
- [ ] Keyboard only: full traversal, no trap, no unreachable content, visible
      focus at every step inside pinned stages.
- [ ] Screen reader: reading order matches visual order; decorative layers are
      silent; revealed text is announced.
- [ ] Find-in-page locates text that has not yet revealed.
- [ ] DevTools Performance, 6× CPU throttle, full-page scroll: no layout or
      paint in the flame chart during scroll — composite only.
- [ ] Mobile Safari: no jump when the address bar collapses (`svh` verified).
- [ ] Refresh mid-pin, then scroll up and down — state is correct both ways.
- [ ] Rapid scroll to the bottom and back: no stuck panel, no orphaned
      `view-transition-name`, no leaked `will-change`.
- [ ] 320px width: pinned sequences shortened, nothing clipped, nothing
      horizontally scrollable.
- [ ] Every text-over-aurora pairing checked at its worst-case scroll position.

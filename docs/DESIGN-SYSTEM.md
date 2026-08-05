# DESIGN SYSTEM — Maren Beauty

Single source of truth for colour, type, spacing, radii, shadow and motion
tokens. Implemented in `src/styles/theme.css` as a Tailwind v4 `@theme` block.

**Every contrast ratio in this document was computed, not estimated.** Formula:
WCAG 2.1 relative luminance, sRGB. If you change a hex value you must recompute
the pairing table before committing.

Light theme only. `color-scheme: light`. No dark mode — but every colour is
exposed as a _semantic_ token so a dark theme could be added later without
touching a component.

---

## 1. Colour

### 1.1 Design intent

Warm cream, soft nude, rose beige, ivory and muted rose, with a subtle
champagne accent. The whole ramp is warm — hues sit between **20° and 45°**
(orange-red through gold). There is no cool grey and no blue anywhere in the
system, including shadows.

**Saturation is capped deliberately.** Nothing in the ramp is a saturated pink.
The rosiest colour, `muted-rose`, is a dusty rose-brown at roughly 22%
saturation. If a colour ever reads as "pink" rather than "rose beige", it is
wrong.

### 1.2 Primitive ramp

Primitives exist **only** to define semantic tokens. Never use a primitive
directly in a component (`CLAUDE.md` §14).

#### Warm neutrals — light end

| Token           | Hex       | Role                                    |
| --------------- | --------- | --------------------------------------- |
| `--color-ivory` | `#FEFCF9` | Lightest surface. Cards, raised panels. |
| `--color-cream` | `#FAF4EC` | Page background. The site's base note.  |
| `--color-sand`  | `#F3EADF` | Sunken/alternating sections.            |
| `--color-nude`  | `#EBDCCD` | Accent surface, hairlines, quiet fills. |

#### Rose family

| Token                | Hex       | Role                                        |
| -------------------- | --------- | ------------------------------------------- |
| `--color-rose-beige` | `#DFC9BB` | Decorative surface, dividers.               |
| `--color-blush`      | `#D2B3A5` | Deeper decorative surface.                  |
| `--color-muted-rose` | `#B98D83` | **Decorative only.** Fails text contrast.   |
| `--color-rosewood`   | `#8A5D55` | Accent text, control borders, accent fills. |

#### Warm darks

| Token              | Hex       | Role                                         |
| ------------------ | --------- | -------------------------------------------- |
| `--color-clay`     | `#7C564C` | Muted body text, focus ring.                 |
| `--color-cocoa`    | `#55372F` | Secondary text.                              |
| `--color-espresso` | `#3A241E` | Inverse surface, dark sections.              |
| `--color-ink`      | `#241511` | Primary text. Warm near-black, never `#000`. |

#### Champagne accent

Used sparingly — hairlines, a rule under an eyebrow label, a small mark. It is
a _seasoning_, not a brand colour. Target: under 2% of any viewport.

| Token                     | Hex       | Role                                        |
| ------------------------- | --------- | ------------------------------------------- |
| `--color-champagne-light` | `#EFE2C6` | Decorative on dark surfaces.                |
| `--color-champagne`       | `#DEC79C` | **Decorative on light. Text only on dark.** |
| `--color-champagne-deep`  | `#7E6334` | The only champagne safe as text on light.   |

#### Feedback

Warm-shifted so they belong to the palette rather than looking bolted on.

| Token                      | Hex       | Role                              |
| -------------------------- | --------- | --------------------------------- |
| `--color-feedback-error`   | `#8F3527` | Form errors.                      |
| `--color-feedback-success` | `#3F5F45` | Form success.                     |
| `--color-feedback-info`    | `#4A5A6B` | Neutral notices, pre-launch band. |

### 1.3 Semantic tokens

**These are what components use.**

```css
/* Surfaces */
--color-surface-page: var(--color-cream);
--color-surface-raised: var(--color-ivory);
--color-surface-sunken: var(--color-sand);
--color-surface-accent: var(--color-nude);
--color-surface-decor: var(--color-rose-beige);
--color-surface-inverse: var(--color-espresso);

/* Text */
--color-text-primary: var(--color-ink);
--color-text-secondary: var(--color-cocoa);
--color-text-muted: var(--color-clay);
--color-text-accent: var(--color-rosewood);
--color-text-gold: var(--color-champagne-deep);
--color-text-on-inverse: var(--color-ivory);
--color-text-on-accent: var(--color-ivory);

/* Borders */
--color-border-subtle: var(--color-nude); /* decorative only */
--color-border-decor: var(--color-rose-beige); /* decorative only */
--color-border-strong: var(--color-rosewood); /* controls, ≥3:1 */

/* Interaction */
--color-focus-ring: var(--color-clay);
--color-accent-solid: var(--color-rosewood); /* filled buttons */
--color-accent-solid-hover: var(--color-clay);
--color-accent-decor: var(--color-champagne); /* hairlines, marks */
```

### 1.4 Permitted pairings — computed

**Only pairings marked ✅ may be used.** Anything else is a bug, whatever it
looks like on your monitor.

Thresholds: **AA body ≥ 4.5:1**, **AA large (≥24px, or ≥18.66px bold) ≥ 3:1**,
**non-text (borders, focus, icons carrying meaning) ≥ 3:1**.

#### Dark text on light surfaces

| Text                       | on `ivory`       | on `cream`       | on `sand`        | on `nude`              | on `rose-beige`        | on `blush`             |
| -------------------------- | ---------------- | ---------------- | ---------------- | ---------------------- | ---------------------- | ---------------------- |
| `ink` `#241511`            | **17.23** ✅ AAA | **16.14** ✅ AAA | **14.82** ✅ AAA | **13.15** ✅ AAA       | **11.10** ✅ AAA       | **9.02** ✅ AAA        |
| `espresso` `#3A241E`       | **14.13** ✅ AAA | **13.24** ✅ AAA | **12.16** ✅ AAA | **10.79** ✅ AAA       | **9.10** ✅ AAA        | **7.40** ✅ AAA        |
| `cocoa` `#55372F`          | **10.39** ✅ AAA | **9.74** ✅ AAA  | **8.94** ✅ AAA  | **7.93** ✅ AAA        | **6.69** ✅ AA         | **5.44** ✅ AA         |
| `clay` `#7C564C`           | **6.23** ✅ AA   | **5.84** ✅ AA   | **5.36** ✅ AA   | **4.75** ✅ AA         | **4.01** ⚠️ large only | **3.26** ⚠️ large only |
| `rosewood` `#8A5D55`       | **5.43** ✅ AA   | **5.09** ✅ AA   | **4.67** ✅ AA   | **4.14** ⚠️ large only | 3.51 ⚠️ large only     | 2.85 ❌                |
| `champagne-deep` `#7E6334` | **5.51** ✅ AA   | **5.16** ✅ AA   | **4.74** ✅ AA   | **4.21** ⚠️ large only | 3.57 ⚠️ large only     | 2.90 ❌                |
| `muted-rose` `#B98D83`     | 2.85 ❌          | 2.67 ❌          | 2.45 ❌          | 2.17 ❌                | 1.83 ❌                | 1.49 ❌                |

#### Light text on dark surfaces

| Text                        | on `espresso`    | on `ink`         | on `cocoa`       | on `clay`          | on `rosewood`          |
| --------------------------- | ---------------- | ---------------- | ---------------- | ------------------ | ---------------------- |
| `ivory` `#FEFCF9`           | **14.13** ✅ AAA | **17.23** ✅ AAA | **10.39** ✅ AAA | **6.23** ✅ AA     | **5.43** ✅ AA         |
| `cream` `#FAF4EC`           | **13.24** ✅ AAA | **16.14** ✅ AAA | **9.74** ✅ AAA  | **5.84** ✅ AA     | **5.09** ✅ AA         |
| `sand` `#F3EADF`            | **12.16** ✅ AAA | **14.82** ✅ AAA | **8.94** ✅ AAA  | **5.36** ✅ AA     | **4.67** ✅ AA         |
| `nude` `#EBDCCD`            | **10.79** ✅ AAA | **13.15** ✅ AAA | **7.93** ✅ AAA  | **4.75** ✅ AA     | **4.14** ⚠️ large only |
| `champagne-light` `#EFE2C6` | **11.28** ✅ AAA | **13.75** ✅ AAA | **8.29** ✅ AAA  | **4.97** ✅ AA     | 4.33 ⚠️ large only     |
| `champagne` `#DEC79C`       | **8.79** ✅ AAA  | **10.72** ✅ AAA | **6.46** ✅ AA   | 3.87 ⚠️ large only | 3.37 ⚠️ large only     |

#### Feedback text on light surfaces

| Text                         | on `ivory`      | on `cream`      | on `sand`      |
| ---------------------------- | --------------- | --------------- | -------------- |
| `feedback-error` `#8F3527`   | **7.58** ✅ AAA | **7.10** ✅ AAA | **6.52** ✅ AA |
| `feedback-success` `#3F5F45` | **6.99** ✅ AA  | **6.55** ✅ AA  | **6.01** ✅ AA |
| `feedback-info` `#4A5A6B`    | **6.91** ✅ AA  | **6.48** ✅ AA  | **5.95** ✅ AA |

`ivory` on `feedback-error` = **7.58** ✅ (for solid error chips).

#### Non-text: borders, focus rings, meaningful icons (need ≥3:1)

| Colour                      | vs `ivory`  | vs `cream`  | vs `sand`   | vs `nude`   | vs `rose-beige` | vs `blush`  |
| --------------------------- | ----------- | ----------- | ----------- | ----------- | --------------- | ----------- |
| `clay` (focus ring)         | **6.23** ✅ | **5.84** ✅ | **5.36** ✅ | **4.75** ✅ | **4.01** ✅     | **3.26** ✅ |
| `rosewood` (control border) | **5.43** ✅ | **5.09** ✅ | **4.67** ✅ | **4.14** ✅ | 3.51 ✅         | 2.85 ❌     |
| `muted-rose`                | 2.85 ❌     | 2.67 ❌     | 2.45 ❌     | 2.17 ❌     | —               | —           |
| `champagne`                 | 1.61 ❌     | 1.51 ❌     | 1.38 ❌     | 1.23 ❌     | —               | —           |
| `rose-beige`                | 1.55 ❌     | 1.45 ❌     | 1.34 ❌     | —           | —               | —           |

### 1.5 Hard colour rules

1. **`clay` is the focus ring** — it is the only colour clearing 3:1 against
   every surface in the system, including `blush`. Do not use anything else.
2. **`muted-rose`, `champagne`, `rose-beige`, `nude` and `blush` are decorative
   only** on light surfaces. Never text. Never a control boundary. Never an
   icon that carries meaning on its own.
3. **Input, select and textarea borders use `border-strong` (`rosewood`)** —
   `border-subtle` fails 3:1 and would make fields invisible to low-vision
   users. `border-subtle` is for decorative dividers only.
4. **Body text sits only on `ivory`, `cream` or `sand`.** On `nude`,
   `rose-beige` or `blush`, only `ink`, `espresso` or `cocoa` are permitted.
5. **Never `#000` or `#FFF`.** `ink` and `ivory` replace them everywhere,
   including shadows and overlays.
6. **Never an inline colour literal in a component.** Tokens only.
7. **Colour is never the only signal.** Errors carry an icon and text; links in
   prose are underlined.
8. **Text over the aurora background or over a photograph** requires either a
   scrim (`espresso` at 55%+) or a solid token surface behind it. The aurora
   shifts as you scroll, so contrast must be verified at _worst case_, not at
   rest — see `docs/MOTION.md` §3.1.

### 1.6 Aurora gradient stops

The scroll-linked background wash (`docs/MOTION.md` §3.1) is driven by
per-section CSS variables, so the gradient is data, not markup.

```css
--aurora-a: var(--color-cream); /* base wash */
--aurora-b: var(--color-nude); /* mid */
--aurora-c: var(--color-rose-beige); /* accent bloom */
--aurora-alpha: 0.55; /* max stop opacity */
--aurora-blur: 90px;
```

Per-section overrides shift `--aurora-b` / `--aurora-c` only. `--aurora-a`
stays `cream` for the whole page so there is never a hard boundary. No section
may push the wash dark enough to break rule 8 above.

---

## 2. Typography

### 2.1 Families

| Role    | Family                  | Licence | Usage                        |
| ------- | ----------------------- | ------- | ---------------------------- |
| Display | **Fraunces** (variable) | OFL-1.1 | `h1`–`h3`, hero, pull quotes |
| Text    | **Manrope** (variable)  | OFL-1.1 | Body, UI, labels, `h4`–`h6`  |

Fraunces axes: `wght` 300–600, `opsz` auto, `SOFT` 60 (softened terminals — the
water register), **`WONK` 0** (the quirky alternates are off; they read as
playful, which is wrong here).

**Self-hosted only**, `next/font/local`, `woff2`, `font-display: swap`,
subset `latin` + `latin-ext`. No runtime call to any font CDN, ever.

> **F1 verified at M1 — both families pass.** `npm run fonts` decodes the
> shipped `.woff2`, reads the real `cmap`, and asserts all 20 required
> codepoints. It runs inside `npm run verify`, so a font change that drops a
> Turkish glyph fails the build rather than being noticed in production.

**Two things the `fvar` read caught — do not remove the corrections:**

Fraunces ships axis defaults that are wrong for this brand: **`wght` defaults to
900** and **`WONK` defaults to 1** (the quirky alternates). Using the family
without setting them gives a black, quirky display face. `globals.css` corrects
both on `.font-display`, and `opsz` is deliberately _omitted_ from
`font-variation-settings` because naming it there would disable
`font-optical-sizing: auto`. Manrope defaults to `wght` 200; base weight is set
explicitly.

**Subsets.** Turkish needs both Google subsets and they are disjoint — `latin`
carries `ı` (U+0131) plus `ç ö ü`; `latin-ext` carries `ğ ş İ`. Each is its own
`@font-face` with its own `unicode-range`.

| File                       | Bytes   |
| -------------------------- | ------- |
| `fraunces-latin.woff2`     | 121,016 |
| `fraunces-latin-ext.woff2` | 105,244 |
| `manrope-latin.woff2`      | 24,836  |
| `manrope-latin-ext.woff2`  | 15,120  |

Fraunces is 226 KB because it keeps all four axes. Pinning `opsz` would cut it
to 122 KB but costs optical sizing across a 30–240px range, which this design
uses. Recorded as an M15 performance decision, not taken silently.

### 2.2 Scale

Fluid via `clamp()`. Base 16px → 17px on wide viewports.

| Token         | Clamp                                        | Range    | Use                             |
| ------------- | -------------------------------------------- | -------- | ------------------------------- |
| `--text-2xs`  | `0.6875rem`                                  | 11px     | Legal fine print, image credits |
| `--text-xs`   | `0.75rem`                                    | 12px     | Captions, meta                  |
| `--text-sm`   | `0.875rem`                                   | 14px     | Labels, nav, form hints         |
| `--text-base` | `clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)`   | 16→17px  | Body                            |
| `--text-lg`   | `clamp(1.125rem, 1.08rem + 0.22vw, 1.25rem)` | 18→20px  | Lead paragraph                  |
| `--text-xl`   | `clamp(1.25rem, 1.16rem + 0.45vw, 1.5rem)`   | 20→24px  | `h5`, large lead                |
| `--text-2xl`  | `clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)`  | 24→30px  | `h4`, card titles               |
| `--text-3xl`  | `clamp(1.875rem, 1.62rem + 1.25vw, 2.5rem)`  | 30→40px  | `h3`                            |
| `--text-4xl`  | `clamp(2.25rem, 1.8rem + 2.25vw, 3.5rem)`    | 36→56px  | `h2`, section heads             |
| `--text-5xl`  | `clamp(2.75rem, 2rem + 3.75vw, 4.5rem)`      | 44→72px  | `h1`                            |
| `--text-6xl`  | `clamp(3.25rem, 2.1rem + 5.75vw, 6rem)`      | 52→96px  | Statement lines                 |
| `--text-hero` | `clamp(4rem, 16vw, 15rem)`                   | 64→240px | The word "Maren" only           |

Ratio is roughly a major third (1.25) through the body range, widening at the
top so display sizes have real presence. `--text-hero` is used exactly once on
the site.

### 2.3 Line height and tracking

| Token               | Value  | Applies to      |
| ------------------- | ------ | --------------- |
| `--leading-hero`    | `0.86` | `--text-hero`   |
| `--leading-display` | `1.02` | `5xl`, `6xl`    |
| `--leading-heading` | `1.16` | `2xl`–`4xl`     |
| `--leading-body`    | `1.65` | Body prose      |
| `--leading-tight`   | `1.35` | Cards, dense UI |
| `--leading-ui`      | `1.45` | Buttons, labels |

| Token                | Value     | Applies to               |
| -------------------- | --------- | ------------------------ |
| `--tracking-hero`    | `-0.04em` | `--text-hero`            |
| `--tracking-display` | `-0.02em` | `4xl`–`6xl`              |
| `--tracking-normal`  | `0`       | Body                     |
| `--tracking-wide`    | `0.08em`  | Buttons, small caps      |
| `--tracking-eyebrow` | `0.16em`  | Uppercase eyebrow labels |

**Turkish caveat:** uppercase is used only for short eyebrow labels (1–3 words).
Turkish uppercase is longer than English and `İ`/`I` casing is locale-specific —
never `text-transform: uppercase` on a sentence, and never on a word containing
`i` or `ı` unless checked visually. Prefer `font-variant: small-caps` off; use
authored uppercase strings in config where it matters.

### 2.4 Measure

Implemented in the `--container-*` namespace so they generate `max-w-*`
utilities.

| Token                 | Utility         | Value    | Use                                    |
| --------------------- | --------------- | -------- | -------------------------------------- |
| `--container-reading` | `max-w-reading` | `68ch`   | Blog and service body copy             |
| `--container-lead`    | `max-w-lead`    | `52ch`   | Lead paragraphs, section intros        |
| `--container-display` | `max-w-display` | `20ch`   | Large headings — forces early wrapping |
| `--container-page`    | `max-w-page`    | `1200px` | Standard content column                |
| `--container-wide`    | `max-w-wide`    | `1440px` | Full-bleed media, panel stack          |

> **Why `reading` and not `prose`.** Tailwind ships a **static** `max-w-prose`
> utility (65ch) that `--container-*: initial` does not clear, so a token named
> `prose` is silently shadowed and the measure comes out 65ch instead of 68ch.
> Caught by reading the built CSS at M1. Renaming was the fix; do not rename it
> back.

Body prose never exceeds 68ch. Display headings wrap early on purpose; the
line-by-line reveal (`docs/MOTION.md` §3.3) depends on there being lines.

### 2.5 Rules

- One `h1` per page. Never skip a level. Never pick a heading tag for its size.
- Display face for `h1`–`h3` only; `h4`–`h6` are Manrope at weight 600.
- Never letter-space lowercase body text.
- No text over 6 lines in the display face — Fraunces at scale is for
  statements, not paragraphs.
- Prose links: `text-accent` + underline with `text-underline-offset: 0.2em`.
  Underline is not removable on hover; it thickens.
- Numerals: tabular in tables and durations, proportional in prose.

---

## 3. Spacing

4px base unit. Only these steps exist.

| Token       | px  |     | Token        | px  |
| ----------- | --- | --- | ------------ | --- |
| `--space-0` | 0   |     | `--space-10` | 40  |
| `--space-1` | 4   |     | `--space-12` | 48  |
| `--space-2` | 8   |     | `--space-16` | 64  |
| `--space-3` | 12  |     | `--space-20` | 80  |
| `--space-4` | 16  |     | `--space-24` | 96  |
| `--space-5` | 20  |     | `--space-32` | 128 |
| `--space-6` | 24  |     | `--space-40` | 160 |
| `--space-8` | 32  |     | `--space-48` | 192 |

### Layout tokens

| Token                     | Value                       | Meaning                       |
| ------------------------- | --------------------------- | ----------------------------- |
| `--space-section-y`       | `clamp(4rem, 9vw, 10rem)`   | Vertical section rhythm       |
| `--space-section-y-tight` | `clamp(2.5rem, 5vw, 5rem)`  | Adjacent related blocks       |
| `--space-gutter`          | `clamp(1.25rem, 4vw, 3rem)` | Page side padding             |
| `--width-container`       | `1200px`                    | Standard content column       |
| `--width-wide`            | `1440px`                    | Full-bleed media, panel stack |
| `--width-prose`           | `68ch`                      | Reading column                |

**No arbitrary spacing values.** If a layout needs 13px, the layout is wrong.

---

## 4. Radii

| Token            | Value    | Use                                                  |
| ---------------- | -------- | ---------------------------------------------------- |
| `--radius-none`  | `0`      | Full-bleed media                                     |
| `--radius-xs`    | `2px`    | Focus outlines on inline elements                    |
| `--radius-sm`    | `4px`    | Tags, chips                                          |
| `--radius-md`    | `8px`    | Inputs, small buttons                                |
| `--radius-lg`    | `14px`   | Buttons, small cards                                 |
| `--radius-xl`    | `22px`   | Cards, image frames                                  |
| `--radius-2xl`   | `32px`   | Feature blocks                                       |
| `--radius-panel` | `40px`   | **Sticky stacked service panels — top corners only** |
| `--radius-full`  | `9999px` | Pills, avatars                                       |

`--radius-panel` is fixed by the art direction: `40px 40px 0 0`. It is not a
tunable.

---

## 5. Shadows

All shadows are **warm** — tinted with `espresso` (`58, 36, 30`), never neutral
black. A cool shadow instantly breaks the palette.

| Token            | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `--shadow-xs`    | `0 1px 2px rgb(58 36 30 / 0.05)`                                               |
| `--shadow-sm`    | `0 2px 6px -1px rgb(58 36 30 / 0.07), 0 1px 2px rgb(58 36 30 / 0.05)`          |
| `--shadow-md`    | `0 6px 16px -4px rgb(58 36 30 / 0.09), 0 2px 6px -2px rgb(58 36 30 / 0.06)`    |
| `--shadow-lg`    | `0 16px 36px -10px rgb(58 36 30 / 0.12), 0 4px 12px -4px rgb(58 36 30 / 0.07)` |
| `--shadow-xl`    | `0 32px 64px -20px rgb(58 36 30 / 0.16), 0 8px 20px -8px rgb(58 36 30 / 0.08)` |
| `--shadow-panel` | `0 -18px 48px -24px rgb(58 36 30 / 0.18)`                                      |
| `--shadow-focus` | `0 0 0 2px var(--color-surface-page), 0 0 0 4px var(--color-focus-ring)`       |

`--shadow-panel` casts **upward** — it is what separates a sticky panel from
the one beneath it in the stack.

**Never animate `box-shadow`.** To animate elevation, cross-fade a pseudo-element
carrying the shadow via `opacity` (`docs/MOTION.md` §5).

### Overlays and scrims

| Token             | Value                  | Use                                   |
| ----------------- | ---------------------- | ------------------------------------- |
| `--scrim-soft`    | `rgb(58 36 30 / 0.35)` | Light text over bright imagery        |
| `--scrim-strong`  | `rgb(58 36 30 / 0.60)` | Guarantees AA over any photo          |
| `--grain-opacity` | `0.04`                 | Site-wide grain overlay — fixed at 4% |

---

## 6. Elevation / z-index

Only these values. No arbitrary `z-50`.

| Token         | Value | Layer                                                    |
| ------------- | ----- | -------------------------------------------------------- |
| `--z-base`    | `0`   | Flow content                                             |
| `--z-aurora`  | `-1`  | Scroll-linked background wash                            |
| `--z-raised`  | `10`  | Cards on hover, stacked panels                           |
| `--z-sticky`  | `20`  | Sticky panel stack, in-page sticky bits                  |
| `--z-header`  | `40`  | Site header                                              |
| `--z-overlay` | `50`  | Mobile menu, dialogs                                     |
| `--z-grain`   | `60`  | Grain overlay — above everything, `pointer-events: none` |
| `--z-toast`   | `70`  | Form feedback                                            |

---

## 7. Motion tokens

Full art direction and the five signature interactions: **`docs/MOTION.md`**.
These are the raw tokens only.

### Durations — 400ms is a hard ceiling

| Token                | Value   | Use                                |
| -------------------- | ------- | ---------------------------------- |
| `--duration-instant` | `0ms`   | Reduced-motion resolution          |
| `--duration-fast`    | `140ms` | Hover, focus, small state change   |
| `--duration-base`    | `220ms` | Default transition                 |
| `--duration-slow`    | `320ms` | Reveals, panel entry               |
| `--duration-slowest` | `400ms` | **Ceiling. Nothing exceeds this.** |
| `--duration-settle`  | `200ms` | Scroll-linked smoothing — max lag  |

### Easings

| Token             | Value                              | Character                           |
| ----------------- | ---------------------------------- | ----------------------------------- |
| `--ease-standard` | `cubic-bezier(0.2, 0.6, 0.2, 1)`   | General                             |
| `--ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)`    | Things arriving                     |
| `--ease-exit`     | `cubic-bezier(0.4, 0, 1, 1)`       | Things leaving                      |
| `--ease-water`    | `cubic-bezier(0.33, 0.9, 0.28, 1)` | Signature. Aurora, panels, reveals. |

`--ease-water` is the brand easing: quick to move, long unhurried settle. Use it
for anything the visitor is meant to feel rather than notice.

### Stagger

| Token            | Value  | Use                                                  |
| ---------------- | ------ | ---------------------------------------------------- |
| `--stagger-line` | `60ms` | Line-by-line text reveal                             |
| `--stagger-item` | `40ms` | Card/list entrance                                   |
| `--stagger-cap`  | `6`    | Max staggered items; beyond this, animate as a group |

A 10-item stagger at 60ms takes 600ms to finish — over budget. Cap at 6.

### Transform limits

| Token                  | Value                                   |
| ---------------------- | --------------------------------------- |
| `--motion-lift`        | `-4px` (hover translate)                |
| `--motion-image-scale` | `1.12` → `1` (image reveal inner scale) |
| `--motion-panel-scale` | `0.96` (outgoing sticky panel)          |
| `--motion-panel-dim`   | `0.55` (outgoing panel scrim opacity)   |

### Non-negotiables

- Animate only `transform`, `opacity`, `clip-path`, `filter`.
- `prefers-reduced-motion: reduce` → final state at `--duration-instant`. Not
  a faster animation; no animation.
- Scroll is never hijacked. Only animation _progress_ binds to scroll.
- Every animated layer is GPU-composited. If it repaints on scroll, it is out.

---

## 8. Implementation

`src/styles/theme.css`, Tailwind v4 CSS-first. **As built at M1.**

The two-layer split is load-bearing, not cosmetic:

```css
@theme {
  /* 1 — clear Tailwind's defaults, so bg-red-500 and the stock
         text-lg cannot bypass the system */
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --ease-*: initial;
  --container-*: initial;
  --spacing: initial;

  /* 2 — PRIMITIVES as --mb-*. Inside @theme, so they are emitted as CSS
         variables, but OUTSIDE every Tailwind namespace, so NO utility is
         generated. `bg-ivory` does not exist and never compiles. */
  --mb-ivory: #fefcf9;
  --mb-cream: #faf4ec;
  /* …18 colour primitives, §1.2… */

  /* 3 — SEMANTICS. These generate the utilities components use. */
  --color-surface-page: var(--mb-cream);
  --color-surface-raised: var(--mb-ivory);
  --color-text-primary: var(--mb-ink);
  /* …full set, §1.3… */

  --font-display: var(--mb-font-display), ui-serif, Georgia, serif;
  --font-sans: var(--mb-font-sans), ui-sans-serif, system-ui, sans-serif;

  /* …type, spacing, radius, shadow, motion tokens per §2–§7… */
}

:root {
  color-scheme: light;
}
```

**Why primitives are `--mb-*` rather than `--color-*`:** CLAUDE.md §14 forbids
using a primitive directly in a component. Declaring them under `--color-*`
would generate `bg-ivory`, `text-cocoa` and so on, making that rule a review
note that someone eventually forgets. Keeping them outside the namespace makes
it a compile-time impossibility instead. Verified in the built CSS at M1:
`bg-ivory`, `bg-cream`, `text-ink` and `bg-red-500` all produce zero rules.

**Spacing:** Tailwind's dynamic `--spacing` base is cleared and the steps in §3
are declared explicitly, so `p-7` and `p-13` do not compile either.

**Z-index and the focus ring** are exposed as `@utility` rules (`z-header`,
`focus-ring`) so the elevation scale cannot be invented inline.

Semantic tokens are the public API of this system. When adding a component, if
you cannot express it with an existing semantic token, **add a semantic token
here first** — do not reach for a primitive or a literal.

### Reviewing this system

`npm run dev` → **`/styleguide`**. Every colour token with its contrast against
each surface computed live from `theme.css`, the type scale set in Turkish, the
glyph specimen, spacing, radii, shadows and every control state. It reads the
token file at build time, so it cannot drift from what ships. Development only:
it 404s in production and is `noindex`.

---

## 9. Change control

Changing any hex value requires, in the same commit:

1. Recomputing every affected row in §1.4 with the WCAG 2.1 formula.
2. Updating this document with the new ratios.
3. Confirming no pairing in use anywhere drops below its threshold.
4. `npm run verify` passing, including `npm run test:a11y`.

Do not eyeball contrast. Do not trust a design tool's rounding. Compute it.

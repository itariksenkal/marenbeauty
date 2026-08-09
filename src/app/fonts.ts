import localFont from 'next/font/local';

/**
 * Self-hosted OFL-1.1 fonts. Zero runtime requests to any font CDN — a privacy
 * and portability requirement, not just a performance one (CLAUDE.md §2).
 *
 * Turkish needs BOTH Google subsets and they are disjoint:
 *   latin      — ç ö ü and, carved out explicitly, ı (U+0131)
 *   latin-ext  — ğ ş İ (U+0100–02BA)
 *
 * next/font/local cannot attach a unicode-range to entries in a single `src`
 * array, so each subset is its own face with its own range, exactly as Google
 * serves them. The browser picks per codepoint; both faces are the same
 * typeface, so the join is invisible.
 *
 * The ranges are repeated inline rather than shared via a constant because
 * next/font statically analyses these call sites at build time. A referenced
 * constant — or any concatenation — resolves to `undefined` and the build
 * fails with "missing field `value`". Do not refactor them into a variable.
 *
 * Coverage is not assumed: `npm run fonts` decodes these .woff2 files and
 * asserts every required Turkish codepoint is in the cmap we ship.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ONLY THE LAST FACE OF EACH FAMILY CARRIES A METRIC FALLBACK, AND THAT IS
 * LOAD-BEARING.
 *
 * `adjustFontFallback` makes next/font emit a second family — `"<name>
 * Fallback"` — that re-metrics a local face to cut layout shift. It is
 * emitted with NO `unicode-range`, so it matches every codepoint there is,
 * and each variable expands to `<name>, "<name> Fallback"`. With it left on
 * the latin face the display stack resolved to:
 *
 *   frauncesLatin, "frauncesLatin Fallback", frauncesLatinExt, …
 *
 * `ş` is excluded from `frauncesLatin` by its unicode-range, so the browser
 * moved to the next family — the unrestricted FALLBACK — and never reached
 * `frauncesLatinExt`. Every ş, ğ, İ, Ş and Ğ on the site was drawn in a
 * re-metricked Times, mid-sentence, on a Turkish site. `document.fonts.check`
 * reported it plainly: `false` for 'ş' against the display stack.
 *
 * This is exactly the failure `scripts/verify-fonts.mjs` was written to
 * prevent, and that script could not see it: the glyph IS in the cmap we
 * ship, and the cascade never asked for it. Coverage and reachability are two
 * different properties. A browser test now pins the second one.
 *
 * So the latin faces set `adjustFontFallback: false` and the ext faces keep
 * theirs. One adjusted fallback per family, sitting LAST, after both real
 * subsets — which is where a fallback belongs. Nothing is lost: both files
 * are the same typeface, so the ext face's metrics are the family's metrics.
 * ─────────────────────────────────────────────────────────────────────────
 */

const frauncesLatin = localFont({
  src: '../fonts/fraunces-latin.woff2',
  display: 'swap',
  weight: '300 700',
  style: 'normal',
  // See the block above — this must stay `false`, or it shadows the ext face.
  adjustFontFallback: false,
  variable: '--font-fraunces-latin',
  declarations: [
    {
      prop: 'unicode-range',
      /* prettier-ignore */
      value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});

const frauncesLatinExt = localFont({
  src: '../fonts/fraunces-latin-ext.woff2',
  display: 'swap',
  weight: '300 700',
  style: 'normal',
  variable: '--font-fraunces-latin-ext',
  declarations: [
    {
      prop: 'unicode-range',
      /* prettier-ignore */
      value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
});

const manropeLatin = localFont({
  src: '../fonts/manrope-latin.woff2',
  display: 'swap',
  weight: '300 800',
  style: 'normal',
  // See the block at the top — this must stay `false`, or it shadows the ext
  // face and every Turkish ş, ğ and İ in body copy is drawn in Arial.
  adjustFontFallback: false,
  variable: '--font-manrope-latin',
  declarations: [
    {
      prop: 'unicode-range',
      /* prettier-ignore */
      value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});

const manropeLatinExt = localFont({
  src: '../fonts/manrope-latin-ext.woff2',
  display: 'swap',
  weight: '300 800',
  style: 'normal',
  variable: '--font-manrope-latin-ext',
  declarations: [
    {
      prop: 'unicode-range',
      /* prettier-ignore */
      value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
});

/** Applied once on <html>; theme.css reads --mb-font-display / --mb-font-sans. */
export const fontVariables = [
  frauncesLatin.variable,
  frauncesLatinExt.variable,
  manropeLatin.variable,
  manropeLatinExt.variable,
].join(' ');

/**
 * Shell strings.
 *
 * Components may not contain user-facing Turkish (CLAUDE.md §7), and the
 * layout shell needs a few labels before the full config layer exists. M2
 * folds these into `site.ts` / `navigation.ts` and deletes this file.
 */
export const ui = {
  /** Brand name. A proper noun, not copy. Moves to site.ts at M2. */
  brand: 'Maren Beauty',

  /** First focusable element on every page; jumps to <main id="main">. */
  skipToContent: 'İçeriğe geç',

  /** Footer attribution line. Year is stamped at render, never hardcoded. */
  allRightsReserved: 'Tüm hakları saklıdır.',
} as const;

/**
 * Turkish-aware slugification.
 *
 * Slugs are Turkish but ASCII-folded, and folded — never dropped
 * (CLAUDE.md §6): `Cilt Bakımı → cilt-bakimi`, not `cilt-bakm`.
 *
 * The reason this cannot be `String.normalize('NFD')` + strip-diacritics:
 *
 *   - `ı` (U+0131, dotless i) is NOT `i` with a diacritic removed. It is its
 *     own letter with no decomposition, so NFD leaves it intact and the strip
 *     pass deletes it.
 *   - `İ` (U+0130) decomposes to `I` + combining dot, so naive folding gives
 *     `I` — correct here only by accident.
 *   - `ğ` and `ş` decompose to `g`/`s` plus a combining mark, which does work,
 *     but relying on two different mechanisms for one alphabet is how the
 *     dotless-i bug gets reintroduced.
 *
 * An explicit table is boring and correct. It is also the thing the unit test
 * pins against all 20 real service names.
 *
 * `toLowerCase()` is deliberately NOT used before folding: in a Turkish locale
 * `I`.toLowerCase() is `ı`, and `İ`.toLowerCase() is `i`. Folding first makes
 * the result independent of the runtime locale.
 */

const TURKISH_FOLD: Readonly<Record<string, string>> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  i: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
  â: 'a',
  Â: 'a',
  î: 'i',
  Î: 'i',
  û: 'u',
  Û: 'u',
};

export function slugify(input: string): string {
  const folded = Array.from(input.normalize('NFC'))
    .map((char) => TURKISH_FOLD[char] ?? char)
    .join('');

  return folded
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** ASCII kebab-case, no leading/trailing/double hyphens. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Throws on an invalid slug. Used by the content layer (M4) so a bad filename
 * fails the build rather than producing an unreachable route.
 */
export function assertValidSlug(slug: string, context: string): string {
  if (!isValidSlug(slug)) {
    throw new Error(
      `Invalid slug "${slug}" (${context}). Slugs must be ASCII kebab-case: ` +
        `Turkish characters are folded, not dropped — "Cilt Bakımı" → "cilt-bakimi".`,
    );
  }
  return slug;
}

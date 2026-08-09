import { expect, test } from '@playwright/test';

/**
 * Turkish glyphs must come from OUR typefaces, not from a fallback.
 *
 * `npm run fonts` already proves every required codepoint is in the cmap of
 * the .woff2 files we ship. That is COVERAGE, and coverage is not
 * REACHABILITY: a glyph can be in the file and still never be asked for,
 * because an earlier family in the cascade claimed the codepoint first. That
 * is exactly what happened — `adjustFontFallback` emits an unrestricted
 * `"<name> Fallback"` family, it sat between the latin and latin-ext faces,
 * and every ş, ğ and İ on the site was drawn in a re-metricked local serif
 * (docs/OPEN-QUESTIONS.md G37).
 *
 * `document.fonts.check()` cannot express either assertion. Against the whole
 * stack it answers for the stack, not the codepoint — it returns false while
 * an unused `"… Fallback"` face sits unloaded, and against a single family it
 * returns true for a letter that family does not cover. Both were tried.
 * Width is the honest measurement: it is what the reader actually sees.
 */

/** ş ğ İ Ş Ğ live in latin-ext; ı ç ö ü in latin. Both subsets must answer. */
const TURKISH = ['ş', 'ğ', 'İ', 'Ş', 'Ğ', 'ı', 'ç', 'ö', 'ü'] as const;

const ROLES = ['display', 'sans'] as const;

/** Generic families and keywords — the tail of every stack. */
const GENERIC =
  /^(ui-serif|ui-sans-serif|ui-monospace|system-ui|serif|sans-serif|monospace|Georgia|Times New Roman|Arial|Helvetica)$/i;

test.describe('Turkish typography', () => {
  /**
   * Render each letter twice: once with the real stack, once with a stack
   * stripped down to the subset faces alone. If a fallback family is
   * intercepting a codepoint, the two disagree — and they disagree by the
   * exact glyph the reader is being shown instead.
   */
  test('every Turkish letter is drawn by a Maren subset, not a fallback', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const wrong = await page.evaluate(
      async ({ letters, roles, generic }) => {
        await document.fonts.ready;

        const probe = document.createElement('span');
        probe.style.cssText =
          'position:absolute;top:-9999px;font-size:200px;white-space:pre';
        document.body.append(probe);

        const width = (family: string, ch: string) => {
          probe.style.fontFamily = family;
          probe.textContent = ch;
          return Math.round(probe.getBoundingClientRect().width * 100) / 100;
        };

        const genericRe = new RegExp(generic.source, generic.flags);
        const mismatched: string[] = [];

        for (const role of roles) {
          probe.style.fontFamily = `var(--font-${role})`;
          const stack = getComputedStyle(probe).fontFamily;
          const real = stack
            .split(',')
            .map((f) => f.trim().replace(/^["']|["']$/g, ''))
            .filter((f) => !/Fallback$/.test(f) && !genericRe.test(f))
            .map((f) => `"${f}"`)
            .join(', ');

          for (const ch of letters) {
            const actual = width(`var(--font-${role})`, ch);
            const expected = width(real, ch);
            if (actual !== expected) {
              mismatched.push(`${role}:${ch} ${actual}px ≠ ${expected}px`);
            }
          }
        }

        probe.remove();
        return mismatched;
      },
      { letters: TURKISH, roles: ROLES, generic: GENERIC },
    );

    expect(
      wrong,
      'these letters are drawn by a fallback face, mid-sentence',
    ).toEqual([]);
  });

  /**
   * The shape of the cascade, asserted directly, with no dependency on what
   * has finished loading. A `"… Fallback"` family carries no `unicode-range`,
   * so every family after it is unreachable: it must come last.
   */
  test('no metric fallback is listed before a subset face', async ({
    page,
  }) => {
    await page.goto('/');

    const stacks = await page.evaluate((roles) => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const out: Record<string, string[]> = {};
      for (const role of roles) {
        probe.style.fontFamily = `var(--font-${role})`;
        out[role] = getComputedStyle(probe)
          .fontFamily.split(',')
          .map((f) => f.trim().replace(/^["']|["']$/g, ''));
      }
      probe.remove();
      return out;
    }, ROLES);

    for (const [role, families] of Object.entries(stacks)) {
      expect(families.length, `${role} stack is empty`).toBeGreaterThan(1);

      const firstFallback = families.findIndex((f) => /Fallback$/.test(f));
      const lastSubset = families.findLastIndex(
        (f) => !/Fallback$/.test(f) && !GENERIC.test(f),
      );

      expect(lastSubset, `${role} stack has no subset face`).toBeGreaterThan(
        -1,
      );
      if (firstFallback !== -1) {
        expect(
          firstFallback,
          `${role}: "${families[firstFallback]}" shadows "${families[lastSubset]}"`,
        ).toBeGreaterThan(lastSubset);
      }
    }
  });
});

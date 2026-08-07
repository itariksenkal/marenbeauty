import { expect, test, type Page } from '@playwright/test';

/**
 * Keyboard traversal — every flow works without a mouse (`CLAUDE.md` §16).
 *
 * axe cannot check this. It can tell you an element has an accessible name; it
 * cannot tell you the focus ring is visible against the surface the element
 * sits on, or that tabbing through the page reaches everything and escapes
 * everything it enters.
 */

/** Where focus currently is, described well enough to debug a failure. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent ?? '').trim().slice(0, 40),
      href: el.getAttribute('href'),
      inHeader: !!el.closest('header'),
      inMain: !!el.closest('main'),
      inFooter: !!el.closest('footer'),
    };
  });
}

test.describe('the skip link', () => {
  test('is the first focusable element and moves focus to main', async ({
    page,
  }) => {
    await page.goto('/hizmetler');
    await page.keyboard.press('Tab');

    const first = await focused(page);
    expect(first?.href).toBe('#main');

    await page.keyboard.press('Enter');
    const landed = await page.evaluate(() => document.activeElement?.id);
    expect(landed).toBe('main');
  });

  test('adds no layout height while hidden', async ({ page }) => {
    await page.goto('/hizmetler');
    const skip = await page.evaluate(() => {
      const link = document.querySelector('a[href="#main"]');
      if (!link) return null;
      const style = getComputedStyle(link);
      return {
        position: style.position,
        top: link.getBoundingClientRect().top,
      };
    });

    // Out of FLOW, not zero-height: it is positioned and parked above the
    // viewport by inline critical CSS, so it cannot push the page down even
    // before the stylesheet lands (M1 follow-up). Measuring its box height
    // measures the target size it correctly has once focused.
    expect(skip?.position).not.toBe('static');
    expect(skip!.top).toBeLessThan(0);
  });
});

test.describe('focus is always visible', () => {
  test('every focusable element in the header shows a ring', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    /*
     * Focus is moved WITH THE KEYBOARD, not with `el.focus()`.
     *
     * `:focus-visible` is a heuristic: a programmatic `focus()` does not
     * satisfy it, so measuring after one reports `outline: none` on an element
     * whose ring is perfectly fine. The first version of this test did exactly
     * that and "found" a defect that did not exist.
     */
    const outlines: { text: string; width: string; style: string }[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const measured = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        if (!el.closest('header')) return null;
        const style = getComputedStyle(el);
        return {
          text: (el.textContent ?? '').trim().slice(0, 20),
          width: style.outlineWidth,
          style: style.outlineStyle,
        };
      });
      if (measured) outlines.push(measured);
    }

    expect(outlines.length).toBeGreaterThan(0);
    for (const outline of outlines) {
      expect(outline.style, outline.text).not.toBe('none');
      expect(parseFloat(outline.width), outline.text).toBeGreaterThan(0);
    }
  });
});

test.describe('tab order reaches everything, in visual order', () => {
  test('header, then main, then footer — never backwards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/sss');

    const regions: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const current = await focused(page);
      if (!current) break;
      const region = current.inHeader
        ? 'header'
        : current.inMain
          ? 'main'
          : current.inFooter
            ? 'footer'
            : 'other';
      if (regions.at(-1) !== region) regions.push(region);
    }

    // 'other' is the skip link, which lives outside all three by design.
    const meaningful = regions.filter((region) => region !== 'other');
    // Each region appears as one contiguous run: no jumping back to the
    // header after reaching main.
    expect(meaningful).toEqual([...new Set(meaningful)]);
    expect(meaningful[0]).toBe('header');
  });
});

test.describe('the contact form is keyboard-complete', () => {
  test('every control is reachable and labelled', async ({ page }) => {
    await page.goto('/iletisim');

    const controls = await page
      .locator('form input, form textarea, form select, form button')
      .evaluateAll((elements) =>
        elements
          // The honeypot is deliberately hidden from people AND from
          // assistive tech; it is not part of the flow. Nor is the signed page
          // token, which is `type="hidden"` — not focusable, and a <label> on
          // it would be a label for something nobody can see.
          .filter(
            (el) =>
              !el.closest('[aria-hidden="true"]') &&
              (el as HTMLInputElement).type !== 'hidden',
          )
          .map((el) => {
            const control = el as HTMLInputElement;
            // A <button> is named by its own text, not by a <label>, and its
            // .labels is an empty list rather than undefined — so "needs a
            // label" is asked only of the elements that do.
            const needsLabel = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
              el.tagName,
            );
            return {
              name: control.name || control.type,
              labels: needsLabel ? (control.labels?.length ?? 0) : -1,
              text: (el.textContent ?? '').trim(),
              tabIndex: control.tabIndex,
            };
          }),
      );

    expect(controls.length).toBeGreaterThan(3);
    for (const control of controls) {
      expect(control.tabIndex, control.name).toBeGreaterThanOrEqual(0);
      if (control.labels === -1) {
        // A button: its accessible name is its text.
        expect(control.text.length, control.name).toBeGreaterThan(0);
      } else {
        expect(control.labels, control.name).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('no focus trap outside a dialog', () => {
  test('tabbing through the whole home page always terminates', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const seen = new Set<string>();
    let repeats = 0;
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Tab');
      const current = await focused(page);
      const key = `${current?.tag}:${current?.text}:${current?.href}`;
      if (seen.has(key)) repeats++;
      seen.add(key);
    }

    // Focus cycles back to the top eventually — that is correct. What must not
    // happen is getting stuck on one element, which shows as a repeat count
    // close to the number of presses.
    expect(repeats).toBeLessThan(100);
    expect(seen.size).toBeGreaterThan(10);
  });
});

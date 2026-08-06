import { expect, test, type Page } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The rest of the home page.
 *
 * These assert what only a real render can show: that unset channels produce
 * no markup at all, that the aurora stops actually change per section, and
 * that the panel treatment matches the spec in computed styles rather than in
 * source.
 */

async function scrollTo(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const total = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: total * f, behavior: 'instant' });
  }, fraction);
  await page.waitForTimeout(300);
}

test.describe('home sections', () => {
  test('render with no runtime error', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('no channel link is ever dead, and nothing is disabled', async ({
    page,
  }) => {
    await page.goto('/');

    const hrefs = await page
      .locator('[data-channel]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }

    // No dead targets and no disabled stand-ins.
    expect(
      await page.locator('a[href="tel:"], a[href="mailto:"]').count(),
    ).toBe(0);
    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(
      await page.locator('button[disabled], a[aria-disabled="true"]').count(),
    ).toBe(0);

    // The form CTA is present and is the primary while nothing else exists.
    const formCta = page.getByRole('link', { name: 'Mesaj gönderin' });
    await expect(formCta).toBeVisible();
    await expect(formCta).toHaveAttribute('href', '/iletisim');
  });

  test('testimonials contribute nothing to the DOM', async ({ page }) => {
    await page.goto('/');
    const body = (await page.locator('body').textContent()) ?? '';
    for (const word of ['yorum', 'Yorum', 'görüş', 'Görüş']) {
      expect(body, `"${word}" should not appear`).not.toContain(word);
    }
  });

  test('service bodies never reach the home page payload', async ({ page }) => {
    // `ServicesPanels` is a client component, so every prop is serialised into
    // the RSC payload. Passing whole `Service` objects put all twenty MDX
    // bodies — thousands of words — into the home page for a list that renders
    // twenty titles. The props are narrowed on the server; this pins that.
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('Lazer Epilasyon');
    expect(html).not.toContain('kozmetik bir uygulamadır');
    expect(html).not.toContain('Uygunluk seans öncesinde');
  });

  test('exactly two sections hold the viewport, and no more', async ({
    page,
  }) => {
    await page.goto('/');
    // The hero → brand-story opening and the process section. Two is the whole
    // budget (docs/MOTION.md §2.6); a third would be a new signature
    // interaction, which needs owner approval.
    expect(await page.locator('[data-pinned-sequence]').count()).toBe(2);
  });

  test('every visit step is in the DOM from first paint, none hidden', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // The pinned sequence only ever changes opacity. If a step were mounted on
    // scroll, find-in-page would not locate it and a reader who never scrolls
    // would lose three quarters of the section.
    const steps = page.locator('[data-step]');
    await expect(steps).toHaveCount(4);
    for (const text of await steps.allInnerTexts()) {
      expect(text.trim().length).toBeGreaterThan(20);
    }
  });

  test('the pre-launch band is honest and carries no date', async ({
    page,
  }) => {
    await page.goto('/');
    const band = page.getByText('Yakında Konya Selçuklu’da açılıyoruz.');
    await expect(band).toBeVisible();

    const text = (await band.textContent()) ?? '';
    expect(text).not.toMatch(/\d{4}/);
  });

  test('location shows the district and embeds no map', async ({ page }) => {
    await page.goto('/');
    // Scoped to <main>: the footer carries the same address on every page.
    await expect(
      page.locator('main').getByText('Konya, Selçuklu'),
    ).toBeVisible();
    expect(await page.locator('iframe').count()).toBe(0);
  });

  test('sticky panels use the 40px top radius and scale down', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await scrollTo(page, 0.3);

    const panel = page.locator('[data-panel]').first();
    const radius = await panel.evaluate(
      (el) => getComputedStyle(el).borderTopLeftRadius,
    );
    expect(radius).toBe('40px');

    // The outgoing panel scales toward 0.96 as the next covers it. Scroll
    // relative to THIS panel, not to the page: a page fraction lands wherever
    // the document happens to be long, which is not the panel's own range.
    await page.evaluate(() => {
      const first = document.querySelector(
        '[data-panel]',
      ) as HTMLElement | null;
      if (!first) throw new Error('no sticky panel');
      const top = first.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + first.offsetHeight * 0.9,
        behavior: 'instant',
      });
    });
    await page.waitForTimeout(350);

    const scale = await panel.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return m.a;
    });
    expect(scale, 'the outgoing panel should be scaling down').toBeLessThan(1);
    // transforms.panelScale is 0.96; allow for being mid-range.
    expect(scale).toBeGreaterThanOrEqual(0.95);
  });

  test('the aurora stops change per section, but the base never does', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const stops = async () =>
      page.evaluate(() => {
        const layer = document.querySelector('.aurora-layer');
        if (!layer) return null;
        const s = getComputedStyle(layer);
        return {
          a: s.getPropertyValue('--aurora-a').trim(),
          bg: s.backgroundColor,
        };
      });

    const first = await stops();
    await scrollTo(page, 0.6);
    const later = await stops();

    // --aurora-a is what keeps section boundaries soft. It must not move.
    expect(later?.a).toBe(first?.a);
    expect(later?.bg).toBe(first?.bg);

    // Panels do set their own b/c stops.
    const panelStops = await page.evaluate(() =>
      [...document.querySelectorAll('[data-panel] > div')].map((el) =>
        getComputedStyle(el).getPropertyValue('--aurora-b').trim(),
      ),
    );
    expect(new Set(panelStops).size).toBeGreaterThan(1);
  });

  test('no horizontal scroll anywhere down the page at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');

    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollTo(page, fraction);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${fraction}`).toBeLessThanOrEqual(0);
    }
  });

  test('heading levels do not skip', async ({ page }) => {
    await page.goto('/');
    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) =>
        Number(el.tagName.slice(1)),
      ),
    );
    expect(levels[0], 'the page must start at h1').toBe(1);
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) {
      expect(
        levels[i]! - levels[i - 1]!,
        `heading jumped from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }
  });
});

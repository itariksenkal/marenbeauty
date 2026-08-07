import { expect, test, type Page } from '@playwright/test';

/**
 * Performance, measured — and deliberately NOT gated on a score.
 *
 * `docs/BRIEF.md` and `CLAUDE.md` §19 both say Lighthouse is a number to
 * record, never an acceptance criterion: a milestone must not be blocked on a
 * score, and accessibility is never traded for one.
 *
 * So no Lighthouse dependency is installed. What is asserted here is the small
 * set of things that are (a) measurable in a plain browser and (b) genuine
 * defects rather than score components:
 *
 *   - **CLS**, which is an accessibility problem as much as a performance one —
 *     content moving under a reader's eye or a tapping finger.
 *   - **Layout on scroll**, which is the motion contract (`docs/MOTION.md` §2
 *     rule 7) rather than a preference.
 *   - **Transfer weight**, loosely bounded, so an accidental 5 MB image lands
 *     as a failure rather than as a slow page nobody measured.
 *
 * The numbers themselves are printed, so a regression is visible in the run
 * even when it stays inside the bound.
 */
const ROUTES = ['/', '/hizmetler', '/hizmetler/hydrafacial', '/galeri'];

async function measureCls(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!shift.hadRecentInput) total += shift.value;
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(total);
        }, 1500);
      }),
  );
}

test.describe('cumulative layout shift', () => {
  for (const route of ROUTES) {
    test(`${route} settles without shifting content`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Scroll the page so lazy images and the sticky header both engage —
      // CLS measured on a page nobody scrolled is CLS nobody would experience.
      await page.evaluate(() =>
        window.scrollTo({ top: 1200, behavior: 'instant' }),
      );

      const cls = await measureCls(page);
      console.log(`  CLS ${route}: ${cls.toFixed(4)}`);
      // Google's "good" threshold is 0.1. The image manifest carries intrinsic
      // width and height on every entry precisely so this stays near zero.
      expect(cls).toBeLessThan(0.1);
    });
  }
});

test.describe('transfer weight', () => {
  for (const route of ROUTES) {
    test(`${route} is not accidentally enormous`, async ({ page }) => {
      let bytes = 0;
      page.on('response', async (response) => {
        const length = response.headers()['content-length'];
        if (length) bytes += Number(length);
      });

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const kb = Math.round(bytes / 1024);
      console.log(`  transfer ${route}: ${kb} KB`);
      // Loose on purpose. This is a tripwire for a 5 MB image slipping into a
      // page, not a budget to optimise against.
      expect(kb).toBeLessThan(3000);
    });
  }
});

test.describe('scrolling stays on the compositor', () => {
  test('twelve scroll events do not force twelve layouts', async ({ page }) => {
    // docs/MOTION.md §2 rule 7. Re-measured here because M15 is the pass that
    // covers the whole site, and the aurora, the pinned sections and the
    // sticky header all now coexist on one page.
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const layoutCount = async () => {
      const { metrics } = await client.send('Performance.getMetrics');
      return metrics.find((m) => m.name === 'LayoutCount')?.value ?? 0;
    };

    const before = await layoutCount();
    for (let i = 1; i <= 12; i++) {
      await page.evaluate(
        (n) => window.scrollTo({ top: n * 240, behavior: 'instant' }),
        i,
      );
    }
    await page.waitForTimeout(400);
    const after = await layoutCount();

    console.log(`  layouts across 12 scrolls: ${after - before}`);
    // A handful is normal — sticky positioning and lazy images both cost one.
    // What must not happen is a layout per scroll event or worse.
    expect(after - before).toBeLessThan(12);
  });
});

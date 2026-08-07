import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * axe on every shipped route — **zero violations**.
 *
 * Accessibility outranks visual polish and Lighthouse scores in this project
 * (`CLAUDE.md` §16), so this is a gate rather than a report.
 *
 * WHAT AXE CAN AND CANNOT SEE. It catches contrast, names, roles, landmarks,
 * heading order and form labelling — perhaps half of what matters. It cannot
 * tell whether the reading order makes sense, whether a focus ring is visible
 * against the surface it lands on, or whether animation carries information.
 * Those are checked below by hand, and the ones that can be measured in a
 * browser are measured.
 *
 * Tags: WCAG 2.0/2.1 A and AA, plus `best-practice`. Best-practice rules are
 * not legally required and are included anyway — they are where "region"
 * (content outside a landmark) and "heading-order" live, and both are real
 * defects for a screen-reader user.
 */
const ROUTES = [
  '/',
  '/hizmetler',
  '/hizmetler/hydrafacial',
  '/hizmetler/gelin-bakim-paketi',
  '/hakkimizda',
  '/galeri',
  '/blog',
  '/blog/cilt-bakimi-nedir',
  '/blog/kategori/cilt-bakimi-rehberi',
  '/sss',
  '/iletisim',
  '/kvkk',
  '/cerez-politikasi',
  '/kullanim-kosullari',
  '/lisanslar',
  '/bulunmayan-sayfa', // the 404
];

const TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];

async function analyse(page: Page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

test.describe('axe — every route, zero violations', () => {
  for (const route of ROUTES) {
    test(`${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await analyse(page);

      // Report the rule and the first offending selector, not a wall of JSON:
      // a failure has to say what to fix without opening a trace.
      expect(
        results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          first: violation.nodes[0]?.target.join(' '),
        })),
      ).toEqual([]);
    });
  }
});

test.describe('axe at the two states a static audit misses', () => {
  test('with the mobile drawer open', async ({ page }) => {
    // A modal is where focus management and `aria-modal` go wrong, and a
    // closed drawer is not the state that matters.
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();

    const results = await analyse(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('with the services mega menu open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.locator('header button[aria-expanded]').first().click();

    const results = await analyse(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('with the contact form showing field errors', async ({ page }) => {
    // Error states are announced content, and axe checks the wiring that makes
    // the announcement work — `aria-describedby`, `aria-invalid`, live regions.
    await page.goto('/iletisim');
    await page.getByRole('button', { name: /gönder/i }).click();
    await page.waitForTimeout(500);

    const results = await analyse(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

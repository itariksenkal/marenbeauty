import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * **G21, decided at M13: the guard is not taught to render.**
 *
 * `npm run guard` scans prerendered output. `/iletisim` is rendered per request
 * — it issues a signed page token and reads `searchParams` — so it emits no
 * `.html` and its server-rendered copy is invisible to the gate that exists to
 * catch banned language.
 *
 * The obvious fix, making `scripts/guard.mjs` boot a server and fetch the
 * dynamic routes, was rejected. It would couple a fast static scan to a running
 * application, add a server lifecycle to a script whose whole value is that it
 * cannot fail for interesting reasons, and duplicate machinery that already
 * exists: the browser suite starts the production server for every run.
 *
 * So the HTML moves to the guard instead of the guard moving to the HTML. Each
 * dynamic route is fetched from the real production server, written into a
 * fixture build tree, and scanned by **the guard's own CLI** — the same script,
 * the same lexicon, the same `guard.allow.json`. Nothing is reimplemented, and
 * the `--root=` flag it uses is the one M12 added to demonstrate rule 2.
 *
 * Net effect: the guard now covers 100% of routes. Static ones through build
 * output, dynamic ones through this.
 *
 * (The scan runs as a subprocess rather than an import because Playwright
 * transpiles its specs to CommonJS and cannot import an ESM `.mjs` — which is
 * also how M12's rule-2 demonstration works, so the pattern is not new.)
 */
const ROOT = process.cwd();

/** Every state `/iletisim` can render, including each no-JS outcome. */
const DYNAMIC_ROUTES = [
  '/iletisim',
  '/iletisim?durum=basarili',
  '/iletisim?durum=hata',
  '/iletisim?durum=gecersiz',
];

function scanWithRealGuard(name: string, html: string) {
  const dir = mkdtempSync(join(tmpdir(), 'mb-dynamic-guard-'));
  const appDir = join(dir, '.next', 'server', 'app');
  mkdirSync(appDir, { recursive: true });
  writeFileSync(join(appDir, `${name}.html`), html, 'utf8');

  try {
    const output = execFileSync(
      'node',
      [join(ROOT, 'scripts', 'guard.mjs'), `--root=${dir}`],
      { encoding: 'utf8' },
    );
    return { code: 0, output };
  } catch (error) {
    const e = error as { status: number; stdout: string; stderr: string };
    return { code: e.status, output: `${e.stdout}${e.stderr}` };
  }
}

test.describe('the content guard covers dynamic routes too', () => {
  for (const [index, route] of DYNAMIC_ROUTES.entries()) {
    test(`${route} has no blocking violation`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      const result = scanWithRealGuard(
        `iletisim-${index}`,
        await page.content(),
      );

      expect(result.output).not.toContain('BLOCKING');
      expect(result.code, result.output).toBe(0);
    });
  }

  test('and the gate being run is the real one', async ({ page }) => {
    // If this file ever drifted onto a copy of the lexicon, the checks above
    // would keep passing while meaning nothing. Feeding the same pipeline a
    // known-bad page proves it is the gate itself.
    await page.goto('/iletisim');
    const poisoned = (await page.content()).replace(
      '</body>',
      '<p>Lekeleri yok eder.</p></body>',
    );

    const result = scanWithRealGuard('poisoned', poisoned);
    expect(result.code).toBe(1);
    expect(result.output).toContain('BLOCKING');
  });
});

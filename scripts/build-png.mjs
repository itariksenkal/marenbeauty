/**
 * Rasterises the fixed-colour brand SVGs to PNG.
 *
 * Needed because the things these are FOR do not take SVG: Instagram rejects it
 * for a profile picture, and most people who ask for "the logo" are pasting it
 * into a document, a sign-maker's template or an email.
 *
 * It renders the `-espresso` / `-ivory` / avatar files, never `horizontal.svg`
 * itself — that one is `currentColor`, which resolves to BLACK with no CSS
 * around it. Rasterising it would hand someone a black logo and no hint why.
 *
 * Playwright is already a dev dependency for the browser suites, so this
 * borrows it rather than adding an SVG rasteriser (`sharp` would need librsvg)
 * or a new licence entry for a one-command job.
 *
 * Run: node scripts/build-png.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const BRAND = join(ROOT, 'public', 'brand');

/**
 * `width` is the long edge in pixels; height follows the viewBox.
 *
 * 2400px on the wordmark is deliberate overkill — it is the size that still
 * looks sharp printed across a business card or placed in a slide, and nobody
 * ever wished a supplied logo were smaller.
 */
const TARGETS = [
  { file: 'instagram-avatar', width: 1080, transparent: false },
  { file: 'horizontal-espresso', width: 2400, transparent: true },
  { file: 'horizontal-ivory', width: 2400, transparent: false },
];

const browser = await chromium.launch();

for (const { file, width, transparent } of TARGETS) {
  const svg = readFileSync(join(BRAND, `${file}.svg`), 'utf8');

  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error(`${file}.svg has no viewBox`);
  const [, , boxWidth, boxHeight] = viewBox.split(' ').map(Number);
  const height = Math.round((width * boxHeight) / boxWidth);

  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  await page.setContent(
    `<body style="margin:0;width:${width}px;height:${height}px">` +
      `<div style="width:100%;height:100%">` +
      svg.replace('<svg', '<svg width="100%" height="100%"') +
      `</div></body>`,
  );

  writeFileSync(
    join(BRAND, `${file}.png`),
    await page.screenshot({ omitBackground: transparent }),
  );
  await page.close();

  console.log(
    `  png: ${file}.png — ${width}×${height}` +
      (transparent ? ', transparent' : ''),
  );
}

await browser.close();

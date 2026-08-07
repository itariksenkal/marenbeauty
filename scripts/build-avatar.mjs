/**
 * Rasterises `public/brand/instagram-avatar.svg` to PNG.
 *
 * Separate from `build-logo.mjs` because it needs a browser: Instagram will not
 * accept an SVG profile picture, and nothing else in the toolchain rasterises
 * one. Playwright is already a dev dependency for the browser suites, so this
 * borrows it rather than adding `sharp`-based SVG rendering (which would need
 * librsvg) or a headless converter.
 *
 * 1080×1080 — Instagram displays a profile picture at 320px and stores up to
 * 1080, so this is the largest size that is not upscaled on their side.
 *
 * Run: node scripts/build-avatar.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const SIZE = 1080;
const source = join(ROOT, 'public', 'brand', 'instagram-avatar.svg');
const target = join(ROOT, 'public', 'brand', 'instagram-avatar.png');

const svg = readFileSync(source, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  // The SVG already carries its own colours, so the device scale is only about
  // resolution — 1 is correct at a viewport that is already the output size.
  deviceScaleFactor: 1,
});

await page.setContent(
  `<body style="margin:0;width:${SIZE}px;height:${SIZE}px">
     <div style="width:100%;height:100%">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div>
   </body>`,
);

writeFileSync(target, await page.screenshot({ omitBackground: false }));
await browser.close();

console.log(
  `  avatar: ${SIZE}×${SIZE} PNG written to public/brand/instagram-avatar.png`,
);

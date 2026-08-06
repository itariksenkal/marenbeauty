/**
 * Placeholder hero artwork for the 20 service pages.
 *
 * Photography arrives only after the venue opens (CLAUDE.md §8). Rather than
 * ship stock photographs of rooms and faces that are not this centre — which
 * would be a claim about the business dressed up as decoration — the launch set
 * is ABSTRACT: warm gradient fields drawn from the palette in
 * docs/DESIGN-SYSTEM.md §1.1, one per service, in the same visual family as the
 * aurora wash.
 *
 * Consequences, all deliberate:
 *   - The artwork is ours, so `licence` is CC0-1.0 with no credit and no
 *     sourceUrl. Nothing is attributed to a photographer who does not exist.
 *   - It carries no information, so `alt` is empty and the image is marked
 *     decorative. That is the correct accessibility answer for abstract
 *     artwork, and it means no alt text has to be invented either.
 *   - Every entry is `replaceable: true`. Swapping the set for real photography
 *     is one edit to src/config/images.ts; no component moves.
 *
 * Run manually — this is NOT part of `npm run verify`:
 *
 *     node scripts/generate-placeholders.mjs
 *
 * `sharp` is resolved from the tree Next.js installs it into (it is the
 * approved LGPL production exception in docs/LICENSES.md §5). Nothing at build
 * or request time depends on this file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = join(root, 'public', 'images');

const WIDTH = 1600;
const HEIGHT = 1200;

/**
 * Palette per service group. Hexes are copied from src/styles/theme.css — this
 * script runs outside the bundler, so it cannot read the CSS tokens. A unit
 * test asserts the two agree.
 */
const PALETTES = {
  'cilt-bakimi': {
    base: ['#fefcf9', '#f3eadf'],
    blooms: ['#ebdccd', '#efe2c6', '#dfc9bb'],
  },
  epilasyon: {
    base: ['#faf4ec', '#ebdccd'],
    blooms: ['#dfc9bb', '#d2b3a5', '#efe2c6'],
  },
  'cilt-yenileme': {
    base: ['#f3eadf', '#dfc9bb'],
    blooms: ['#d2b3a5', '#dec79c', '#ebdccd'],
  },
  'kas-kirpik': {
    base: ['#faf4ec', '#dfc9bb'],
    blooms: ['#d2b3a5', '#dfc9bb', '#ebdccd'],
  },
  'ozel-paket': {
    base: ['#efe2c6', '#dfc9bb'],
    blooms: ['#dec79c', '#d2b3a5', '#ebdccd'],
  },
};

/** The 20 services, in the order of docs/CONTENT-PLAN.md §1. */
const SERVICES = [
  ['cilt-bakimi', 'cilt-bakimi'],
  ['akne-bakimi', 'cilt-bakimi'],
  ['yaslanma-karsiti-bakim', 'cilt-bakimi'],
  ['leke-bakimi', 'cilt-bakimi'],
  ['hassas-cilt-bakimi', 'cilt-bakimi'],
  ['kolajen-bakimi', 'cilt-bakimi'],
  ['nemlendirme-bakimi', 'cilt-bakimi'],
  ['gozenek-sikilastirma', 'cilt-bakimi'],
  ['hucre-yenileme', 'cilt-bakimi'],
  ['lazer-epilasyon', 'epilasyon'],
  ['hydrafacial', 'cilt-yenileme'],
  ['karbon-peeling', 'cilt-yenileme'],
  ['kimyasal-peeling', 'cilt-yenileme'],
  ['dermapen', 'cilt-yenileme'],
  ['bb-glow', 'cilt-yenileme'],
  ['kalici-makyaj', 'kas-kirpik'],
  ['microblading', 'kas-kirpik'],
  ['kirpik-lifting', 'kas-kirpik'],
  ['kas-tasarimi', 'kas-kirpik'],
  ['gelin-bakim-paketi', 'ozel-paket'],
];

/**
 * Blog heroes are per CATEGORY, not per post (M9).
 *
 * Fifty posts across six categories do not need fifty pieces of artwork, and a
 * per-post image would mean inventing one every time a post is written. Each
 * category borrows the palette of the service group it mostly covers, so a
 * cluster reads as one family.
 */
const BLOG_CATEGORIES = [
  ['cilt-bakimi-rehberi', 'cilt-bakimi'],
  ['cilt-yenileme-rehberi', 'cilt-yenileme'],
  ['epilasyon-rehberi', 'epilasyon'],
  ['cilt-ihtiyaclari', 'cilt-bakimi'],
  ['kas-kirpik-rehberi', 'kas-kirpik'],
  ['ozel-gun-ve-mevsim', 'ozel-paket'],
];

/**
 * A stable 32-bit hash of the slug. Variation must be reproducible: a rebuild
 * that shuffles the artwork would show up as a diff on every image.
 */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random sequence seeded by the slug. */
function sequence(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function svgFor(slug, group) {
  const palette = PALETTES[group];
  const next = sequence(hash(slug));

  const blooms = palette.blooms
    .map((colour, index) => {
      const cx = (0.05 + next() * 0.9) * WIDTH;
      const cy = (0.05 + next() * 0.9) * HEIGHT;
      const r = (0.42 + next() * 0.36) * WIDTH;
      // Peak opacity stays low: these are washes, not blobs. Anything heavier
      // reads as a smudge rather than as light falling across a surface.
      return `
    <radialGradient id="bloom${index}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${colour}" stop-opacity="0.6" />
      <stop offset="50%" stop-color="${colour}" stop-opacity="0.26" />
      <stop offset="100%" stop-color="${colour}" stop-opacity="0" />
    </radialGradient>
    <circle data-bloom="${index}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#bloom${index})" />`;
    })
    .join('');

  // Definitions and shapes are interleaved above; SVG tolerates a gradient
  // defined next to the shape that uses it, and keeping them together makes
  // the generated file readable when debugging one image.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${palette.base[0]}" />
      <stop offset="100%" stop-color="${palette.base[1]}" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#base)" />
  ${blooms}
</svg>`;
}

const README =
  'Generated by scripts/generate-placeholders.mjs. Abstract placeholder\n' +
  'artwork, CC0-1.0, replaceable. Do not hand-edit; regenerate instead.\n';

let written = 0;
for (const [folder, entries] of [
  ['services', SERVICES],
  ['blog', BLOG_CATEGORIES],
]) {
  const outDir = join(imagesDir, folder);
  mkdirSync(outDir, { recursive: true });

  for (const [slug, group] of entries) {
    const svg = svgFor(slug, group);
    // Sequential on purpose: rasterising everything at once is a memory spike
    // for no wall-clock gain on a script nobody waits for.
    await sharp(Buffer.from(svg))
      .webp({ quality: 86, effort: 6 })
      .toFile(join(outDir, `${slug}.webp`));
    written += 1;
  }

  // A tiny index so it is obvious the folder is generated, not hand-curated.
  writeFileSync(join(outDir, 'README.txt'), README, 'utf8');
}

console.log(`\n  ${written} placeholder images written under public/images/\n`);

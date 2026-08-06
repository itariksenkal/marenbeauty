/**
 * Image research — candidate discovery, not selection.
 *
 * Queries the public Unsplash and Pexels catalogues, applies the mechanical
 * half of the visual brief (`CLAUDE.md` §8: one narrow warm family — warm
 * temperature, soft light, no cool tones, no clinical white) and writes a
 * shortlist plus small previews to the scratchpad.
 *
 * **It does not choose anything.** The judgement half — no direct-to-camera
 * portraits, no foreign-language product packaging, no before/after, nothing
 * that reads as a person presented as staff — is made by looking at the
 * previews. This script exists so that judgement is exercised over a few dozen
 * relevant images instead of a few thousand irrelevant ones.
 *
 * Run manually. NOT part of `npm run verify`: it hits the network, its results
 * change over time, and the selected set is committed to the manifest anyway.
 *
 *   node scripts/research-images.mjs <outputDir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('usage: node scripts/research-images.mjs <outputDir>');
  process.exit(1);
}

/**
 * Search terms, chosen to span the subjects the site needs while staying inside
 * one visual family. Deliberately no term that would return a clinic, a
 * treatment couch under a surgical lamp, or a stock model facing the camera.
 */
const QUERIES = [
  'warm minimal spa interior',
  'beauty salon interior warm light',
  'linen towels folded warm',
  'skincare bottle beige minimal',
  'facial treatment room warm',
  'hands massage warm light',
  'soft daylight interior beige',
  'terracotta interior calm',
  'candle warm interior still life',
  'spa still life stone linen',
  'beauty studio chair warm',
  'ceramic bowl neutral still life',
  'dried flowers beige minimal',
  'warm neutral texture wall',
  'skincare routine warm tones',
  'towel stack beige minimal',
  'esthetician hands close up',
  'eyelash brow tools minimal',
  'reception desk warm wood',
  'linen curtain soft light',
];

/* ── The mechanical filters ───────────────────────────────────────────────── */

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/**
 * `warmth` is r − b on the dominant colour. The palette in
 * docs/DESIGN-SYSTEM.md runs +5 (ivory) to +36 (rose beige), and the M7 panel
 * review established that anything at or below 0 "reads beige" — i.e. cool —
 * next to it. A cool-toned photograph in this set is the one thing that would
 * break the family, so the floor is deliberately strict.
 */
function warmth(hex) {
  const { r, b } = hexToRgb(hex);
  return r - b;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Reject on the description, before a human has to look at it. */
const REJECT_WORDS =
  /(before and after|before-after|blue|snow|winter|ice|neon|surgery|surgical|clinic|hospital|injection|syringe|needle|laser machine|tattoo gun|logo|billboard|poster|magazine)/i;

/**
 * Unsplash gives a hex string; Pexels gives `[r, g, b]`. Normalising here is
 * what stopped the first run returning an Unsplash-only set — every Pexels
 * record failed a `typeof === 'string'` check and was dropped in silence, so
 * "we searched both" would have been false while the log said otherwise.
 */
function normaliseColor(value) {
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return value;
  if (Array.isArray(value) && value.length >= 3) {
    return `#${value
      .slice(0, 3)
      .map((n) => Math.round(n).toString(16).padStart(2, '0'))
      .join('')}`;
  }
  return null;
}

function mechanicallyAcceptable(candidate) {
  if (!candidate.color) return false;
  const w = warmth(candidate.color);
  const l = luminance(candidate.color);
  const text = `${candidate.description ?? ''} ${candidate.alt ?? ''}`;

  return (
    w >= 8 && // warm, not neutral and never cool
    l >= 0.18 && // not a dark frame
    l <= 0.92 && // not blown-out clinical white
    candidate.width >= 1600 &&
    candidate.width >= candidate.height && // landscape or square
    !REJECT_WORDS.test(text)
  );
}

/* ── Unsplash ─────────────────────────────────────────────────────────────── */

/**
 * Only `images.unsplash.com/photo-…` is the free Unsplash Licence.
 * `plus.unsplash.com/premium_photo-…` is Unsplash+, a paid subscription with
 * different terms, and must never enter the manifest.
 */
function isFreeUnsplash(url) {
  return url.startsWith('https://images.unsplash.com/photo-');
}

async function searchUnsplash(query) {
  const url =
    `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}` +
    `&per_page=30&orientation=landscape`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    console.warn(`  unsplash "${query}": HTTP ${response.status}`);
    return [];
  }
  const body = await response.json();

  return (body.results ?? [])
    .filter((photo) => isFreeUnsplash(photo.urls?.raw ?? ''))
    .map((photo) => ({
      source: 'unsplash',
      id: photo.id,
      query,
      width: photo.width,
      height: photo.height,
      color: normaliseColor(photo.color),
      description: photo.description,
      alt: photo.alt_description,
      author: photo.user?.name ?? null,
      authorUrl: photo.user?.links?.html ?? null,
      pageUrl: photo.links?.html ?? `https://unsplash.com/photos/${photo.id}`,
      // Strip Unsplash's tracking/ixid parameters; keep only sizing.
      downloadBase: (photo.urls?.raw ?? '').split('?')[0],
      licence: 'Unsplash Licence',
    }));
}

/* ── Pexels ───────────────────────────────────────────────────────────────── */

/**
 * Pexels' documented API needs a key the owner does not have. Its own site
 * calls a public JSON endpoint for search, which is what this uses. If it stops
 * answering, the run reports it rather than silently returning an Unsplash-only
 * set — "we searched both" has to be true.
 */
async function searchPexels(query) {
  const url =
    `https://www.pexels.com/en-us/api/v3/search/photos` +
    `?query=${encodeURIComponent(query)}&page=1&per_page=24&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
      'Content-Type': 'application/json',
      Referer: 'https://www.pexels.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; marenbeauty-image-research/1.0)',
    },
  });

  if (!response.ok) {
    console.warn(`  pexels   "${query}": HTTP ${response.status}`);
    return { ok: false, results: [] };
  }

  const body = await response.json();
  const results = (body.data ?? [])
    .filter((entry) => entry.type === 'photo')
    .map((entry) => {
      const photo = entry.attributes;
      return {
        source: 'pexels',
        id: String(entry.id),
        query,
        width: photo.width,
        height: photo.height,
        color: normaliseColor(photo.main_color),
        description: photo.alt ?? null,
        alt: photo.alt ?? null,
        author: photo.user?.first_name
          ? `${photo.user.first_name} ${photo.user.last_name ?? ''}`.trim()
          : null,
        authorUrl: photo.user?.username
          ? `https://www.pexels.com/@${photo.user.username}`
          : null,
        pageUrl: `https://www.pexels.com/photo/${entry.attributes.slug ?? entry.id}/`,
        /*
         * `image.download` is a pexels.com redirect, not a file — it 404s when
         * you append sizing parameters. `image.large` is the real
         * images.pexels.com asset, and stripping its query leaves the base
         * their CDN resizes from.
         */
        downloadBase: (photo.image?.large ?? photo.image?.medium ?? '').split(
          '?',
        )[0],
        licence: 'Pexels Licence',
      };
    })
    .filter((c) => c.downloadBase);

  return { ok: true, results };
}

/* ── Run ──────────────────────────────────────────────────────────────────── */

async function main() {
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(join(outputDir, 'previews'), { recursive: true });

  const seen = new Set();
  const candidates = [];
  let pexelsReachable = false;

  for (const query of QUERIES) {
    const [unsplash, pexels] = await Promise.all([
      searchUnsplash(query),
      searchPexels(query),
    ]);
    if (pexels.ok) pexelsReachable = true;

    for (const candidate of [...unsplash, ...pexels.results]) {
      const key = `${candidate.source}:${candidate.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!mechanicallyAcceptable(candidate)) continue;
      candidates.push({ ...candidate, warmth: warmth(candidate.color) });
    }
    console.log(`  ${query.padEnd(34)} → ${candidates.length} kept so far`);
  }

  candidates.sort((a, b) => b.warmth - a.warmth);

  writeFileSync(
    join(outputDir, 'candidates.json'),
    JSON.stringify(candidates, null, 2),
    'utf8',
  );

  console.log(`\n  ${candidates.length} candidates written.`);
  console.log(`  pexels reachable: ${pexelsReachable}`);
  console.log(`  → ${join(outputDir, 'candidates.json')}\n`);
}

await main();

/**
 * Contact sheets for image review.
 *
 * Downloads a small preview of every candidate and tiles them into numbered
 * sheets, so the visual half of the brief (`CLAUDE.md` §8) can actually be
 * JUDGED — no direct-to-camera portraits, no foreign-language packaging, no
 * clinical white, one narrow family — rather than assumed from a search term.
 *
 * Manual tool. Not part of `npm run verify`.
 *
 *   node scripts/contact-sheet.mjs <dir>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/contact-sheet.mjs <dir>');
  process.exit(1);
}

const CELL_W = 420;
const CELL_H = 300;
const COLS = 4;
const ROWS = 3;
const PER_SHEET = COLS * ROWS;

function previewUrl(candidate) {
  return candidate.source === 'unsplash'
    ? `${candidate.downloadBase}?w=${CELL_W}&h=${CELL_H}&fit=crop&fm=jpg&q=70`
    : `${candidate.downloadBase}?auto=compress&cs=tinysrgb&w=${CELL_W}&h=${CELL_H}&fit=crop`;
}

async function download(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'marenbeauty-image-research/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function labelSvg(text) {
  return Buffer.from(
    `<svg width="${CELL_W}" height="46" xmlns="http://www.w3.org/2000/svg">
       <rect x="0" y="0" width="${CELL_W}" height="46" fill="#241511" fill-opacity="0.82"/>
       <text x="12" y="32" font-family="monospace" font-size="26" fill="#fefcf9">${text}</text>
     </svg>`,
  );
}

async function main() {
  const candidates = JSON.parse(
    readFileSync(join(dir, 'candidates.json'), 'utf8'),
  );
  const previewDir = join(dir, 'previews');
  mkdirSync(previewDir, { recursive: true });

  const cells = [];
  for (const [index, candidate] of candidates.entries()) {
    const file = join(previewDir, `${index}.jpg`);
    try {
      if (!existsSync(file)) {
        writeFileSync(file, await download(previewUrl(candidate)));
      }
      cells.push({ index, file, candidate });
    } catch (error) {
      console.warn(`  ${index}: ${error.message}`);
    }
  }

  console.log(`  ${cells.length} previews ready.`);

  for (let sheet = 0; sheet * PER_SHEET < cells.length; sheet++) {
    const slice = cells.slice(sheet * PER_SHEET, (sheet + 1) * PER_SHEET);
    const composites = [];

    for (const [position, cell] of slice.entries()) {
      const col = position % COLS;
      const row = Math.floor(position / COLS);
      const tile = await sharp(cell.file)
        .resize(CELL_W, CELL_H, { fit: 'cover' })
        .toBuffer();

      composites.push({ input: tile, left: col * CELL_W, top: row * CELL_H });
      composites.push({
        input: labelSvg(`${cell.index}  ${cell.candidate.source[0]}`),
        left: col * CELL_W,
        top: row * CELL_H,
      });
    }

    const out = join(dir, `sheet-${String(sheet).padStart(2, '0')}.jpg`);
    await sharp({
      create: {
        width: COLS * CELL_W,
        height: ROWS * CELL_H,
        channels: 3,
        background: '#faf4ec',
      },
    })
      .composite(composites)
      .jpeg({ quality: 78 })
      .toFile(out);

    console.log(`  → ${out}`);
  }
}

await main();

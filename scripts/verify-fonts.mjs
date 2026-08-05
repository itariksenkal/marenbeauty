/**
 * F1 — Turkish glyph coverage gate. docs/OPEN-QUESTIONS.md F1.
 *
 * A missing glyph in a display serif does not fail loudly: the browser
 * substitutes from a fallback family and the word renders in a different
 * typeface, mid-sentence, on every page of a Turkish site. Dotless "ı" and
 * dotted "İ" are where display faces most often fall down.
 *
 * So this is not an eyeball check. It decodes each shipped .woff2, reads the
 * real `cmap` table, and asserts every required codepoint is actually present
 * in the bytes we serve. It also reads `fvar` so the variable axes the design
 * system depends on are confirmed rather than assumed.
 *
 * WOFF2 container: 48-byte header, table directory, then a Brotli stream
 * holding every table concatenated in directory order with no padding. Only
 * glyf/loca are ever transformed, so `cmap`, `fvar` and `name` are readable
 * verbatim once decompressed.
 */
import { brotliDecompressSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** WOFF2 known-table tags, index 0..62. Index 63 means a 4-byte tag follows. */
const KNOWN_TAGS = [
  'cmap',
  'head',
  'hhea',
  'hmtx',
  'maxp',
  'name',
  'OS/2',
  'post',
  'cvt ',
  'fpgm',
  'glyf',
  'loca',
  'prep',
  'CFF ',
  'VORG',
  'EBDT',
  'EBLC',
  'gasp',
  'hdmx',
  'kern',
  'LTSH',
  'PCLT',
  'VDMX',
  'vhea',
  'vmtx',
  'BASE',
  'GDEF',
  'GPOS',
  'GSUB',
  'EBSC',
  'JSTF',
  'MATH',
  'CBDT',
  'CBLC',
  'COLR',
  'CPAL',
  'SVG ',
  'sbix',
  'acnt',
  'avar',
  'bdat',
  'bloc',
  'bsln',
  'cvar',
  'fdsc',
  'feat',
  'fmtx',
  'fvar',
  'gvar',
  'hsty',
  'just',
  'lcar',
  'mort',
  'morx',
  'opbd',
  'prop',
  'trak',
  'Zapf',
  'Silf',
  'Glat',
  'Gloc',
  'Feat',
  'Sill',
];

function readUIntBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf[pos + i];
    if (byte === undefined)
      throw new Error('UIntBase128 ran past end of buffer');
    if (i === 0 && byte === 0x80)
      throw new Error('UIntBase128 has a leading zero');
    if (value & 0xfe000000) throw new Error('UIntBase128 overflow');
    value = ((value << 7) | (byte & 0x7f)) >>> 0;
    if ((byte & 0x80) === 0) return [value, pos + i + 1];
  }
  throw new Error('UIntBase128 longer than 5 bytes');
}

/** Decode a .woff2 into a map of tag -> Buffer of that table's bytes. */
function readWoff2Tables(file) {
  const buf = readFileSync(file);
  if (buf.toString('latin1', 0, 4) !== 'wOF2') {
    throw new Error(`${file} is not a WOFF2 file`);
  }

  const numTables = buf.readUInt16BE(12);
  const totalCompressedSize = buf.readUInt32BE(20);

  let pos = 48;
  const directory = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos];
    pos += 1;
    const tagIndex = flags & 0x3f;
    const transformVersion = (flags >> 6) & 0x03;

    let tag;
    if (tagIndex === 63) {
      tag = buf.toString('latin1', pos, pos + 4);
      pos += 4;
    } else {
      tag = KNOWN_TAGS[tagIndex];
    }

    let origLength;
    [origLength, pos] = readUIntBase128(buf, pos);

    // glyf/loca invert the meaning of version 0; every other table is
    // untransformed at version 0.
    const isGlyfLoca = tag === 'glyf' || tag === 'loca';
    const transformed = isGlyfLoca
      ? transformVersion === 0
      : transformVersion !== 0;

    let length = origLength;
    if (transformed) [length, pos] = readUIntBase128(buf, pos);

    directory.push({ tag, length });
  }

  const decompressed = brotliDecompressSync(
    buf.subarray(pos, pos + totalCompressedSize),
  );

  const tables = new Map();
  let offset = 0;
  for (const { tag, length } of directory) {
    tables.set(tag, decompressed.subarray(offset, offset + length));
    offset += length;
  }
  return tables;
}

/** Collect every codepoint a cmap table maps to a non-zero glyph. */
function cmapCoverage(cmap) {
  const covered = new Set();
  const numTables = cmap.readUInt16BE(2);

  const subtables = [];
  for (let i = 0; i < numTables; i++) {
    const rec = 4 + i * 8;
    subtables.push({
      platformID: cmap.readUInt16BE(rec),
      encodingID: cmap.readUInt16BE(rec + 2),
      offset: cmap.readUInt32BE(rec + 4),
    });
  }

  // Prefer full-repertoire Unicode subtables, then BMP ones.
  const ranked = subtables.sort((a, b) => {
    const score = (s) =>
      (s.platformID === 3 && s.encodingID === 10) ||
      (s.platformID === 0 && s.encodingID === 4)
        ? 2
        : (s.platformID === 3 && s.encodingID === 1) || s.platformID === 0
          ? 1
          : 0;
    return score(b) - score(a);
  });

  for (const sub of ranked) {
    const format = cmap.readUInt16BE(sub.offset);

    if (format === 4) {
      const base = sub.offset;
      const segCount = cmap.readUInt16BE(base + 6) / 2;
      const endBase = base + 14;
      const startBase = endBase + segCount * 2 + 2;
      const deltaBase = startBase + segCount * 2;
      const rangeBase = deltaBase + segCount * 2;

      for (let s = 0; s < segCount; s++) {
        const end = cmap.readUInt16BE(endBase + s * 2);
        const start = cmap.readUInt16BE(startBase + s * 2);
        if (start === 0xffff) continue;
        const delta = cmap.readInt16BE(deltaBase + s * 2);
        const rangeOffset = cmap.readUInt16BE(rangeBase + s * 2);

        for (let cp = start; cp <= end && cp !== 0x10000; cp++) {
          let glyph;
          if (rangeOffset === 0) {
            glyph = (cp + delta) & 0xffff;
          } else {
            const gi = rangeBase + s * 2 + rangeOffset + (cp - start) * 2;
            if (gi + 1 >= cmap.length) continue;
            glyph = cmap.readUInt16BE(gi);
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) covered.add(cp);
        }
      }
      return covered;
    }

    if (format === 12) {
      const nGroups = cmap.readUInt32BE(sub.offset + 12);
      for (let g = 0; g < nGroups; g++) {
        const rec = sub.offset + 16 + g * 12;
        const start = cmap.readUInt32BE(rec);
        const end = cmap.readUInt32BE(rec + 4);
        const startGlyph = cmap.readUInt32BE(rec + 8);
        if (startGlyph === 0) continue;
        for (let cp = start; cp <= end; cp++) covered.add(cp);
      }
      return covered;
    }
  }

  throw new Error('no usable cmap subtable (need format 4 or 12)');
}

/** Read variable-font axes so the design system's assumptions are confirmed. */
function readAxes(tables) {
  const fvar = tables.get('fvar');
  if (!fvar) return null;
  const axisCount = fvar.readUInt16BE(8);
  const axisSize = fvar.readUInt16BE(10);
  const axesStart = fvar.readUInt16BE(4);
  const axes = [];
  for (let i = 0; i < axisCount; i++) {
    const rec = axesStart + i * axisSize;
    axes.push({
      tag: fvar.toString('latin1', rec, rec + 4),
      min: fvar.readInt32BE(rec + 4) / 65536,
      def: fvar.readInt32BE(rec + 8) / 65536,
      max: fvar.readInt32BE(rec + 12) / 65536,
    });
  }
  return axes;
}

// ── What must be present ────────────────────────────────────────────────────

const TURKISH = [
  ['ı', 0x0131, 'dotless i — the classic display-serif failure'],
  ['İ', 0x0130, 'dotted capital I — the other classic failure'],
  ['ş', 0x015f, 's-cedilla'],
  ['Ş', 0x015e, 'S-cedilla'],
  ['ğ', 0x011f, 'g-breve'],
  ['Ğ', 0x011e, 'G-breve'],
  ['ü', 0x00fc, 'u-diaeresis'],
  ['Ü', 0x00dc, 'U-diaeresis'],
  ['ö', 0x00f6, 'o-diaeresis'],
  ['Ö', 0x00d6, 'O-diaeresis'],
  ['ç', 0x00e7, 'c-cedilla'],
  ['Ç', 0x00c7, 'C-cedilla'],
  ['i', 0x0069, 'dotted i'],
  ['I', 0x0049, 'dotless capital I'],
];

/** Typography the copy actually uses (docs/BRIEF.md §5, microcopy). */
const TYPOGRAPHY = [
  ['–', 0x2013, 'en dash'],
  ['—', 0x2014, 'em dash'],
  ['’', 0x2019, 'apostrophe — Turkish suffixes after proper nouns'],
  ['“', 0x201c, 'left double quote'],
  ['”', 0x201d, 'right double quote'],
  ['…', 0x2026, 'ellipsis'],
];

const FAMILIES = [
  {
    name: 'Fraunces',
    role: 'display',
    files: [
      'src/fonts/fraunces-latin.woff2',
      'src/fonts/fraunces-latin-ext.woff2',
    ],
  },
  {
    name: 'Manrope',
    role: 'text',
    files: [
      'src/fonts/manrope-latin.woff2',
      'src/fonts/manrope-latin-ext.woff2',
    ],
  },
];

// ── Run ─────────────────────────────────────────────────────────────────────

const required = [...TURKISH, ...TYPOGRAPHY];
let failed = false;

console.log('\n  F1 — Turkish glyph coverage (docs/OPEN-QUESTIONS.md F1)\n');

for (const family of FAMILIES) {
  const union = new Set();
  const perFile = [];

  for (const rel of family.files) {
    const file = join(root, rel);
    if (!existsSync(file)) {
      console.error(`  ✗ ${family.name}: missing ${rel}`);
      failed = true;
      continue;
    }
    const tables = readWoff2Tables(file);
    const cmap = tables.get('cmap');
    if (!cmap) throw new Error(`${rel} has no cmap table`);
    const covered = cmapCoverage(cmap);
    for (const cp of covered) union.add(cp);
    perFile.push({ rel, count: covered.size, axes: readAxes(tables) });
  }

  const axes = perFile.find((f) => f.axes)?.axes ?? null;
  const axisLabel = axes
    ? axes.map((a) => `${a.tag} ${a.min}..${a.max} (def ${a.def})`).join(', ')
    : 'static (no fvar)';

  console.log(`  ${family.name}  [${family.role}]  — ${axisLabel}`);
  for (const f of perFile) {
    console.log(
      `      ${f.rel.padEnd(38)} ${String(f.count).padStart(5)} codepoints`,
    );
  }

  const missing = required.filter(([, cp]) => !union.has(cp));
  if (missing.length) {
    failed = true;
    console.error(`\n      ✗ ${missing.length} REQUIRED GLYPH(S) MISSING:`);
    for (const [ch, cp, note] of missing) {
      console.error(
        `          ${ch}  U+${cp.toString(16).toUpperCase().padStart(4, '0')}  ${note}`,
      );
    }
    console.error(
      `\n      This family cannot ship. Swap it now (M1), not later —\n` +
        `      a fallback glyph mid-word appears on every page of the site.\n`,
    );
  } else {
    const shown = required.map(([ch]) => ch).join(' ');
    console.log(
      `      ✓ all ${required.length} required glyphs present:  ${shown}\n`,
    );
  }
}

if (failed) {
  console.error('  F1 FAILED.\n');
  process.exit(1);
}
console.log(
  '  ✓ F1 passed — both families cover Turkish in the bytes we ship.\n',
);

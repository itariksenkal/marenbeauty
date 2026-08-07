/**
 * Generates the Maren Beauty logo set into `public/brand/`.
 *
 * ⚠️ GENERATED OUTPUT. Do not hand-edit `public/brand/**` or `src/config/logo.ts`
 * — re-run `node scripts/build-logo.mjs` instead. A unit test asserts the two
 * have not drifted from each other, the same contract the image manifest uses.
 *
 * Every letter is outlined to path data rather than set as `<text>`, because a
 * logo has to survive contexts with no webfont: a favicon, an Instagram avatar,
 * a print PDF, an `<img>` tag. `scripts/lib/truetype.mjs` reads the outlines out
 * of the same `.ttf` files the OG cards use, so the wordmark is genuinely the
 * site's display serif and not an approximation of it.
 *
 * THREE M TREATMENTS, and they are meant to be arguments rather than options:
 *
 *   arch     constructed, curved, monoline. Two half-circle arches on three
 *            legs — a doorway read as an M. Nothing typographic about it.
 *   serif    the Fraunces capital M itself, solid, on a fine engraver's rule.
 *            The typographic answer: the logo is the site's own display face.
 *   seal     a container rather than a letter. A geometric M knocked out of
 *            a rounded lozenge — avatar-shaped before it is anything else.
 *
 * Colour is `currentColor` throughout — one flat colour, set by the context,
 * which is what lets the same file sit on ivory and on espresso. No default is
 * baked in: a `color` attribute or an internal `<style>` on the root would win
 * against an inherited value and make the inverse colourway impossible to set
 * from CSS. Fixed-colour copies for the favicon and Instagram are worth cutting
 * once a treatment is chosen, not before.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseFont } from './lib/truetype.mjs';

const ROOT = process.cwd();
const BRAND_DIR = join(ROOT, 'public', 'brand');

/* ── fonts ─────────────────────────────────────────────────────────────── */

function loadFont(file) {
  const font = parseFont(readFileSync(join(ROOT, 'src', 'fonts', 'og', file)));
  // Cap height measured off the actual 'M', not read from OS/2: the two
  // disagree in plenty of fonts and it is the ink that has to line up.
  const capHeight = Math.max(
    ...font
      .outlineFor('M')
      .filter((c) => c.type !== 'Z')
      .map((c) => c.y),
  );
  return { ...font, capHeight };
}

const display = loadFont('fraunces-og.ttf'); // Fraunces — MAREN
const sans = loadFont('manrope-og.ttf'); // Manrope — BEAUTY

/* ── path building ─────────────────────────────────────────────────────── */

const round = (n) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};

/**
 * Font units (y up, baseline at 0) to output units (y down).
 * `scale` maps cap height to the size asked for; `x`/`y` place the baseline.
 */
function place(commands, { scale, x, y }) {
  const px = (v) => round(v * scale + x);
  const py = (v) => round(-v * scale + y);
  const out = [];
  for (const c of commands) {
    if (c.type === 'M') out.push(`M${px(c.x)} ${py(c.y)}`);
    else if (c.type === 'L') out.push(`L${px(c.x)} ${py(c.y)}`);
    else if (c.type === 'Q')
      out.push(`Q${px(c.cx)} ${py(c.cy)} ${px(c.x)} ${py(c.y)}`);
    else out.push('Z');
  }
  return out.join('');
}

/** Exact bounds, including quadratic extrema — control points overstate it. */
function bounds(commands) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;

  const hit = (x, y) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  for (const c of commands) {
    if (c.type === 'Z') continue;
    if (c.type === 'Q') {
      // A quadratic leaves its endpoint hull only where the derivative is
      // zero, at t = (p0 - c) / (p0 - 2c + p2) on each axis.
      for (const [p0, ctrl, p2, axis] of [
        [cx, c.cx, c.x, 'x'],
        [cy, c.cy, c.y, 'y'],
      ]) {
        const denominator = p0 - 2 * ctrl + p2;
        if (denominator === 0) continue;
        const t = (p0 - ctrl) / denominator;
        if (t <= 0 || t >= 1) continue;
        const value =
          (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * ctrl + t * t * p2;
        if (axis === 'x') hit(value, cy);
        else hit(cx, value);
      }
    }
    hit(c.x, c.y);
    cx = c.x;
    cy = c.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * A word, letterspaced, as one path.
 *
 * Returns the INK bounds rather than the advance width, because the mark is
 * centred optically: letterspacing leaves a trailing gap after the last letter,
 * and centring on advance width would push every word visibly left.
 */
function word(font, text, { capHeight, tracking, x = 0, y = 0 }) {
  const scale = capHeight / font.capHeight;
  const parts = [];
  let pen = 0;

  for (const character of text) {
    parts.push(place(font.outlineFor(character), { scale, x: x + pen, y }));
    pen += font.advanceFor(character) * scale + tracking;
  }

  // Bounds in output space: re-walk the glyphs with the same transform.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  pen = 0;
  for (const character of text) {
    const b = bounds(font.outlineFor(character));
    minX = Math.min(minX, x + pen + b.minX * scale);
    maxX = Math.max(maxX, x + pen + b.maxX * scale);
    minY = Math.min(minY, y - b.maxY * scale);
    maxY = Math.max(maxY, y - b.minY * scale);
    pen += font.advanceFor(character) * scale + tracking;
  }

  return { d: parts.join(''), minX, maxX, minY, maxY, width: maxX - minX };
}

/* ── the three M treatments ────────────────────────────────────────────── */

/**
 * Each returns parts drawn inside a 1000×1000 box, plus the ink box so the
 * lockups can place the mark on its optical centre rather than its canvas.
 *
 * `small` is the 32px form. Where a treatment carries a detail that cannot
 * survive at that size it is dropped here rather than shipped as a smudge —
 * see `docs/OPEN-QUESTIONS.md` G31 for what was measured.
 */

/** ARCH — two half-circle arches on three legs. Monoline, so it is stroked. */
function archMark({ small = false } = {}) {
  const stroke = small ? 108 : 92;
  const left = 150;
  const right = 850;
  const foot = 812;
  const top = 210;

  const legs = [left, 500, right];
  const radius = (legs[1] - legs[0]) / 2;
  const spring = top + radius;

  const d =
    `M${left} ${foot}V${spring}` +
    `A${radius} ${radius} 0 0 1 ${legs[1]} ${spring}` +
    `V${foot}` +
    `M${legs[1]} ${spring}` +
    `A${radius} ${radius} 0 0 1 ${right} ${spring}` +
    `V${foot}`;

  // Ink, not geometry: a stroked path is half a stroke wider than its
  // centreline on every side, and the arc's crown is the top of that.
  return {
    parts: [{ d, mode: 'stroke', width: stroke, cap: 'round', join: 'round' }],
    ink: {
      minX: left - stroke / 2,
      maxX: right + stroke / 2,
      minY: top - stroke / 2,
      maxY: foot + stroke / 2,
    },
  };
}

/** SERIF — the Fraunces M, solid, over a fine engraver's rule. */
function serifMark({ small = false } = {}) {
  const capHeight = 620;
  const glyph = bounds(display.outlineFor('M'));
  const scale = capHeight / display.capHeight;
  const inkWidth = (glyph.maxX - glyph.minX) * scale;

  const x = 500 - inkWidth / 2 - glyph.minX * scale;
  const baseline = small ? 760 : 660;

  const parts = [
    {
      d: place(display.outlineFor('M'), { scale, x, y: baseline }),
      mode: 'fill',
    },
  ];

  let ink = {
    minX: 500 - inkWidth / 2,
    maxX: 500 + inkWidth / 2,
    minY: baseline - capHeight,
    maxY: baseline,
  };

  if (!small) {
    // The rule is the treatment. At 32px it lands under 1px and turns into a
    // grey smear under the letter, so the 32px form is the letter alone.
    const ruleY = 812;
    const ruleWidth = 34;
    const half = inkWidth / 2 + 70;
    parts.push({
      d: `M${round(500 - half)} ${ruleY}H${round(500 + half)}`,
      mode: 'stroke',
      width: ruleWidth,
      cap: 'butt',
      join: 'miter',
    });
    ink = {
      ...ink,
      minX: 500 - half,
      maxX: 500 + half,
      maxY: ruleY + ruleWidth / 2,
    };
  }

  return { parts, ink };
}

/**
 * A geometric M as one closed polygon.
 *
 * Built the way a type designer builds one, not as a thick zigzag: the stems
 * are full-height verticals of width `t`, and each diagonal is a parallelogram
 * — its inner edge is the outer edge shifted HORIZONTALLY by `t`, never
 * vertically. The first attempt offset vertically, which tapers both diagonals
 * to needles and closes the middle notch to a nick; at 32px it stopped being a
 * letter (see `docs/OPEN-QUESTIONS.md` G31).
 *
 * A consequence of that construction, not a free choice: the two inner
 * diagonals meet at `vOuter * (1 - 2t)`, so the inner vertex height falls out
 * of the stem width. Setting it by eye is what bends the strokes.
 *
 * Coordinates are 0..1, y down.
 */
function geometricM({ t, vOuter }) {
  const vInner = vOuter * (1 - 2 * t);
  const points = [
    [0, 1],
    [0, 0],
    [0.5, vOuter],
    [1, 0],
    [1, 1],
    [1 - t, 1],
    [1 - t, 0],
    [0.5, vInner],
    [t, 0],
    [t, 1],
  ];
  return { points, vInner };
}

/** Rounded rectangle as path data — the lozenge the seal is cut from. */
function roundedRect(x, y, size, radius) {
  const r = radius;
  return (
    `M${round(x + r)} ${round(y)}` +
    `H${round(x + size - r)}A${r} ${r} 0 0 1 ${round(x + size)} ${round(y + r)}` +
    `V${round(y + size - r)}A${r} ${r} 0 0 1 ${round(x + size - r)} ${round(y + size)}` +
    `H${round(x + r)}A${r} ${r} 0 0 1 ${round(x)} ${round(y + size - r)}` +
    `V${round(y + r)}A${r} ${r} 0 0 1 ${round(x + r)} ${round(y)}Z`
  );
}

/**
 * SEAL — the M knocked out of a rounded lozenge.
 *
 * A different SYSTEM to the other two rather than a third drawing of a letter:
 * this one is a stamp, and it is the only mark here that is avatar-shaped
 * before it is anything else, which is what Instagram and a favicon actually
 * ask for. One flat colour still works both ways round — the M is a hole, so
 * on espresso it shows espresso through an ivory lozenge.
 */
function sealMark({ small = false } = {}) {
  const box = 1000;
  // Heavier stems and a shallower V at 32px: the knockout is what has to
  // survive, and a hole is the first thing antialiasing closes.
  const { points } = geometricM({
    t: small ? 0.23 : 0.2,
    vOuter: small ? 0.74 : 0.78,
  });

  const width = small ? 480 : 500;
  const height = small ? 400 : 430;
  const x = (box - width) / 2;
  const y = (box - height) / 2;

  const m =
    'M' +
    points
      .map(([px, py]) => `${round(x + px * width)} ${round(y + py * height)}`)
      .join('L') +
    'Z';

  return {
    parts: [
      {
        d: `${roundedRect(0, 0, box, small ? 250 : 280)}${m}`,
        mode: 'fill',
        rule: 'evenodd',
      },
    ],
    ink: { minX: 0, maxX: box, minY: 0, maxY: box },
  };
}

const TREATMENTS = {
  arch: {
    label: 'Arch',
    note: 'Constructed and curved. Two half-circle arches on three legs — a doorway that reads as an M. Monoline, nothing typographic in it.',
    mark: archMark,
  },
  serif: {
    label: 'Serif',
    note: "The site's own display face. The Fraunces capital M, solid, over a fine engraver's rule. The rule is dropped at 32px.",
    mark: serifMark,
  },
  seal: {
    label: 'Seal',
    note: 'A container, not a third drawing of a letter. A geometric M knocked out of a rounded lozenge — the only mark here that is avatar-shaped before it is anything else, which is what a favicon and an Instagram profile actually ask for.',
    mark: sealMark,
  },
};

/* ── lockups ───────────────────────────────────────────────────────────── */

/**
 * Rewrite a path's geometry, command by command.
 *
 * Written as a real (if tiny) parser rather than a regex over the numbers.
 * The first attempt rewrote every number positionally as an x,y pair, which
 * silently mangles `V` and `H` — they carry ONE coordinate — and turned the
 * arch mark inside out while still producing a perfectly valid path. It throws
 * on any command it does not know, so the next person to add one finds out
 * here instead of in a logo that is quietly the wrong shape.
 */
function mapPath(d, { point, length }) {
  const tokens = d.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  const out = [];
  let command = '';
  let i = 0;
  let cursor = { x: 0, y: 0 };

  const next = () => Number(tokens[i++]);
  const emit = (...values) => out.push(values.map(round).join(' '));

  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      command = tokens[i++];
      out.push(command);
      if (command === 'Z') continue;
      continue;
    }

    if (command === 'M' || command === 'L') {
      const [x, y] = point(next(), next());
      cursor = { x, y };
      emit(x, y);
    } else if (command === 'Q') {
      const [cx, cy] = point(next(), next());
      const [x, y] = point(next(), next());
      cursor = { x, y };
      emit(cx, cy, x, y);
    } else if (command === 'A') {
      const rx = length(next());
      const ry = length(next());
      const rotation = next();
      const largeArc = next();
      const sweep = next();
      const [x, y] = point(next(), next());
      cursor = { x, y };
      out.push(
        `${round(rx)} ${round(ry)} ${rotation} ${largeArc} ${sweep} ${round(x)} ${round(y)}`,
      );
    } else if (command === 'H') {
      const [x] = point(next(), cursor.y);
      cursor = { ...cursor, x };
      emit(x);
    } else if (command === 'V') {
      const [, y] = point(cursor.x, next());
      cursor = { ...cursor, y };
      emit(y);
    } else {
      throw new Error(
        `mapPath: unsupported command ${JSON.stringify(command)}`,
      );
    }
  }

  return out.join('');
}

/** Scale and shift a treatment's parts from its 1000-box into a lockup. */
function transformParts(parts, { scale, dx, dy }) {
  const d = (path) =>
    mapPath(path, {
      point: (x, y) => [x * scale + dx, y * scale + dy],
      length: (v) => v * scale,
    });

  return parts.map((part) =>
    part.mode === 'stroke'
      ? { ...part, d: d(part.d), width: round(part.width * scale) }
      : { ...part, d: d(part.d) },
  );
}

function svgFor({ viewBox, parts, title }) {
  const body = parts
    .map((part) =>
      part.mode === 'fill'
        ? `  <path fill="currentColor"${part.rule ? ` fill-rule="${part.rule}"` : ''} d="${part.d}"/>`
        : `  <path fill="none" stroke="currentColor" stroke-width="${part.width}" stroke-linecap="${part.cap}" stroke-linejoin="${part.join}" d="${part.d}"/>`,
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}">
  <title>${title}</title>
${body}
</svg>
`;
}

const PAD = 40;

/**
 * The chosen treatment (docs/OPEN-QUESTIONS.md G31, decided 2026-08-07).
 *
 * Its lockups are written to `public/brand/` as well as
 * `public/brand/serif/`, so the site and anyone downloading a logo reference
 * one canonical path. The other two stay on disk as the rejected options — a
 * choice is easier to revisit when the alternatives are still there.
 */
const CHOSEN = 'serif';

/**
 * Fixed-colour exports, for the places `currentColor` cannot reach.
 *
 * A favicon and an Instagram avatar are rendered with no CSS around them, so
 * `currentColor` resolves to black. These carry the palette instead: espresso
 * ink for the favicon, and the owner's requested dusty rose and cream for the
 * profile picture.
 */
const PALETTE = {
  cream: '#faf4ec',
  blush: '#d2b3a5',
  espresso: '#3a241e',
};

function monogram(treatment, { small = false } = {}) {
  const { parts, ink } = treatment.mark({ small });
  const size = Math.max(ink.maxX - ink.minX, ink.maxY - ink.minY);
  const box = size + PAD * 2;
  const dx = PAD + (size - (ink.maxX - ink.minX)) / 2 - ink.minX;
  const dy = PAD + (size - (ink.maxY - ink.minY)) / 2 - ink.minY;

  return {
    viewBox: `0 0 ${round(box)} ${round(box)}`,
    parts: transformParts(parts, { scale: 1, dx, dy }),
  };
}

/** MAREN over BEAUTY, centred on `centreX`, cap heights driven by `unit`. */
function wordmark({ centreX, top, unit }) {
  const marenCap = unit;
  const beautyCap = unit * 0.4;
  const maren = word(display, 'MAREN', {
    capHeight: marenCap,
    tracking: marenCap * 0.2,
    y: top + marenCap,
  });
  const marenShift = centreX - (maren.minX + maren.maxX) / 2;

  const beautyTop = top + marenCap + unit * 0.62;
  const beauty = word(sans, 'BEAUTY', {
    capHeight: beautyCap,
    tracking: beautyCap * 0.46,
    y: beautyTop + beautyCap,
  });
  const beautyShift = centreX - (beauty.minX + beauty.maxX) / 2;

  return {
    parts: [
      { d: shiftPath(maren.d, marenShift), mode: 'fill' },
      { d: shiftPath(beauty.d, beautyShift), mode: 'fill' },
    ],
    width: Math.max(maren.width, beauty.width),
    bottom: beautyTop + beautyCap,
    marenWidth: maren.width,
  };
}

function shiftPath(d, dx) {
  let index = 0;
  return d.replace(/[A-Za-z]|-?\d+(?:\.\d+)?/g, (token) => {
    if (/[A-Za-z]/.test(token)) {
      index = 0;
      return token;
    }
    const value = Number(token);
    const position = index++;
    return String(round(position % 2 === 0 ? value + dx : value));
  });
}

function stacked(treatment) {
  const { parts, ink } = treatment.mark();
  const markHeight = 300;
  const scale = markHeight / (ink.maxY - ink.minY);
  const markWidth = (ink.maxX - ink.minX) * scale;

  const unit = 132;
  const centreX = 500;
  const markTop = PAD;

  const markParts = transformParts(parts, {
    scale,
    dx: centreX - markWidth / 2 - ink.minX * scale,
    dy: markTop - ink.minY * scale,
  });

  const text = wordmark({ centreX, top: markTop + markHeight + 96, unit });
  const height = text.bottom + PAD;

  return {
    viewBox: `0 0 1000 ${round(height)}`,
    parts: [...markParts, ...text.parts],
  };
}

function horizontal(treatment) {
  const { parts, ink } = treatment.mark();
  const markHeight = 210;
  const scale = markHeight / (ink.maxY - ink.minY);
  const markWidth = (ink.maxX - ink.minX) * scale;

  const unit = 96;
  const gap = 74;
  const markLeft = PAD;

  const text = wordmark({ centreX: 0, top: PAD + 8, unit });
  const textLeft = markLeft + markWidth + gap;

  // The wordmark was laid out around x=0; move it to sit beside the mark.
  const textParts = text.parts.map((part) => ({
    ...part,
    d: shiftPath(part.d, textLeft + text.width / 2),
  }));

  const width = textLeft + text.width + PAD;
  const height = Math.max(markHeight + PAD * 2, text.bottom + PAD);

  const markParts = transformParts(parts, {
    scale,
    dx: markLeft - ink.minX * scale,
    dy: (height - markHeight) / 2 - ink.minY * scale,
  });

  return {
    viewBox: `0 0 ${round(width)} ${round(height)}`,
    parts: [...markParts, ...textParts],
  };
}

/* ── output ────────────────────────────────────────────────────────────── */

rmSync(BRAND_DIR, { recursive: true, force: true });

const generated = {};

for (const [key, treatment] of Object.entries(TREATMENTS)) {
  mkdirSync(join(BRAND_DIR, key), { recursive: true });

  const lockups = {
    monogram: monogram(treatment),
    'monogram-32': monogram(treatment, { small: true }),
    stacked: stacked(treatment),
    horizontal: horizontal(treatment),
  };

  generated[key] = { label: treatment.label, note: treatment.note, lockups };

  for (const [name, lockup] of Object.entries(lockups)) {
    writeFileSync(
      join(BRAND_DIR, key, `${name}.svg`),
      svgFor({
        ...lockup,
        title:
          name === 'stacked' || name === 'horizontal'
            ? 'Maren Beauty'
            : 'Maren Beauty monogram',
      }),
      'utf8',
    );
  }
}

const ts = `/**
 * ⚠️ GENERATED by \`node scripts/build-logo.mjs\`. Do not edit.
 *
 * The same path data that \`public/brand/**\` ships, in a form the styleguide
 * can inline — an \`<img>\` cannot be recoloured, and the whole point of these
 * marks is that one flat colour works on ivory and on espresso. A unit test
 * asserts this file and the SVGs have not drifted apart.
 *
 * Nothing in the site uses this yet: a treatment has not been chosen
 * (docs/OPEN-QUESTIONS.md G31).
 */

export type LogoPart =
  | {
      readonly mode: 'fill';
      readonly d: string;
      /** Present only where a subpath is a knockout — the seal's M. */
      readonly rule?: 'evenodd';
    }
  | {
      readonly mode: 'stroke';
      readonly d: string;
      readonly width: number;
      readonly cap: string;
      readonly join: string;
    };

export type LogoLockup = {
  readonly viewBox: string;
  readonly parts: readonly LogoPart[];
};

export type LogoTreatment = {
  readonly label: string;
  readonly note: string;
  readonly lockups: {
    readonly monogram: LogoLockup;
    readonly 'monogram-32': LogoLockup;
    readonly stacked: LogoLockup;
    readonly horizontal: LogoLockup;
  };
};

export const logoTreatments = ${JSON.stringify(generated, null, 2)} as const satisfies Record<string, LogoTreatment>;

export type LogoTreatmentKey = keyof typeof logoTreatments;
`;

writeFileSync(join(ROOT, 'src', 'config', 'logo.ts'), ts, 'utf8');

/* ── the chosen treatment, promoted and coloured ───────────────────────── */

const chosen = generated[CHOSEN];

/**
 * A fixed-colour copy: `fill`/`stroke` resolved instead of inherited.
 *
 * `inset` is a fraction of the mark's width added as margin on every side.
 * **Instagram crops a profile picture to a CIRCLE**, so a mark that fills its
 * square loses its corners and, here, the engraver's rule along the bottom.
 * At 0.3 the mark sits inside the inscribed circle with room to spare.
 */
function coloured(lockup, ink, background = null, inset = 0) {
  const [, , boxWidth, boxHeight] = lockup.viewBox.split(' ').map(Number);
  const margin = boxWidth * inset;
  const width = boxWidth + margin * 2;
  const height = boxHeight + margin * 2;
  const viewBox = `${round(-margin)} ${round(-margin)} ${round(width)} ${round(height)}`;
  const body = lockup.parts
    .map((part) =>
      part.mode === 'fill'
        ? `  <path fill="${ink}"${part.rule ? ` fill-rule="${part.rule}"` : ''} d="${part.d}"/>`
        : `  <path fill="none" stroke="${ink}" stroke-width="${part.width}" stroke-linecap="${part.cap}" stroke-linejoin="${part.join}" d="${part.d}"/>`,
    )
    .join('\n');

  const plate = background
    ? `  <rect x="${round(-margin)}" y="${round(-margin)}" width="${round(width)}" height="${round(height)}" fill="${background}"/>\n`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Maren Beauty">
  <title>Maren Beauty</title>
${plate}${body}
</svg>
`;
}

for (const [name, lockup] of Object.entries(chosen.lockups)) {
  writeFileSync(
    join(BRAND_DIR, `${name}.svg`),
    svgFor({
      ...lockup,
      title: name.startsWith('monogram')
        ? 'Maren Beauty monogram'
        : 'Maren Beauty',
    }),
    'utf8',
  );
}

// Favicon: the 32px form, because that is the size it is actually used at, and
// espresso rather than currentColor, because a favicon has no CSS around it.
writeFileSync(
  join(ROOT, 'public', 'icon.svg'),
  coloured(chosen.lockups['monogram-32'], PALETTE.espresso),
  'utf8',
);

// The Instagram avatar, as SVG here and rasterised to PNG by
// `node scripts/build-avatar.mjs` — Instagram will not take an SVG.
writeFileSync(
  join(BRAND_DIR, 'instagram-avatar.svg'),
  coloured(chosen.lockups.monogram, PALETTE.cream, PALETTE.blush, 0.3),
  'utf8',
);

const count = Object.keys(TREATMENTS).length;
console.log(`  logo: ${count} treatments × 4 lockups written to public/brand/`);
console.log(
  `  logo: '${CHOSEN}' promoted to public/brand/ and public/icon.svg`,
);
console.log('  logo: src/config/logo.ts regenerated');

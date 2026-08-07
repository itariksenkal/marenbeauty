/**
 * A minimal TrueType reader — enough to turn a letter into an SVG outline.
 *
 * WHY THIS EXISTS. The logo has to render with no font loaded (a favicon, an
 * Instagram avatar, a print PDF, an `<img>` tag), so every letter in it must
 * ship as path data rather than as `<text>`. Nothing in the dependency tree
 * can do that: `satori` reads fonts but only to rasterise, and adding
 * `opentype.js` or `fontkit` to draw nine letters once would be a permanent
 * runtime dependency bought for a build-time job — and a licence entry
 * (`CLAUDE.md` §2) for something used by one script.
 *
 * Scope is deliberately small. `src/fonts/og/*.ttf` are static `glyf` outlines
 * at 2000 units/em with no `fvar`, `gvar` or `CFF ` table, which is the easy
 * case, and the script that uses this asserts every glyph it wants is a simple
 * (non-composite) one. Anything outside that throws rather than guessing —
 * a logo that is silently the wrong shape is worse than a build that stops.
 */

const ON_CURVE = 0x01;
const X_SHORT = 0x02;
const Y_SHORT = 0x04;
const REPEAT = 0x08;
const X_SAME_OR_POSITIVE = 0x10;
const Y_SAME_OR_POSITIVE = 0x20;

/** @returns {Record<string, {offset: number, length: number}>} */
function readTableDirectory(buf) {
  const numTables = buf.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    tables[buf.toString('ascii', record, record + 4)] = {
      offset: buf.readUInt32BE(record + 8),
      length: buf.readUInt32BE(record + 12),
    };
  }
  return tables;
}

/**
 * Character map, format 4 only — the segmented format every Latin font uses
 * for the BMP. Latin capitals are all we ask for.
 */
function readCmap(buf, offset) {
  const numSubtables = buf.readUInt16BE(offset + 2);
  let best = null;

  for (let i = 0; i < numSubtables; i++) {
    const record = offset + 4 + i * 8;
    const platformId = buf.readUInt16BE(record);
    const encodingId = buf.readUInt16BE(record + 2);
    const subtableOffset = offset + buf.readUInt32BE(record + 4);
    // (3,1) Windows BMP is the one to want; (0,x) Unicode is an acceptable
    // fallback. Anything else is a legacy encoding we should not read.
    if (platformId === 3 && encodingId === 1) best = subtableOffset;
    else if (best === null && platformId === 0) best = subtableOffset;
  }
  if (best === null) throw new Error('cmap: no Unicode subtable');

  const format = buf.readUInt16BE(best);
  if (format !== 4) throw new Error(`cmap: format ${format} not supported`);

  const segCountX2 = buf.readUInt16BE(best + 6);
  const segCount = segCountX2 / 2;
  const endCodes = best + 14;
  const startCodes = endCodes + segCountX2 + 2;
  const idDeltas = startCodes + segCountX2;
  const idRangeOffsets = idDeltas + segCountX2;

  const map = new Map();
  for (let seg = 0; seg < segCount; seg++) {
    const end = buf.readUInt16BE(endCodes + seg * 2);
    const start = buf.readUInt16BE(startCodes + seg * 2);
    const delta = buf.readInt16BE(idDeltas + seg * 2);
    const rangeOffset = buf.readUInt16BE(idRangeOffsets + seg * 2);
    if (start === 0xffff) continue;

    for (let code = start; code <= end; code++) {
      let gid;
      if (rangeOffset === 0) {
        gid = (code + delta) & 0xffff;
      } else {
        const glyphIndexAddress =
          idRangeOffsets + seg * 2 + rangeOffset + (code - start) * 2;
        gid = buf.readUInt16BE(glyphIndexAddress);
        if (gid !== 0) gid = (gid + delta) & 0xffff;
      }
      if (gid !== 0) map.set(code, gid);
    }
  }
  return map;
}

/**
 * One glyph's contours, in font units with y UP (the font's own axis — the
 * caller flips, because it is the caller that knows where the baseline sits).
 *
 * @returns {Array<Array<{x: number, y: number, on: boolean}>>}
 */
function readGlyph(buf, glyfOffset, start, end) {
  // An empty range is a blank glyph — a space, and legitimately no contours.
  if (start >= end) return [];

  let p = glyfOffset + start;
  const numberOfContours = buf.readInt16BE(p);
  if (numberOfContours < 0) {
    throw new Error(
      'composite glyph: not supported. Decompose it in the font, or extend ' +
        'this reader — do not approximate it.',
    );
  }
  p += 10; // skip numberOfContours + xMin/yMin/xMax/yMax

  const endPts = [];
  for (let i = 0; i < numberOfContours; i++, p += 2) {
    endPts.push(buf.readUInt16BE(p));
  }
  const numPoints = numberOfContours === 0 ? 0 : endPts[endPts.length - 1] + 1;

  const instructionLength = buf.readUInt16BE(p);
  p += 2 + instructionLength;

  const flags = [];
  while (flags.length < numPoints) {
    const flag = buf.readUInt8(p++);
    flags.push(flag);
    if (flag & REPEAT) {
      let repeats = buf.readUInt8(p++);
      while (repeats-- > 0 && flags.length < numPoints) flags.push(flag);
    }
  }

  const readCoords = (shortBit, sameBit) => {
    const values = [];
    let value = 0;
    for (const flag of flags) {
      if (flag & shortBit) {
        const delta = buf.readUInt8(p++);
        value += flag & sameBit ? delta : -delta;
      } else if (!(flag & sameBit)) {
        value += buf.readInt16BE(p);
        p += 2;
      }
      values.push(value);
    }
    return values;
  };

  const xs = readCoords(X_SHORT, X_SAME_OR_POSITIVE);
  const ys = readCoords(Y_SHORT, Y_SAME_OR_POSITIVE);

  const contours = [];
  let first = 0;
  for (const last of endPts) {
    const contour = [];
    for (let i = first; i <= last; i++) {
      contour.push({ x: xs[i], y: ys[i], on: (flags[i] & ON_CURVE) !== 0 });
    }
    contours.push(contour);
    first = last + 1;
  }
  return contours;
}

/**
 * Contours to drawing commands.
 *
 * TrueType curves are quadratic and a contour may start off-curve or run two
 * off-curve points together, in which case the on-curve point between them is
 * implied at their midpoint. Missing that rule is the classic way to get an
 * outline that is subtly faceted rather than obviously broken, so it is
 * handled explicitly rather than by starting at point zero and hoping.
 */
export function contoursToCommands(contours) {
  const commands = [];

  for (const points of contours) {
    if (points.length === 0) continue;

    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    // Start at an on-curve point. If the contour has none, every point is a
    // control point and the true start is the midpoint of the last and first.
    let startIndex = points.findIndex((pt) => pt.on);
    let start;
    if (startIndex === -1) {
      start = mid(points[points.length - 1], points[0]);
      startIndex = 0;
    } else {
      start = points[startIndex];
      startIndex += 1;
    }

    commands.push({ type: 'M', x: start.x, y: start.y });

    let control = null;
    for (let i = 0; i < points.length; i++) {
      const point = points[(startIndex + i) % points.length];
      if (point.on) {
        if (control) {
          commands.push({
            type: 'Q',
            cx: control.x,
            cy: control.y,
            x: point.x,
            y: point.y,
          });
          control = null;
        } else {
          commands.push({ type: 'L', x: point.x, y: point.y });
        }
      } else if (control) {
        // Two controls in a row: the on-curve point between them is implied.
        const implied = mid(control, point);
        commands.push({
          type: 'Q',
          cx: control.x,
          cy: control.y,
          x: implied.x,
          y: implied.y,
        });
        control = point;
      } else {
        control = point;
      }
    }

    // Close back onto the start, through a pending control if there is one.
    if (control) {
      commands.push({
        type: 'Q',
        cx: control.x,
        cy: control.y,
        x: start.x,
        y: start.y,
      });
    }
    commands.push({ type: 'Z' });
  }

  return commands;
}

/** Parse a static TrueType font into the few things a logo needs. */
export function parseFont(buffer) {
  const tables = readTableDirectory(buffer);
  for (const required of [
    'head',
    'maxp',
    'hhea',
    'hmtx',
    'cmap',
    'loca',
    'glyf',
  ]) {
    if (!tables[required])
      throw new Error(`font is missing the ${required} table`);
  }
  if (tables['CFF '])
    throw new Error('CFF/PostScript outlines are not supported');

  const unitsPerEm = buffer.readUInt16BE(tables.head.offset + 18);
  const indexToLocFormat = buffer.readInt16BE(tables.head.offset + 50);
  const numGlyphs = buffer.readUInt16BE(tables.maxp.offset + 4);
  const numberOfHMetrics = buffer.readUInt16BE(tables.hhea.offset + 34);

  const locaOffset = (index) =>
    indexToLocFormat === 0
      ? buffer.readUInt16BE(tables.loca.offset + index * 2) * 2
      : buffer.readUInt32BE(tables.loca.offset + index * 4);

  const cmap = readCmap(buffer, tables.cmap.offset);

  const advanceOf = (gid) => {
    // Past numberOfHMetrics every glyph shares the last advance — monospaced
    // tail of the table, not a lookup failure.
    const index = Math.min(gid, numberOfHMetrics - 1);
    return buffer.readUInt16BE(tables.hmtx.offset + index * 4);
  };

  return {
    unitsPerEm,
    numGlyphs,
    glyphIdFor(character) {
      const gid = cmap.get(character.codePointAt(0));
      if (gid === undefined) {
        throw new Error(`font has no glyph for ${JSON.stringify(character)}`);
      }
      return gid;
    },
    advanceFor(character) {
      return advanceOf(this.glyphIdFor(character));
    },
    /** Drawing commands in font units, y UP. */
    outlineFor(character) {
      const gid = this.glyphIdFor(character);
      return contoursToCommands(
        readGlyph(
          buffer,
          tables.glyf.offset,
          locaOffset(gid),
          locaOffset(gid + 1),
        ),
      );
    },
  };
}

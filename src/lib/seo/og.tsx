import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { site } from '@/config/site';

/**
 * The shared Open Graph card.
 *
 * 1200×630, generated at build time with `next/og`, using the design tokens and
 * the brand faces. **No photography** (docs/SEO.md §1): a stock image in a
 * share card reads as a stock business, and the launch photography is
 * explicitly not of these premises.
 *
 * WHY THERE ARE TTF COPIES OF THE FONTS. `next/og` renders through satori,
 * which reads TTF, OTF and WOFF — **not WOFF2**. The four faces the site serves
 * are all WOFF2, so two static TTFs live in `src/fonts/og/`, read at build time
 * and never sent to a browser. They are held to the same Turkish glyph gate as
 * the shipped fonts (`npm run fonts`), because a share card that renders
 * "Kalıcı Makyaj" with a substituted ı is the most public place a missing
 * glyph can appear.
 *
 * Colours are the palette primitives from `theme.css`. satori cannot read CSS
 * custom properties, so they are literals here — and a unit test asserts they
 * still match the stylesheet.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const PALETTE = {
  cream: '#faf4ec',
  champagneLight: '#efe2c6',
  roseBeige: '#dfc9bb',
  ink: '#241511',
  cocoa: '#55372f',
  rosewood: '#8a5d55',
} as const;

function fontFile(name: string): Buffer {
  return readFileSync(join(process.cwd(), 'src', 'fonts', 'og', name));
}

/**
 * Read once per build rather than per image. Twenty service cards and twelve
 * post cards would otherwise re-read the same 166 KB thirty-two times.
 */
let cachedFonts: { display: Buffer; sans: Buffer } | null = null;
function fonts() {
  cachedFonts ??= {
    display: fontFile('fraunces-og.ttf'),
    sans: fontFile('manrope-og.ttf'),
  };
  return cachedFonts;
}

export function ogImage({
  eyebrow,
  title,
  meta,
}: {
  /** Small line above the title — the section or category. */
  eyebrow: string;
  title: string;
  /** Small line under the rule — the district, or the reading time. */
  meta?: string;
}): ImageResponse {
  const { display, sans } = fonts();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: PALETTE.cream,
        /*
         * The aurora, flattened: two soft washes rather than a photograph.
         * Both stops are WARM and tight, so cream stays dominant. Wider stops
         * with `nude` produced a card that read grey — the same "reads beige"
         * failure the M7 panel review found, in the one image that appears
         * outside the site's own stylesheet.
         */
        backgroundImage: `radial-gradient(at 88% 8%, ${PALETTE.champagneLight} 0px, transparent 42%), radial-gradient(at 6% 104%, ${PALETTE.roseBeige} 0px, transparent 40%)`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'Manrope',
            fontSize: 24,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: PALETTE.rosewood,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: 'Fraunces',
            fontSize: title.length > 42 ? 68 : 84,
            lineHeight: 1.08,
            letterSpacing: -1.5,
            color: PALETTE.ink,
            // satori has no text-wrap balance; a hard cap keeps a long
            // service name from pushing the meta line off the card.
            maxWidth: 960,
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            width: 120,
            height: 2,
            backgroundColor: PALETTE.rosewood,
            marginBottom: 28,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: 34,
              color: PALETTE.cocoa,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              fontFamily: 'Manrope',
              fontSize: 24,
              color: PALETTE.cocoa,
            }}
          >
            {meta ?? `${site.address.region}, ${site.address.locality}`}
          </div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Fraunces', data: display, style: 'normal', weight: 400 },
        { name: 'Manrope', data: sans, style: 'normal', weight: 500 },
      ],
    },
  );
}

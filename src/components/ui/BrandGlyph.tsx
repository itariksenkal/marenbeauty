import { cn } from '@/lib/cn';

/**
 * Platform glyphs for the footer's follow row.
 *
 * ⚠️ THIS IS AN EXCEPTION TO `CLAUDE.md` §2, TAKEN BY THE OWNER ON 2026-08-07.
 * That section pins Lucide as the only icon set, and `SocialLinks` used to
 * explain at length why the row was words rather than logos: Lucide has no
 * TikTok or WhatsApp glyph and has been retiring brand marks, so an icon row
 * meant either a second icon set or hand-drawn trademarks. The owner asked for
 * the logos. Recorded in `docs/OPEN-QUESTIONS.md` G32.
 *
 * These are **simplified monochrome glyphs, not the official trademarks.** They
 * are drawn here rather than pulled from a brand-icon package so nothing enters
 * the dependency tree and no licence question opens; using a platform's mark to
 * link to your own profile on it is ordinary nominative use, but that is a
 * reason to keep them plain and recognisable rather than to reproduce brand
 * artwork exactly.
 *
 * One flat `currentColor` each, on a 24×24 grid, so they take the colour of the
 * text around them and invert with it.
 */

const GLYPHS: Readonly<Record<string, { paths: readonly string[] }>> = {
  instagram: {
    paths: [
      // Rounded square, lens, and the corner dot.
      'M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9a4.75 4.75 0 0 1-4.75 4.75h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Zm0 1.5A3.25 3.25 0 0 0 4.25 7.5v9a3.25 3.25 0 0 0 3.25 3.25h9a3.25 3.25 0 0 0 3.25-3.25v-9a3.25 3.25 0 0 0-3.25-3.25Z',
      'M12 7.25A4.75 4.75 0 1 1 7.25 12 4.76 4.76 0 0 1 12 7.25Zm0 1.5A3.25 3.25 0 1 0 15.25 12 3.25 3.25 0 0 0 12 8.75Z',
      'M17.4 5.5a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z',
    ],
  },
  facebook: {
    paths: [
      // The f, cut from a disc.
      'M12 2.75a9.25 9.25 0 0 0-1.45 18.39v-6.5H8.2v-2.64h2.35V9.9c0-2.32 1.38-3.6 3.5-3.6a14 14 0 0 1 2.07.18v2.28h-1.17c-1.15 0-1.5.71-1.5 1.44v1.8h2.56l-.41 2.64h-2.15v6.5A9.25 9.25 0 0 0 12 2.75Z',
    ],
  },
  x: {
    paths: [
      // Two crossed strokes with the clipped corners the mark is built from.
      'M17.9 3h3.3l-7.2 8.23L22.5 21h-6.63l-5.2-6.8L4.72 21H1.4l7.7-8.8L1.5 3h6.8l4.7 6.21ZM16.74 19.05h1.83L7.34 4.85H5.38Z',
    ],
  },
  tiktok: {
    paths: [
      // The note: a stem with a hooked top and the round tail at the foot.
      'M16.6 2h-3.05v13.3a2.62 2.62 0 1 1-2.62-2.62c.2 0 .4.02.6.07V9.63a5.72 5.72 0 1 0 5.07 5.67V8.9a6.6 6.6 0 0 0 3.9 1.26V7.1a3.7 3.7 0 0 1-3.9-3.6V2Z',
    ],
  },
  whatsapp: {
    paths: [
      // Speech bubble with the tail at lower-left, and the handset inside.
      'M12.04 2.75a9.2 9.2 0 0 0-7.86 13.97l-1.3 4.75 4.87-1.28a9.2 9.2 0 1 0 4.29-17.44Zm0 1.6a7.6 7.6 0 1 1-3.86 14.15l-.28-.16-2.89.76.77-2.82-.18-.29A7.6 7.6 0 0 1 12.04 4.35Z',
      'M9.2 7.6c-.2-.45-.4-.46-.58-.47h-.5a.95.95 0 0 0-.69.32 2.9 2.9 0 0 0-.9 2.15 5.03 5.03 0 0 0 1.06 2.67 11.4 11.4 0 0 0 4.38 3.85c2.17.85 2.17.57 2.56.53a2.34 2.34 0 0 0 1.56-1.1 1.93 1.93 0 0 0 .13-1.1c-.06-.1-.2-.16-.42-.27s-1.3-.64-1.5-.71-.35-.11-.5.11-.57.71-.7.86-.26.16-.48.05a6.2 6.2 0 0 1-1.83-1.13 6.9 6.9 0 0 1-1.27-1.58c-.13-.22 0-.35.1-.46l.32-.38a1.46 1.46 0 0 0 .22-.36.4.4 0 0 0-.02-.38c-.05-.11-.47-1.18-.66-1.62Z',
    ],
  },
};

export function BrandGlyph({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const glyph = GLYPHS[channel];
  // A channel with no glyph renders nothing rather than a placeholder box —
  // the link's text label is already there and still says where it goes.
  if (!glyph) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5 shrink-0', className)}
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}

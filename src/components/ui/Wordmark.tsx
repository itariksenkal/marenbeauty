import { logoTreatments, type LogoLockup } from '@/config/logo';
import { site } from '@/config/site';
import { cn } from '@/lib/cn';

/**
 * The logo, inline.
 *
 * INLINE RATHER THAN `<img src="/brand/horizontal.svg">`, and that is the whole
 * reason this component exists: the marks are drawn in `currentColor` so one
 * file works on ivory and on espresso, and an `<img>` cannot inherit colour —
 * it would render black. Inlining also costs no extra request.
 *
 * The path data comes from `src/config/logo.ts`, which is generated from the
 * same source as `public/brand/**` (`node scripts/build-logo.mjs`), so the file
 * an owner downloads and the mark the site draws cannot drift.
 *
 * Treatment chosen by the owner on 2026-08-07: **serif**
 * (docs/OPEN-QUESTIONS.md G31).
 */
const TREATMENT = 'serif';

export function Wordmark({
  lockup = 'horizontal',
  className,
}: {
  lockup?: 'horizontal' | 'stacked' | 'monogram';
  className?: string;
}) {
  // Typed as the interface, not the generated literal: `as const` narrows
  // `parts` so hard that the optional `rule` reads as absent.
  const mark: LogoLockup = logoTreatments[TREATMENT].lockups[lockup];
  const [, , width, height] = mark.viewBox.split(' ').map(Number);

  /*
   * A sized WRAPPER, with the svg filling it — not a height class on the svg.
   *
   * `width: auto` on an `<svg>` resolves to 100% of the containing block, not
   * to the viewBox ratio, so a height utility alone does not constrain it: the
   * mark rendered at full container width and swallowed the first screen.
   * Giving the wrapper the height and the svg `h-full w-auto` makes the
   * aspect ratio do the work.
   */
  return (
    <span
      className={cn('block', className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={mark.viewBox}
        role="img"
        aria-label={site.name}
        className="block h-full w-full"
      >
        {mark.parts.map((part, index) =>
          part.mode === 'fill' ? (
            <path
              key={index}
              d={part.d}
              fill="currentColor"
              fillRule={part.rule}
            />
          ) : (
            <path
              key={index}
              d={part.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={part.width}
              strokeLinecap={part.cap as 'round' | 'butt'}
              strokeLinejoin={part.join as 'round' | 'miter'}
            />
          ),
        )}
      </svg>
    </span>
  );
}

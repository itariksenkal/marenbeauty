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

  return (
    <svg
      viewBox={mark.viewBox}
      role="img"
      aria-label={site.name}
      // Height-driven: the header gives it a height and the width follows, so
      // the lockup never squashes at a narrow viewport.
      style={{ aspectRatio: `${width} / ${height}` }}
      className={cn('block h-auto w-auto', className)}
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
  );
}

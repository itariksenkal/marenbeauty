import { experience } from '@/config/experience';
import { cn } from '@/lib/cn';

/**
 * The visit sequence as a plain, static list.
 *
 * A Server Component with no motion of its own. It exists so the same four
 * steps can appear pinned on the home page and unpinned on `/hakkimizda`
 * without either copy of the markup drifting from the other — and so the
 * pinned wrapper stays the only thing that knows about scroll.
 *
 * Renders nothing when there are no steps. That is still how a fact we do not
 * have is expressed (docs/OPEN-QUESTIONS.md C11).
 *
 * ── WHY NO TEXT IS DIMMED ────────────────────────────────────────────────────
 *
 * The first version faded inactive steps to `opacity-40`. axe measured the
 * result at **1.73:1 to 2.49:1** — text far below AA, on three of the four
 * steps, for as long as the sequence was in view. Nothing about it being
 * temporary makes it readable.
 *
 * Raising the opacity does not fix it either: at 90% over the aurora's worst
 * case the text lands at 4.50:1, which is AA by a hundredth and moves the
 * moment a background stop changes.
 *
 * So the emphasis moved off the text entirely. Every step is at full contrast,
 * always; the active one is marked by a **rule that scales in** beneath its
 * number — a decorative element, animating `transform` only. That also
 * satisfies `CLAUDE.md` §16: nothing here is conveyed by animation alone, and
 * a reader who never scrolls loses nothing.
 */
export function ExperienceSteps({
  className,
  activeIndex,
}: {
  className?: string;
  /**
   * Which step the pinned sequence is currently on. Undefined — the static
   * case — means no step is marked, which is the correct composition when
   * nothing is animating.
   */
  activeIndex?: number;
}) {
  if (experience.steps.length === 0) return null;

  return (
    <ol className={cn('grid gap-10 sm:grid-cols-2', className)}>
      {experience.steps.map((step, index) => {
        const active = activeIndex === index;

        return (
          <li
            key={step.id}
            data-step={step.id}
            data-active={active || undefined}
          >
            <p
              aria-hidden="true"
              className="font-display text-2xl tracking-display text-text-secondary"
            >
              {String(index + 1).padStart(2, '0')}
            </p>

            {/*
              The only thing that moves. `transform` on a decorative rule —
              never opacity on text, and never a layout property, so the list
              cannot reflow as the sequence advances (CLAUDE.md §13).
            */}
            <span
              aria-hidden="true"
              className={cn(
                'duration-base mt-2 block h-px w-16 origin-left bg-accent-solid transition-transform ease-standard',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
            />

            <h3 className="mt-4 font-display text-xl tracking-display text-text-primary">
              {step.title}
            </h3>
            <p className="mt-3 max-w-lead text-text-secondary">{step.body}</p>
          </li>
        );
      })}
    </ol>
  );
}

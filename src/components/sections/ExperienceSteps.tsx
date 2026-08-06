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
 */
export function ExperienceSteps({
  className,
  activeIndex,
}: {
  className?: string;
  /**
   * Which step the pinned sequence is currently on. Undefined — the static
   * case — means every step reads at full strength, which is the correct
   * composition when nothing is animating.
   */
  activeIndex?: number;
}) {
  if (experience.steps.length === 0) return null;

  return (
    <ol className={cn('grid gap-10 sm:grid-cols-2', className)}>
      {experience.steps.map((step, index) => {
        const dimmed = activeIndex !== undefined && index !== activeIndex;

        return (
          <li
            key={step.id}
            data-step={step.id}
            data-active={activeIndex === index ? '' : undefined}
            className={cn(
              // Only opacity — no layout property is touched, so the list
              // never reflows as the sequence advances (CLAUDE.md §13).
              'duration-slow transition-opacity ease-standard',
              dimmed && 'opacity-40',
            )}
          >
            <p
              aria-hidden="true"
              className="font-display text-2xl tracking-display text-text-accent"
            >
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-3 font-display text-xl tracking-display text-text-primary">
              {step.title}
            </h3>
            <p className="mt-3 max-w-lead text-text-secondary">{step.body}</p>
          </li>
        );
      })}
    </ol>
  );
}

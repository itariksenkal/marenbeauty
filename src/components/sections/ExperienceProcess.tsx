'use client';

import { Container } from '@/components/layout/Container';
import { PinnedSequence } from '@/components/motion/PinnedSequence';
import { experience } from '@/config/experience';

/**
 * The second — and last — pinned section on the site (docs/MOTION.md §2.6).
 *
 * Renders NOTHING while `experience.steps` is empty, which it is: every step
 * would be a claim about how the centre operates, and none of that is
 * confirmed (docs/OPEN-QUESTIONS.md C11).
 *
 * That is the same pattern as `testimonials` and `channelHref` — a fact we do
 * not have renders as absence, never as a placeholder that reads like a fact.
 * Adding two steps makes the section appear, pinned, with no other change.
 */
export function ExperienceProcess() {
  if (experience.steps.length === 0) return null;

  return (
    <PinnedSequence distance="220svh" mobileDistance="150svh">
      <div className="flex h-full items-center">
        <Container>
          <ol className="space-y-10">
            {experience.steps.map((step, index) => (
              <li key={step.id}>
                <p className="text-xs tracking-eyebrow text-text-accent uppercase">
                  {index + 1}
                </p>
                <h3 className="mt-2 font-display text-3xl tracking-display text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-lead text-text-secondary">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </div>
    </PinnedSequence>
  );
}

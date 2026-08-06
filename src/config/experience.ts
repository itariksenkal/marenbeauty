/**
 * What a visit is like — the second pinned sequence.
 *
 * ⚠️ EMPTY ON PURPOSE. Every step here would be a claim about how the centre
 * operates: what happens on arrival, in what order, how long it takes. None of
 * that is confirmed, and the owner has not opened yet
 * (docs/OPEN-QUESTIONS.md C11).
 *
 * `ExperienceProcess` renders NOTHING while this is empty — no heading, no
 * skeleton, no "coming soon". The same pattern as `testimonials` and
 * `channelHref`: a fact we do not have renders as absence, not as a
 * placeholder that reads like a fact.
 *
 * Adding two or more steps makes the section appear, pinned, with no other
 * change. A test covers both states.
 */
export type ExperienceStep = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export const experience = {
  steps: [] as readonly ExperienceStep[],
} as const;

/**
 * Home — M0 placeholder.
 *
 * The real page is built at M6 (pinned water sequence) and M7 (services,
 * process, teaser, CTA). Nothing here survives those milestones.
 *
 * Deliberately carries no Turkish copy: user-facing strings live in content/
 * or src/config/, never inline in a component (CLAUDE.md §7). "Maren Beauty"
 * is the brand name, not copy, and moves to src/config/site.ts at M2.
 */
export default function HomePage() {
  return (
    <main id="main">
      <h1>Maren Beauty</h1>
    </main>
  );
}

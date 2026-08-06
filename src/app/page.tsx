import { site } from '@/config/site';

/**
 * Home — placeholder.
 *
 * The real page is built at M6 (pinned water sequence) and M7 (services,
 * process, teaser, CTA). Nothing here survives those milestones.
 *
 * No <main> element here: the root layout owns it, along with `id="main"` and
 * the `tabIndex={-1}` the skip link targets. Rendering another one nested
 * inside produced two landmarks and a duplicate id.
 *
 * Carries no Turkish copy — user-facing strings live in content/ or
 * src/config/, never inline in a component (CLAUDE.md §7).
 */
export default function HomePage() {
  return <h1>{site.name}</h1>;
}

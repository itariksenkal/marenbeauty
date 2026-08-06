import { HeroWater } from '@/components/sections/HeroWater';

/**
 * Home.
 *
 * M6 builds the pinned opening. The services panels, process sequence, blog
 * teaser and contact CTA arrive at M7.
 *
 * No <main> here: the root layout owns it, along with `id="main"` and the
 * `tabIndex={-1}` the skip link targets.
 *
 * No copy here either — every sentence in the opening comes from
 * `src/config/home.ts` (CLAUDE.md §7).
 */
export default function HomePage() {
  return <HeroWater />;
}

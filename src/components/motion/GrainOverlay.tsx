/**
 * Site-wide grain — docs/MOTION.md §3.6.
 *
 * A pre-rendered tile, NOT a live <svg><feTurbulence>: a full-viewport SVG
 * filter re-rasterises on scroll and on any repaint beneath it, which breaks
 * the GPU rule outright. No `mix-blend-mode` either — a full-screen blend
 * layer forces the entire page into one composited group.
 *
 * A Server Component with no behaviour, so it ships zero JavaScript. Styling
 * lives in theme.css as the `grain-layer` utility, including the `static`-tier
 * branch, so the whole thing is CSS.
 */
export function GrainOverlay() {
  return <div aria-hidden="true" className="grain-layer" />;
}

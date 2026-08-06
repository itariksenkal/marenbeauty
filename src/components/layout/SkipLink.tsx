import { chrome, mainContentId } from '@/config/navigation';

/**
 * First focusable element on every page (CLAUDE.md §16).
 *
 * Split deliberately:
 *
 *   POSITION/VISIBILITY — critical CSS, inlined and hoisted into <head>.
 *   APPEARANCE          — ordinary token utilities.
 *
 * Why the split. In dev, Turbopack injects the stylesheet via JS, so for the
 * first few hundred milliseconds no utility class applies. The link is the
 * first element in <body>, so during that window it rendered `position: static`
 * in normal flow — a stray visible link above the header, measured at
 * `y: 8, height: 17`. Production is not affected (render-blocking <link> in
 * <head>), but "invisible only once the stylesheet arrives" is the wrong
 * guarantee for the one control a keyboard user meets first, and it would fail
 * outright if the stylesheet 404'd.
 *
 * Inline critical CSS applies at parse time, so the link is out of flow and out
 * of the viewport from the very first paint.
 *
 * It is parked off-screen rather than hidden: `display: none` or
 * `visibility: hidden` would drop it out of the tab order and defeat the point.
 *
 * `:focus` rather than `:focus-visible` — any means of focusing it should
 * reveal it; a focused link the user cannot see is one they cannot dismiss.
 */
const CRITICAL_CSS = `a[data-skip-link]{position:fixed;top:0;left:0;transform:translateY(-100%)}
a[data-skip-link]:focus{transform:translateY(0)}`;

export function SkipLink() {
  return (
    <>
      <style href="skip-link-critical" precedence="high">
        {CRITICAL_CSS}
      </style>
      <a
        data-skip-link=""
        href={`#${mainContentId}`}
        className="z-overlay rounded-b-md bg-surface-inverse px-4 py-3 text-sm text-text-on-inverse"
      >
        {chrome.skipToContent}
      </a>
    </>
  );
}

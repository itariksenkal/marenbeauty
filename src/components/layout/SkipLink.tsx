import { ui } from '@/config/ui';

/**
 * First focusable element on every page. Visually hidden until focused, then
 * pinned top-left over everything (CLAUDE.md §16).
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-overlay focus-visible:rounded-md focus-visible:bg-surface-inverse focus-visible:px-4 focus-visible:py-3 focus-visible:text-sm focus-visible:text-text-on-inverse"
    >
      {ui.skipToContent}
    </a>
  );
}

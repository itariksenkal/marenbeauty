'use client';

import { useEffect } from 'react';

/**
 * Publishes `data-scrolled` on `<html>` once the page has left the top.
 *
 * NO SCROLL LISTENER. A sentinel element sits at the top of the document and an
 * `IntersectionObserver` reports when it leaves the viewport. That is the same
 * information, delivered by the compositor instead of by a handler that runs on
 * every scroll frame — and it keeps the site's scroll-listener count at exactly
 * one (the pinned-sequence progress hook), which a unit test pins.
 *
 * The attribute lands on `<html>` rather than on the header so the styling is a
 * plain CSS rule and nothing re-renders as the visitor scrolls.
 */
export function HeaderScrollState() {
  useEffect(() => {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('data-scroll-sentinel', '');
    // 1px tall and at the very top: entirely out of flow, so it cannot add
    // height or shift a single pixel of layout.
    sentinel.style.cssText =
      'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const root = document.documentElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) root.removeAttribute('data-scrolled');
        else root.setAttribute('data-scrolled', '');
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
      root.removeAttribute('data-scrolled');
    };
  }, []);

  return null;
}

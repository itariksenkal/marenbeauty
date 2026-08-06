import type { MetadataRoute } from 'next';

import { routeSeo } from '@/config/seo';
import { site } from '@/config/site';

/**
 * `manifest.webmanifest`.
 *
 * Minimal and honest. `display: 'browser'` rather than `standalone`: this is a
 * website, not an app, and claiming standalone would put a chromeless window
 * around a page whose primary action is a phone call.
 *
 * Colours come from the design tokens' primitive values. They are the two
 * places in the codebase outside `theme.css` where a hex may appear, because a
 * web manifest is JSON and cannot read a CSS custom property — the constants
 * below are asserted against `theme.css` by a unit test so they cannot drift.
 */
export const THEME_COLOR = '#faf4ec'; // --mb-cream, the page surface
export const BACKGROUND_COLOR = '#fefcf9'; // --mb-ivory

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.wordmark,
    description: routeSeo.home.description,
    start_url: '/',
    display: 'browser',
    lang: site.htmlLang,
    dir: 'ltr',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

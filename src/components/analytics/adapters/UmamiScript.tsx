import { env } from '@/config/env';

/**
 * Umami — self-hosted, cookieless.
 *
 * NOT DEPLOYED AT LAUNCH (docs/OPEN-QUESTIONS.md C5). This file is wired and
 * rendered; it simply produces nothing while the flag is off or the two
 * environment variables are unset.
 *
 * It is the one adapter that needs **no consent**: it sets no cookie, stores
 * nothing in the browser and identifies nobody. That is why it was chosen over
 * a cookie-based product — the alternative is a consent banner on every page of
 * a site whose whole tone is the opposite of that.
 *
 * A SERVER COMPONENT emitting a plain `<script async>`, deliberately. There is
 * no state and no consent to read, so a client component would ship JavaScript
 * to do what one tag already does — and the script URL comes from `env` rather
 * than from a literal, so no analytics host is baked into any bundle.
 *
 * `data-do-not-track` and `data-cache` are Umami's own flags: honour DNT, keep
 * no client-side cache.
 */
export function UmamiScript() {
  const scriptUrl = env.UMAMI_SCRIPT_URL;
  const websiteId = env.UMAMI_WEBSITE_ID;
  if (!scriptUrl || !websiteId) return null;

  return (
    <script
      async
      src={scriptUrl}
      data-website-id={websiteId}
      data-do-not-track="true"
      data-cache="false"
    />
  );
}

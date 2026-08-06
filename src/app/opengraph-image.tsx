import { routeSeo } from '@/config/seo';
import { site } from '@/config/site';
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/seo/og';

/**
 * The default share card, used by every route that does not generate its own.
 *
 * `alt` matters: it is the `og:image:alt` a screen reader announces when the
 * link is shared into a timeline, and it is the one piece of OG text that is
 * read rather than seen.
 */
export const alt = `${site.name} — ${site.address.region} ${site.address.locality} güzellik merkezi`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return ogImage({
    eyebrow: 'Güzellik merkezi',
    title: routeSeo.home.title.replace(`${site.name} — `, ''),
  });
}

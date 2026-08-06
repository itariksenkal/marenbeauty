import { serviceGroupLabel } from '@/config/services';
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/seo/og';
import { getAllServiceSlugs, getServiceBySlug } from '@/content-layer';

/** One card per service, generated at build time alongside the page. */
export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ServiceOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) throw new Error(`No service for slug "${slug}".`);

  return ogImage({
    eyebrow: service.eyebrow ?? serviceGroupLabel(service.group),
    title: service.title,
  });
}

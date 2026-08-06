import { images } from '@/config/images';

import { assertIntegrity } from './integrity';
import { parseFrontmatter, readCollection } from './load';
import { postsForIntegrity } from './posts';
import {
  serviceFrontmatterSchema,
  type Service,
  type ServiceGroup,
} from './schemas';

/**
 * Services, read ONCE at module scope (docs/ARCHITECTURE.md §4).
 *
 * Everything happens here at import time: read, validate, cross-check. Any
 * problem throws during static generation, so a broken reference fails the
 * build rather than becoming a 404 in production.
 */
function load(): Service[] {
  return readCollection('services').map((doc) => ({
    ...parseFrontmatter(serviceFrontmatterSchema, doc),
    slug: doc.slug,
    body: doc.body,
    file: doc.file,
    modifiedAt: doc.modifiedAt,
  }));
}

const services: readonly Service[] = load();

// Integrity runs once, over both collections together — a service's related
// links and a post's service reference are the same graph.
assertIntegrity({
  services,
  posts: postsForIntegrity,
  imageIds: images.map((image) => image.id),
});

const bySlug = new Map(services.map((service) => [service.slug, service]));

/** Sorted by group, then by the `order` field within each group. */
export function getAllServices(): readonly Service[] {
  const groupIndex = (group: ServiceGroup) => GROUP_ORDER.indexOf(group);
  return [...services].sort(
    (a, b) => groupIndex(a.group) - groupIndex(b.group) || a.order - b.order,
  );
}

const GROUP_ORDER: readonly ServiceGroup[] = [
  'cilt-bakimi',
  'epilasyon',
  'cilt-yenileme',
  'kas-kirpik',
  'ozel-paket',
];

export function getServiceBySlug(slug: string): Service | null {
  return bySlug.get(slug) ?? null;
}

export function getServicesByGroup(group: ServiceGroup): readonly Service[] {
  return getAllServices().filter((service) => service.group === group);
}

export function getAllServiceSlugs(): readonly string[] {
  return getAllServices().map((service) => service.slug);
}

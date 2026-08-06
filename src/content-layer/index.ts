/**
 * Public API of the content layer (docs/ARCHITECTURE.md §4).
 *
 * Nothing outside this directory may read from `content/` (CLAUDE.md §5) —
 * a unit test enforces it. Import from here.
 */
import { getAllPostSlugs } from './posts';
import { getAllServiceSlugs } from './services';

export {
  getAllServices,
  getServiceBySlug,
  getServicesByGroup,
  getAllServiceSlugs,
} from './services';

export {
  getAllPosts,
  getPostBySlug,
  getPostsByService,
  getPostsByCategory,
  getRelatedPosts,
  getAllPostSlugs,
  type PostQuery,
} from './posts';

export { compileMdxBody } from './mdx';

export {
  BLOG_CATEGORIES,
  SERVICE_GROUPS,
  POST_INTENTS,
  type BlogCategory,
  type Post,
  type Service,
  type ServiceGroup,
} from './schemas';

/** Slugs for `generateStaticParams`. */
export function getAllSlugs(kind: 'services' | 'blog'): readonly string[] {
  return kind === 'services' ? getAllServiceSlugs() : getAllPostSlugs();
}

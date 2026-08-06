import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { images } from '@/config/images';
import { compileMdxBody } from '@/content-layer/mdx';
import { checkIntegrity, assertIntegrity } from '@/content-layer/integrity';
import { parseFrontmatter, type RawDoc } from '@/content-layer/load';
import {
  postFrontmatterSchema,
  serviceFrontmatterSchema,
  type Post,
  type Service,
} from '@/content-layer/schemas';
import {
  getAllPosts,
  getAllServices,
  getAllSlugs,
  getPostBySlug,
  getPostsByCategory,
  getPostsByService,
  getRelatedPosts,
  getServiceBySlug,
  getServicesByGroup,
} from '@/content-layer';
import { readingMinutes } from '@/lib/reading-time';

/* ── Factories ─────────────────────────────────────────────────────────────── */

const service = (over: Partial<Service> = {}): Service => ({
  slug: 'ornek',
  title: 'Örnek',
  eyebrow: null,
  summary: 'x'.repeat(80),
  group: 'cilt-bakimi',
  order: 1,
  heroImageId: 'img',
  durationLabel: null,
  suitableFor: [],
  steps: [
    { title: 'a', body: 'a' },
    { title: 'b', body: 'b' },
  ],
  aftercare: [],
  faq: [],
  relatedServices: [],
  seo: { title: null, description: null },
  body: '',
  file: 'content/services/ornek.mdx',
  modifiedAt: new Date('2026-08-06T00:00:00Z'),
  ...over,
});

const post = (over: Partial<Post> = {}): Post => ({
  slug: 'ornek-yazi',
  title: 'Yeterince uzun bir başlık',
  summary: 'y'.repeat(100),
  publishedAt: '2026-08-06',
  updatedAt: null,
  category: 'cilt-bakimi-rehberi',
  tags: [],
  service: 'ornek',
  author: 'PENDING',
  heroImageId: 'img',
  keyword: 'k',
  intent: 'informational',
  draft: false,
  keyPoints: [],
  faq: [],
  seo: { title: null, description: null },
  body: '',
  file: 'content/blog/ornek-yazi.mdx',
  modifiedAt: new Date('2026-08-06T00:00:00Z'),
  readingMinutes: 1,
  ...over,
});

const run = (over: {
  services?: Service[];
  posts?: Post[];
  imageIds?: string[];
}) =>
  checkIntegrity({
    services: over.services ?? [],
    posts: over.posts ?? [],
    imageIds: over.imageIds ?? ['img'],
  });

const checks = (issues: ReturnType<typeof checkIntegrity>) =>
  issues.map((i) => i.check);

/* ── §3.4 — the seven integrity checks, each proven by a failing fixture ───── */

describe('integrity check 1 — relatedServices must resolve', () => {
  it('fails on a dangling reference', () => {
    const issues = run({
      services: [service({ relatedServices: ['yok-boyle-bir-sey'] })],
    });
    expect(checks(issues)).toContain('related-service-missing');
  });

  it('fails on a self-reference', () => {
    const issues = run({
      services: [service({ slug: 'ornek', relatedServices: ['ornek'] })],
    });
    expect(checks(issues)).toContain('related-service-missing');
  });

  it('passes when the reference resolves', () => {
    const issues = run({
      services: [
        service({ slug: 'bir', title: 'Bir', relatedServices: ['iki'] }),
        service({ slug: 'iki', title: 'İki' }),
      ],
    });
    expect(checks(issues)).not.toContain('related-service-missing');
  });
});

describe('integrity check 2 — a post service must resolve', () => {
  it('fails when the service does not exist', () => {
    const issues = run({ posts: [post({ service: 'yok' })] });
    expect(checks(issues)).toContain('post-service-missing');
  });

  it('passes when it does', () => {
    const issues = run({ services: [service()], posts: [post()] });
    expect(checks(issues)).not.toContain('post-service-missing');
  });
});

describe('integrity check 3 — heroImageId must be in the manifest', () => {
  it('fails for a service', () => {
    const issues = run({
      services: [service({ heroImageId: 'kayip' })],
      imageIds: ['img'],
    });
    expect(checks(issues)).toContain('image-missing');
  });

  it('fails for a post', () => {
    const issues = run({
      services: [service()],
      posts: [post({ heroImageId: 'kayip' })],
    });
    expect(checks(issues)).toContain('image-missing');
  });
});

describe('integrity check 4 — slugs must be ASCII kebab-case', () => {
  it.each(['cilt-bakımı', 'Cilt-Bakimi', 'cilt_bakimi', '-ornek', 'ornek-'])(
    'fails on %s',
    (slug) => {
      const issues = run({ services: [service({ slug })] });
      expect(checks(issues)).toContain('invalid-slug');
    },
  );

  it('passes on a folded slug', () => {
    const issues = run({
      services: [service({ slug: 'cilt-bakimi', title: 'Cilt Bakımı' })],
    });
    expect(checks(issues)).not.toContain('invalid-slug');
  });
});

describe('integrity check 5 — service filename must equal slugify(title)', () => {
  it('fails when they disagree', () => {
    const issues = run({
      services: [service({ slug: 'baska-bir-ad', title: 'Cilt Bakımı' })],
    });
    expect(checks(issues)).toContain('slug-title-mismatch');
  });

  it('passes when they agree, with Turkish folding', () => {
    const issues = run({
      services: [
        service({
          slug: 'yaslanma-karsiti-bakim',
          title: 'Yaşlanma Karşıtı Bakım',
        }),
      ],
    });
    expect(checks(issues)).not.toContain('slug-title-mismatch');
  });

  it('does NOT apply to posts, whose slugs are deliberately shorter', () => {
    // docs/CONTENT-PLAN.md §4 plans "Lazer Epilasyon Nedir? Uygulama Nasıl
    // İlerler" at /blog/lazer-epilasyon-nedir. Applying the service rule here
    // would reject every planned post.
    const issues = run({
      services: [service()],
      posts: [
        post({
          slug: 'lazer-epilasyon-nedir',
          title: 'Lazer Epilasyon Nedir? Uygulama Nasıl İlerler',
          service: 'ornek',
        }),
      ],
    });
    expect(checks(issues)).not.toContain('slug-title-mismatch');
  });
});

describe('integrity check 6 — no duplicate slugs', () => {
  it('fails on two posts sharing a slug', () => {
    const issues = run({
      services: [service()],
      posts: [post({ slug: 'ayni' }), post({ slug: 'ayni' })],
    });
    expect(checks(issues)).toContain('duplicate-slug');
  });

  it('fails on two services sharing a slug', () => {
    const issues = run({
      services: [
        service({ slug: 'ayni', title: 'Ayni' }),
        service({ slug: 'ayni', title: 'Ayni' }),
      ],
    });
    expect(checks(issues)).toContain('duplicate-slug');
  });
});

describe('integrity check 7 — nothing published may link to a draft', () => {
  it('fails when a published post links to a draft', () => {
    const issues = run({
      services: [service()],
      posts: [
        post({ slug: 'taslak', draft: true }),
        post({ slug: 'yayinda', body: 'Bakınız [şu yazı](/blog/taslak).' }),
      ],
    });
    expect(checks(issues)).toContain('draft-referenced');
  });

  it('fails when a service links to a draft', () => {
    const issues = run({
      services: [service({ body: 'Detay: /blog/taslak' })],
      posts: [post({ slug: 'taslak', draft: true })],
    });
    expect(checks(issues)).toContain('draft-referenced');
  });

  it('allows a link to a published post', () => {
    const issues = run({
      services: [service()],
      posts: [
        post({ slug: 'yayinda-iki' }),
        post({ slug: 'yayinda', body: '[şu](/blog/yayinda-iki)' }),
      ],
    });
    expect(checks(issues)).not.toContain('draft-referenced');
  });
});

describe('integrity check 8 — a /hizmetler link in a body must resolve', () => {
  // Added at M8: from here on the prose itself carries contextual links
  // (docs/CONTENT-PLAN.md §5), which are as easy to break by renaming a file as
  // `relatedServices` is — and just as certain a 404.
  it('fails when a service body links to a service that does not exist', () => {
    const issues = run({
      services: [service({ body: 'Bakınız [şu](/hizmetler/yok-boyle).' })],
    });
    expect(checks(issues)).toContain('internal-link-missing');
  });

  it('fails when a POST body links to a missing service', () => {
    const issues = run({
      services: [service()],
      posts: [post({ body: 'Detay: /hizmetler/silinmis-hizmet' })],
    });
    expect(checks(issues)).toContain('internal-link-missing');
  });

  it('passes when the link resolves', () => {
    const issues = run({
      services: [
        service({ slug: 'bir', title: 'Bir', body: '[iki](/hizmetler/iki)' }),
        service({ slug: 'iki', title: 'İki' }),
      ],
    });
    expect(checks(issues)).not.toContain('internal-link-missing');
  });

  it('also covers /blog links, widened at M10', () => {
    // Rule 7 catches a link to a DRAFT post. A link to a slug that does not
    // exist at all was, until the twelve posts started cross-linking each
    // other, nobody's job.
    const dangling = run({
      services: [service({ body: '[yazı](/blog/boyle-bir-yazi-yok)' })],
    });
    expect(checks(dangling)).toContain('internal-link-missing');

    const resolves = run({
      services: [service({ body: '[yazı](/blog/ornek-yazi)' })],
      posts: [post({ slug: 'ornek-yazi', service: 'ornek' })],
    });
    expect(checks(resolves)).not.toContain('internal-link-missing');
  });
});

describe('assertIntegrity', () => {
  it('reports every problem at once, not just the first', () => {
    let message = '';
    try {
      assertIntegrity({
        services: [service({ slug: 'Bad_Slug', relatedServices: ['yok'] })],
        posts: [post({ service: 'yok-hizmet', heroImageId: 'yok-gorsel' })],
        imageIds: [],
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('invalid-slug');
    expect(message).toContain('related-service-missing');
    expect(message).toContain('post-service-missing');
    expect(message).toContain('image-missing');
  });

  it('does not throw on a clean set', () => {
    expect(() =>
      assertIntegrity({
        services: [service()],
        posts: [post()],
        imageIds: ['img'],
      }),
    ).not.toThrow();
  });
});

/* ── Frontmatter validation ────────────────────────────────────────────────── */

const doc = (data: unknown): RawDoc => ({
  slug: 'x',
  file: 'content/services/x.mdx',
  data,
  body: '',
  modifiedAt: new Date('2026-08-06T00:00:00Z'),
});

describe('frontmatter validation', () => {
  it('names the file and the offending field', () => {
    let message = '';
    try {
      parseFrontmatter(serviceFrontmatterSchema, doc({ title: 'A' }));
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('content/services/x.mdx');
    expect(message).toContain('summary');
    expect(message).toContain('group');
  });

  it('rejects unknown keys, so a typo cannot become an empty field', () => {
    const valid = {
      title: 'Örnek',
      eyebrow: null,
      summary: 'x'.repeat(80),
      group: 'cilt-bakimi',
      order: 1,
      heroImageId: 'img',
      durationLabel: null,
      suitableFor: [],
      steps: [
        { title: 'a', body: 'a' },
        { title: 'b', body: 'b' },
      ],
      aftercare: [],
      faq: [],
      relatedServices: [],
      seo: { title: null, description: null },
    };
    expect(() =>
      parseFrontmatter(serviceFrontmatterSchema, doc(valid)),
    ).not.toThrow();
    expect(() =>
      parseFrontmatter(
        serviceFrontmatterSchema,
        doc({ ...valid, sumary: 'typo' }),
      ),
    ).toThrow(/sumary/);
  });

  it('rejects an authored readingMinutes — it is computed, never written', () => {
    const valid = {
      title: 'Yeterince uzun bir başlık',
      summary: 'y'.repeat(100),
      publishedAt: '2026-08-06',
      updatedAt: null,
      category: 'cilt-bakimi-rehberi',
      tags: [],
      service: 'ornek',
      author: 'PENDING',
      heroImageId: 'img',
      keyword: 'k',
      intent: 'informational',
      keyPoints: [],
      faq: [],
      seo: { title: null, description: null },
    };
    expect(() =>
      parseFrontmatter(postFrontmatterSchema, doc(valid)),
    ).not.toThrow();
    expect(() =>
      parseFrontmatter(
        postFrontmatterSchema,
        doc({ ...valid, readingMinutes: 5 }),
      ),
    ).toThrow(/readingMinutes/);
  });

  it('rejects a fabricated author byline at the type level', () => {
    const withAuthor = (author: unknown) => ({
      title: 'Yeterince uzun bir başlık',
      summary: 'y'.repeat(100),
      publishedAt: '2026-08-06',
      updatedAt: null,
      category: 'cilt-bakimi-rehberi',
      tags: [],
      service: 'ornek',
      author,
      heroImageId: 'img',
      keyword: 'k',
      intent: 'informational',
      keyPoints: [],
      faq: [],
      seo: { title: null, description: null },
    });
    expect(() =>
      parseFrontmatter(postFrontmatterSchema, doc(withAuthor('Ayşe Yılmaz'))),
    ).toThrow(/author/);
    expect(() =>
      parseFrontmatter(postFrontmatterSchema, doc(withAuthor('PENDING'))),
    ).not.toThrow();
  });

  it('accepts an unquoted YAML date, which parses as a Date object', () => {
    // js-yaml turns `2026-08-06` into a Date. The loader normalises it back to
    // an ISO string so authors never have to remember quotes.
    expect(() =>
      parseFrontmatter(
        postFrontmatterSchema,
        doc({
          title: 'Yeterince uzun bir başlık',
          summary: 'y'.repeat(100),
          publishedAt: '2026-08-06',
          updatedAt: null,
          category: 'cilt-bakimi-rehberi',
          tags: [],
          service: 'ornek',
          author: 'PENDING',
          heroImageId: 'img',
          keyword: 'k',
          intent: 'informational',
          keyPoints: [],
          faq: [],
          seo: { title: null, description: null },
        }),
      ),
    ).not.toThrow();
  });
});

/* ── Reading time ──────────────────────────────────────────────────────────── */

describe('readingMinutes', () => {
  it('is computed from the body', () => {
    expect(readingMinutes('kelime '.repeat(400))).toBe(2);
    expect(readingMinutes('kelime '.repeat(1000))).toBe(5);
  });

  it('never returns zero', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('tek')).toBe(1);
  });

  it('ignores code, tags and link targets', () => {
    const noisy = '```\n'.concat(
      'kod '.repeat(500),
      '\n```\n',
      'kelime '.repeat(200),
    );
    expect(readingMinutes(noisy)).toBe(1);
  });
});

/* ── MDX compilation ───────────────────────────────────────────────────────── */

describe('MDX compilation', () => {
  it('compiles a body to a component', async () => {
    const Content = await compileMdxBody('# Başlık\n\nMetin.', 'test.mdx');
    expect(typeof Content).toBe('function');
  });

  it('names the file when compilation fails', async () => {
    await expect(
      compileMdxBody('<Unclosed>', 'content/blog/kirik.mdx'),
    ).rejects.toThrow(/content\/blog\/kirik\.mdx/);
  });

  it('does not use next-mdx-remote — MPL-2.0, outside the licence policy', () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps)).not.toContain('next-mdx-remote');
  });
});

/* ── Query API over the real fixtures ──────────────────────────────────────── */

describe('query API', () => {
  // The M4 fixtures (ornek-hizmet, ornek-yazi) were deleted at M8 as scheduled.
  // These now run against the real content: 20 services, and a blog collection
  // that is legitimately empty until M10.
  it('loads all 20 services', () => {
    expect(getAllServices()).toHaveLength(20);
    expect(getServiceBySlug('cilt-bakimi')).not.toBeNull();
    expect(getServiceBySlug('yok-boyle')).toBeNull();
  });

  it('sorts by group order, then by the order field', () => {
    const groups = getAllServices().map((s) => s.group);
    // Each group appears as one contiguous run, in the configured sequence.
    expect([...new Set(groups)]).toEqual([
      'cilt-bakimi',
      'epilasyon',
      'cilt-yenileme',
      'kas-kirpik',
      'ozel-paket',
    ]);
    const ciltBakimi = getServicesByGroup('cilt-bakimi').map((s) => s.order);
    expect(ciltBakimi).toEqual([...ciltBakimi].sort((a, b) => a - b));
  });

  it('filters by group', () => {
    expect(getServicesByGroup('cilt-bakimi')).toHaveLength(9);
    expect(getServicesByGroup('epilasyon')).toHaveLength(1);
    expect(getServicesByGroup('cilt-yenileme')).toHaveLength(5);
    expect(getServicesByGroup('kas-kirpik')).toHaveLength(4);
    expect(getServicesByGroup('ozel-paket')).toHaveLength(1);
  });

  it('loads Batch 1 — twelve published posts', () => {
    expect(getAllPosts()).toHaveLength(12);
    expect(getPostBySlug('lazer-epilasyon-nedir')).not.toBeNull();
    expect(getPostBySlug('herhangi-bir-yazi')).toBeNull();
    expect(getAllSlugs('blog')).toHaveLength(12);
  });

  it('filters by service and category', () => {
    expect(getPostsByService('cilt-bakimi')).toHaveLength(1);
    expect(getPostsByService('bb-glow')).toEqual([]); // Batch 2
    expect(getPostsByCategory('kas-kirpik-rehberi')).toHaveLength(4);
    expect(getPostsByCategory('epilasyon-rehberi')).toHaveLength(1);
  });

  it('related posts exclude the post itself and prefer the same category', () => {
    const found = getPostBySlug('microblading-nedir')!;
    const related = getRelatedPosts(found, 3);
    expect(related.map((p) => p.slug)).not.toContain(found.slug);
    expect(related.length).toBeGreaterThan(0);
    // Same category ranks above the rest — kaş & kirpik has four posts.
    expect(related[0]!.category).toBe('kas-kirpik-rehberi');
  });

  it('exposes slugs for generateStaticParams', () => {
    expect(getAllSlugs('services')).toHaveLength(20);
    expect(getAllSlugs('services')).toContain('lazer-epilasyon');
  });

  it('excludes drafts by default', () => {
    expect(getAllPosts().every((p) => !p.draft)).toBe(true);
  });

  it('every heroImageId resolves in the manifest', () => {
    const ids = new Set(images.map((i) => i.id));
    for (const s of getAllServices()) expect(ids).toContain(s.heroImageId);
    for (const p of getAllPosts()) expect(ids).toContain(p.heroImageId);
  });

  it('no fixture survives — neither the M4 pair nor the M9 preview', () => {
    expect(getServiceBySlug('ornek-hizmet')).toBeNull();
    expect(getPostBySlug('ornek-yazi')).toBeNull();
    expect(getPostBySlug('sablon-onizleme')).toBeNull();
    expect(images.some((i) => i.id === 'fixture-placeholder')).toBe(false);
  });
});

/* ── Boundary: only the content layer touches content/ ─────────────────────── */

describe('content/ is read only by the content layer', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(full)) files.push(full);
    }
  };
  walk(join(process.cwd(), 'src'));

  it('no module outside src/content-layer references content/', () => {
    const offenders = files
      .filter((f) => !f.replace(/\\/g, '/').includes('src/content-layer/'))
      .filter((f) =>
        /['"`]content\/|\bcontentDir\(|['"`]\.\.\/\.\.\/content/.test(
          readFileSync(f, 'utf8'),
        ),
      );
    expect(offenders.map((f) => f.replace(/\\/g, '/'))).toEqual([]);
  });
});

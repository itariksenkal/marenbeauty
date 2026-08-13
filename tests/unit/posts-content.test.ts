import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import { blogCategories } from '@/config/blog';
import { images } from '@/config/images';
import { COSMETIC_DISCLAIMER } from '@/config/legal';
import {
  getAllPosts,
  getAllServices,
  getPostsByService,
  getRelatedPosts,
  type Post,
} from '@/content-layer';

/**
 * M10 — the published blog: Batch 1's twelve posts and Batch 2's twenty-four.
 *
 * The copy rules are the hard part here and they are checked three ways: the
 * real guard rules run over each file, a numeric-claim sweep looks for the
 * things the guard does not know about (session counts, invented sourcing), and
 * the plan itself is pinned as a literal so a post cannot quietly drift onto a
 * different keyword or service.
 *
 * Batch 2 deliberately gives some services more than one post: a service's
 * explainer, its prep/aftercare piece and a seasonal angle answer three
 * different search intents. That invalidates Batch 1's "one post per service"
 * assertion, which is replaced below by the rule the plan actually wants —
 * every service carries editorial, and none is over-served.
 */

const posts = getAllPosts();
const services = getAllServices();

type PlannedPost = { keyword: string; service: string; category: string };

/** docs/CONTENT-PLAN.md §4, Batch 1 — copied from the plan, not derived. */
const BATCH_1: Readonly<Record<string, PlannedPost>> = {
  'lazer-epilasyon-nedir': {
    keyword: 'lazer epilasyon nedir',
    service: 'lazer-epilasyon',
    category: 'epilasyon-rehberi',
  },
  'cilt-bakimi-nedir': {
    keyword: 'cilt bakımı nedir',
    service: 'cilt-bakimi',
    category: 'cilt-bakimi-rehberi',
  },
  'hydrafacial-nedir': {
    keyword: 'hydrafacial nedir',
    service: 'hydrafacial',
    category: 'cilt-yenileme-rehberi',
  },
  'kimyasal-peeling-nedir': {
    keyword: 'kimyasal peeling nedir',
    service: 'kimyasal-peeling',
    category: 'cilt-yenileme-rehberi',
  },
  'dermapen-nedir': {
    keyword: 'dermapen nedir',
    service: 'dermapen',
    category: 'cilt-yenileme-rehberi',
  },
  'kalici-makyaj-nedir': {
    keyword: 'kalıcı makyaj nedir',
    service: 'kalici-makyaj',
    category: 'kas-kirpik-rehberi',
  },
  'microblading-nedir': {
    keyword: 'microblading nedir',
    service: 'microblading',
    category: 'kas-kirpik-rehberi',
  },
  'akne-egilimli-ciltlerde-bakim': {
    keyword: 'akneli cilt bakımı',
    service: 'akne-bakimi',
    category: 'cilt-ihtiyaclari',
  },
  'leke-gorunumu-nedenler-ve-bakim': {
    keyword: 'cilt lekesi nedenleri',
    service: 'leke-bakimi',
    category: 'cilt-ihtiyaclari',
  },
  'kirpik-lifting-nedir': {
    keyword: 'kirpik lifting nedir',
    service: 'kirpik-lifting',
    category: 'kas-kirpik-rehberi',
  },
  'kas-tasarimi-nedir': {
    keyword: 'kaş tasarımı',
    service: 'kas-tasarimi',
    category: 'kas-kirpik-rehberi',
  },
  'gelin-bakim-takvimi': {
    keyword: 'gelin bakım takvimi',
    service: 'gelin-bakim-paketi',
    category: 'ozel-gun-ve-mevsim',
  },
};

/**
 * Batch 2 — the twenty-four posts of the keyword plan, §5.1.
 *
 * Copied from the plan by hand rather than derived from the files, for the same
 * reason BATCH_1 is: a derived list asserts that the content agrees with
 * itself, which is never false. This one asserts it agrees with the plan.
 */
const BATCH_2: Readonly<Record<string, PlannedPost>> = {
  'bb-glow-nedir': {
    keyword: 'bb glow nedir',
    service: 'bb-glow',
    category: 'cilt-yenileme-rehberi',
  },
  'karbon-peeling-nedir': {
    keyword: 'karbon peeling nedir',
    service: 'karbon-peeling',
    category: 'cilt-yenileme-rehberi',
  },
  'kolajen-bakimi-nedir': {
    keyword: 'kolajen bakımı nedir',
    service: 'kolajen-bakimi',
    category: 'cilt-bakimi-rehberi',
  },
  'hucre-yenileme-bakimi-nedir': {
    keyword: 'hücre yenileme bakımı',
    service: 'hucre-yenileme',
    category: 'cilt-yenileme-rehberi',
  },
  'gozenek-gorunumu-neden-belirginlesir': {
    keyword: 'gözenek görünümü',
    service: 'gozenek-sikilastirma',
    category: 'cilt-ihtiyaclari',
  },
  'hassas-ciltte-bakim-yaklasimi': {
    keyword: 'hassas cilt bakımı',
    service: 'hassas-cilt-bakimi',
    category: 'cilt-ihtiyaclari',
  },
  'cilt-nemi-neden-azalir': {
    keyword: 'cilt nemi neden azalır',
    service: 'nemlendirme-bakimi',
    category: 'cilt-ihtiyaclari',
  },
  'yaslanma-karsiti-bakim-nedir': {
    keyword: 'yaşlanma karşıtı bakım',
    service: 'yaslanma-karsiti-bakim',
    category: 'cilt-ihtiyaclari',
  },
  'peeling-cesitleri-nasil-ayrilir': {
    keyword: 'peeling çeşitleri',
    service: 'kimyasal-peeling',
    category: 'cilt-yenileme-rehberi',
  },
  'microblading-mi-pudra-kas-mi': {
    keyword: 'microblading mi pudra kaş mı',
    service: 'microblading',
    category: 'kas-kirpik-rehberi',
  },
  'kalici-makyaj-mi-kas-tasarimi-mi': {
    keyword: 'kaş tasarımı mı kalıcı makyaj mı',
    service: 'kas-tasarimi',
    category: 'kas-kirpik-rehberi',
  },
  'evde-bakim-ile-merkez-bakimi': {
    keyword: 'evde cilt bakımı merkez farkı',
    service: 'cilt-bakimi',
    category: 'cilt-bakimi-rehberi',
  },
  'yaz-gunesi-ve-leke-gorunumu': {
    keyword: 'yaz sonrası cilt lekesi',
    service: 'leke-bakimi',
    category: 'ozel-gun-ve-mevsim',
  },
  'kis-aylarinda-cilt-nemi': {
    keyword: 'kışın cilt kuruluğu',
    service: 'nemlendirme-bakimi',
    category: 'ozel-gun-ve-mevsim',
  },
  'mevsim-gecisinde-rutini-sadelestirmek': {
    keyword: 'mevsim geçişinde cilt bakımı',
    service: 'cilt-bakimi',
    category: 'ozel-gun-ve-mevsim',
  },
  'yogun-sezonda-hazirlik-planlamak': {
    keyword: 'düğün sezonu bakım planı',
    service: 'gelin-bakim-paketi',
    category: 'ozel-gun-ve-mevsim',
  },
  'lazer-epilasyon-oncesi-ve-sonrasi': {
    keyword: 'lazer epilasyon öncesi ne yapılmalı',
    service: 'lazer-epilasyon',
    category: 'epilasyon-rehberi',
  },
  'dermapen-oncesi-ve-sonrasi': {
    keyword: 'dermapen sonrası bakım',
    service: 'dermapen',
    category: 'cilt-yenileme-rehberi',
  },
  'kalici-makyaj-oncesi-bilinmesi-gerekenler': {
    keyword: 'kalıcı makyaj öncesi',
    service: 'kalici-makyaj',
    category: 'kas-kirpik-rehberi',
  },
  'kirpik-lifting-sonrasi-bakim': {
    keyword: 'kirpik lifting sonrası bakım',
    service: 'kirpik-lifting',
    category: 'kas-kirpik-rehberi',
  },
  'cilt-tipi-nasil-anlasilir': {
    keyword: 'cilt tipi nasıl anlaşılır',
    service: 'cilt-bakimi',
    category: 'cilt-bakimi-rehberi',
  },
  'cilt-bariyeri-ve-nazik-rutin': {
    keyword: 'cilt bariyeri nedir',
    service: 'hassas-cilt-bakimi',
    category: 'cilt-ihtiyaclari',
  },
  'icerik-okuma-rehberi': {
    keyword: 'retinol niasinamid birlikte kullanımı',
    service: 'hucre-yenileme',
    category: 'cilt-bakimi-rehberi',
  },
  'bakim-vaatlerini-okumak': {
    keyword: 'cilt bakımı doğru bilinen yanlışlar',
    service: 'cilt-bakimi',
    category: 'cilt-bakimi-rehberi',
  },
};

/** Everything published. Both literals, merged in one place. */
const PLANNED: Readonly<Record<string, PlannedPost>> = {
  ...BATCH_1,
  ...BATCH_2,
};

/**
 * The most posts any one service may carry.
 *
 * Not a style preference: past this, a cluster stops being supporting editorial
 * and starts competing with its own service page for the same query.
 */
const MAX_POSTS_PER_SERVICE = 5;

const each = posts.map((post) => [post.slug, post] as const);

/** Body prose with markdown syntax removed, for word counts. */
const bodyWords = (post: Post) =>
  post.body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

/** Everything a reader can see, frontmatter and body together. */
const everything = (post: Post) =>
  [
    post.title,
    post.summary,
    ...post.keyPoints,
    ...post.faq.flatMap((entry) => [entry.question, entry.answer]),
    post.body,
  ].join('\n');

const linksIn = (post: Post, prefix: string) => [
  ...new Set(
    [...post.body.matchAll(new RegExp(`/${prefix}/([a-z0-9-]+)`, 'g'))].map(
      (match) => match[1] ?? '',
    ),
  ),
];

/* ── The inventory ────────────────────────────────────────────────────────── */

describe('the published batches', () => {
  it('is exactly the planned set — both batches, nothing else', () => {
    expect(posts.map((p) => p.slug).sort()).toEqual(
      Object.keys(PLANNED).sort(),
    );
  });

  it('publishes both batches in full', () => {
    const slugs = new Set(posts.map((p) => p.slug));
    for (const slug of Object.keys(BATCH_1))
      expect(slugs.has(slug), slug).toBe(true);
    for (const slug of Object.keys(BATCH_2))
      expect(slugs.has(slug), slug).toBe(true);
  });

  it.each(each)(
    '%s carries its planned keyword, service and category',
    (slug, post) => {
      const planned = PLANNED[slug]!;
      expect(post.keyword).toBe(planned.keyword);
      expect(post.service).toBe(planned.service);
      expect(post.category).toBe(planned.category);
    },
  );

  it('gives EVERY service editorial coverage', () => {
    // Batch 1 mapped one post to each of twelve services; Batch 2 closes the
    // gap on the remaining eight. The assertion is coverage, not arithmetic —
    // it keeps holding when a twenty-first service is added.
    const covered = new Set(posts.map((p) => p.service));
    for (const service of services) {
      expect(covered.has(service.slug), service.slug).toBe(true);
    }
  });

  it('over-serves no single service', () => {
    const perService = new Map<string, number>();
    for (const post of posts) {
      perService.set(post.service, (perService.get(post.service) ?? 0) + 1);
    }
    for (const [service, count] of perService) {
      expect(count, service).toBeLessThanOrEqual(MAX_POSTS_PER_SERVICE);
    }
  });

  it('targets a distinct keyword per post', () => {
    // Two posts on one service is deliberate; two posts on one QUERY is
    // cannibalisation, and that is what this catches.
    const keywords = posts.map((p) => p.keyword);
    expect(new Set(keywords).size).toBe(posts.length);
  });

  it('every mapped service exists and shows the post on its hub', () => {
    const slugs = new Set(services.map((s) => s.slug));
    for (const post of posts) {
      expect(slugs.has(post.service), post.slug).toBe(true);
      expect(
        getPostsByService(post.service).map((p) => p.slug),
        post.service,
      ).toContain(post.slug);
    }
  });

  it('every post uses its category hero from the manifest', () => {
    const byCategory = new Map(blogCategories.map((c) => [c.id, c.imageId]));
    const ids = new Set(images.map((i) => i.id));
    for (const post of posts) {
      expect(post.heroImageId, post.slug).toBe(byCategory.get(post.category));
      expect(ids.has(post.heroImageId), post.slug).toBe(true);
    }
  });

  it('has no byline on any of them', () => {
    for (const post of posts) {
      expect(post.author, post.slug).toBe('PENDING');
    }
  });

  it('publishes every one of them — none left as a draft', () => {
    for (const post of posts) {
      expect(post.draft, post.slug).toBe(false);
    }
  });

  it('no M9 preview fixture survives', () => {
    expect(posts.map((p) => p.slug)).not.toContain('sablon-onizleme');
  });
});

/* ── The copy rules ───────────────────────────────────────────────────────── */

describe('the guard rules, run against each post file', () => {
  it.each(each)('%s has no blocking or advisory hit', (slug) => {
    const file = `content/blog/${slug}.mdx`;
    const violations = scanText(readFileSync(file, 'utf8'), { file });
    expect(violations.map((v) => `${v.rule}: ${v.matched}`)).toEqual([]);
  });
});

describe('no invented sourcing, no numeric claims', () => {
  it.each(each)('%s states no duration, count or interval', (_slug, post) => {
    expect(everything(post)).not.toMatch(
      /\d+\s*(dakika|dk|saat|seans|hafta|ay|gün|kez|defa|yıl)/i,
    );
  });

  it.each(each)('%s cites no study, statistic or authority', (_slug, post) => {
    // The user's rule at M10: if a post needs a number to make its point, the
    // point is wrong for this site. Everything must be defensible as general
    // knowledge a careful person could state without citation.
    expect(everything(post)).not.toMatch(
      /araştırma(?:lar|ya|da)?\b|çalışmalar\b|bilim\s?insan|uzmanlar\s|istatistik|oranında|klinik çalışma/i,
    );
  });

  it.each(each)('%s publishes no percentage and no price', (_slug, post) => {
    expect(everything(post)).not.toMatch(/%/);
    expect(everything(post)).not.toMatch(
      /₺|\bTL\b|\blira\b|\bfiyat listesi\b/i,
    );
  });

  it.each(each)('%s names no device, brand or credential', (_slug, post) => {
    const bounded = (alternatives: string) =>
      new RegExp(
        `(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`,
        'iu',
      );
    expect(everything(post)).not.toMatch(
      bounded('cihaz[ıi]m[ıi]z|model|nm|joule|watt|dalga\\s+boyu'),
    );
    expect(everything(post)).not.toMatch(
      bounded(
        'uzman[ıi]m[ıi]z|doktorumuz|hemşiremiz|sertifikal[ıi]|diplomal[ıi]',
      ),
    );
  });

  it.each(each)('%s implies no before/after imagery', (_slug, post) => {
    expect(everything(post)).not.toMatch(
      /önce\s*[-/]\s*sonra|öncesi ve sonras[ıi] foto/i,
    );
  });
});

/* ── Shape and length — docs/CONTENT-PLAN.md §6 ───────────────────────────── */

describe('structure', () => {
  it.each(each)('%s body is 900–1400 words', (_slug, post) => {
    const words = bodyWords(post);
    expect(words).toBeGreaterThanOrEqual(900);
    expect(words).toBeLessThanOrEqual(1400);
  });

  it.each(each)('%s has 3–5 key points and 2–4 questions', (_slug, post) => {
    expect(post.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(post.keyPoints.length).toBeLessThanOrEqual(5);
    expect(post.faq.length).toBeGreaterThanOrEqual(2);
    expect(post.faq.length).toBeLessThanOrEqual(4);
  });

  it.each(each)('%s uses h2 for sections and never an h1', (_slug, post) => {
    // The page renders the title as the h1; a second one in the body would
    // break heading order on every post at once.
    expect(post.body).not.toMatch(/^# /m);
    expect((post.body.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('they are not all the same length', () => {
    // Posts written in one pass drift toward one rhythm, and that sameness is
    // the clearest signal of machine-written content. This is a blunt check on
    // the most measurable dimension of it.
    const counts = posts.map(bodyWords);
    const spread = Math.max(...counts) - Math.min(...counts);
    // Broad topics (lazer epilasyon, kalıcı makyaj, leke, gelin) run long;
    // narrow ones answering a single question stay near the floor.
    expect(spread).toBeGreaterThan(150);
  });

  it('they do not all share one section count', () => {
    const sections = posts.map(
      (post) => (post.body.match(/^## /gm) ?? []).length,
    );
    expect(new Set(sections).size).toBeGreaterThan(3);
  });

  it('no two posts open with the same sentence', () => {
    const openings = posts.map((post) =>
      post.body.trim().split('\n\n')[0]?.slice(0, 60),
    );
    expect(new Set(openings).size).toBe(posts.length);
  });
});

/* ── The linking map — docs/CONTENT-PLAN.md §5 ────────────────────────────── */

describe('internal links', () => {
  it.each(each)(
    '%s links up to its own service hub, in context',
    (_slug, post) => {
      expect(linksIn(post, 'hizmetler')).toContain(post.service);
    },
  );

  it.each(each)(
    '%s carries 2–3 lateral links to other posts',
    (_slug, post) => {
      const lateral = linksIn(post, 'blog').filter((s) => s !== post.slug);
      expect(lateral.length).toBeGreaterThanOrEqual(2);
      expect(lateral.length).toBeLessThanOrEqual(3);
    },
  );

  it('every lateral link resolves to a published post', () => {
    const slugs = new Set(posts.map((p) => p.slug));
    for (const post of posts) {
      for (const linked of linksIn(post, 'blog')) {
        expect(slugs.has(linked), `${post.slug} → ${linked}`).toBe(true);
      }
    }
  });

  it('no post links to itself', () => {
    for (const post of posts) {
      expect(linksIn(post, 'blog'), post.slug).not.toContain(post.slug);
    }
  });

  it('has zero orphans — every post has an inbound link', () => {
    const inbound = new Set(posts.flatMap((post) => linksIn(post, 'blog')));
    for (const post of posts) {
      expect(inbound.has(post.slug), post.slug).toBe(true);
    }
  });

  it('related posts resolve for every post and exclude the post itself', () => {
    for (const post of posts) {
      const related = getRelatedPosts(post, 3);
      expect(related.length, post.slug).toBeGreaterThan(0);
      expect(related.map((p) => p.slug)).not.toContain(post.slug);
    }
  });
});

/* ── The disclaimer ───────────────────────────────────────────────────────── */

describe('the cosmetic disclaimer', () => {
  it('lives in exactly one place and is not copied into the content', () => {
    // A copy of a compliance sentence per post is a chance to drift per post.
    for (const post of posts) {
      expect(post.body, post.slug).not.toContain(COSMETIC_DISCLAIMER);
    }
  });

  it('still passes the guard as an advisory, never an error', () => {
    const found = scanText(COSMETIC_DISCLAIMER, { file: 'disclaimer' });
    expect(found.filter((v) => v.tier === 'error')).toEqual([]);
    expect(found.map((v) => v.rule)).toContain('advisory:tıbbi');
  });
});

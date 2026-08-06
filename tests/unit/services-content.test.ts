import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import { images, replaceableImages } from '@/config/images';
import { serviceGroups, servicePage } from '@/config/services';
import { getAllServices, type Service } from '@/content-layer';
import { slugify } from '@/lib/slug';

/**
 * M8 — the twenty service pages.
 *
 * These assert the things a build cannot: that the copy holds the content
 * posture (CLAUDE.md §9), that the linking graph is reciprocal, and that the
 * template never grew a block for a fact we do not have.
 *
 * The MDX bodies are scanned with the REAL guard rules rather than a
 * reimplementation, so a term that would fail the build fails here first —
 * seconds after an edit rather than after a full production build.
 */

const services = getAllServices();
const norm = (path: string) => path.split(sep).join('/');

/** Body prose with markdown syntax removed, for word counts. */
const bodyWords = (service: Service) =>
  service.body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

const sources: { file: string; text: string }[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full))
      sources.push({ file: norm(full), text: readFileSync(full, 'utf8') });
  }
};
walk(join(process.cwd(), 'src'));

const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const read = (relative: string) =>
  stripComments(sources.find((s) => s.file.endsWith(relative))?.text ?? '');

/* ── The inventory — docs/CONTENT-PLAN.md §1 ──────────────────────────────── */

/** Slug → group, straight from the plan. Nothing derived from the content. */
const PLANNED: Readonly<Record<string, string>> = {
  'cilt-bakimi': 'cilt-bakimi',
  'akne-bakimi': 'cilt-bakimi',
  'yaslanma-karsiti-bakim': 'cilt-bakimi',
  'leke-bakimi': 'cilt-bakimi',
  'hassas-cilt-bakimi': 'cilt-bakimi',
  'kolajen-bakimi': 'cilt-bakimi',
  'nemlendirme-bakimi': 'cilt-bakimi',
  'gozenek-sikilastirma': 'cilt-bakimi',
  'hucre-yenileme': 'cilt-bakimi',
  'lazer-epilasyon': 'epilasyon',
  hydrafacial: 'cilt-yenileme',
  'karbon-peeling': 'cilt-yenileme',
  'kimyasal-peeling': 'cilt-yenileme',
  dermapen: 'cilt-yenileme',
  'bb-glow': 'cilt-yenileme',
  'kalici-makyaj': 'kas-kirpik',
  microblading: 'kas-kirpik',
  'kirpik-lifting': 'kas-kirpik',
  'kas-tasarimi': 'kas-kirpik',
  'gelin-bakim-paketi': 'ozel-paket',
};

describe('service inventory', () => {
  it('has exactly the 20 planned services, with the planned groups', () => {
    const actual = Object.fromEntries(services.map((s) => [s.slug, s.group]));
    expect(actual).toEqual(PLANNED);
  });

  it('every filename equals slugify(title), with Turkish folded', () => {
    for (const service of services) {
      expect(slugify(service.title), service.slug).toBe(service.slug);
    }
  });

  it('the eyebrow matches the group label, so the two cannot drift', () => {
    const labels = new Map(serviceGroups.map((g) => [g.id, g.label]));
    for (const service of services) {
      expect(service.eyebrow, service.slug).toBe(labels.get(service.group));
    }
  });

  it('order is unique within a group', () => {
    for (const group of serviceGroups) {
      const orders = services
        .filter((s) => s.group === group.id)
        .map((s) => s.order);
      expect(new Set(orders).size, group.id).toBe(orders.length);
    }
  });
});

/* ── Copy discipline — CLAUDE.md §9 ───────────────────────────────────────── */

describe('the guard rules, run against the MDX source', () => {
  it.each(services.map((s) => [s.slug, s] as const))(
    '%s has no blocking or advisory hit in its own file',
    (slug) => {
      const file = `content/services/${slug}.mdx`;
      const violations = scanText(readFileSync(file, 'utf8'), { file });
      expect(violations.map((v) => `${v.rule}: ${v.matched}`)).toEqual([]);
    },
  );

  it('the required disclaimer passes the guard as an advisory, never an error', () => {
    // F8. `tıbbi` MUST stay non-blocking: this exact sentence is on every
    // service page. Promoting the term breaks the disclaimer, and this fails.
    const found = scanText(servicePage.disclaimer, { file: 'disclaimer' });
    expect(found.filter((v) => v.tier === 'error')).toEqual([]);
    expect(found.map((v) => v.rule)).toContain('advisory:tıbbi');
  });
});

describe('content posture — no invented specifics', () => {
  /** Everything a visitor can read, frontmatter and body together. */
  const everything = (service: Service) =>
    [
      service.title,
      service.summary,
      service.eyebrow ?? '',
      ...service.suitableFor,
      ...service.steps.flatMap((s) => [s.title, s.body]),
      ...service.aftercare,
      ...service.faq.flatMap((f) => [f.question, f.answer]),
      service.body,
    ].join('\n');

  it.each(services.map((s) => [s.slug, s] as const))(
    '%s publishes no duration, session count or interval',
    (_slug, service) => {
      const text = everything(service);
      // No digit-plus-unit anywhere: "45 dakika", "3 seans", "2 hafta sonra".
      expect(text).not.toMatch(
        /\d+\s*(dakika|dk|saat|seans|hafta|ay|gün|kez|defa)/i,
      );
    },
  );

  it.each(services.map((s) => [s.slug, s] as const))(
    '%s publishes no price, in any form',
    (_slug, service) => {
      const text = everything(service);
      expect(text).not.toMatch(
        /₺|\bTL\b|\blira\b|fiyat listesi|ücret listesi/i,
      );
    },
  );

  it('durationLabel is null on every service', () => {
    // Ruled at C4. Kept in the schema so the decision stays visible.
    for (const service of services) {
      expect(service.durationLabel, service.slug).toBeNull();
    }
  });

  it('the detail template has no "Süre" block — the field is unrendered', () => {
    // Not "renders empty". The template must never reference the field at all,
    // otherwise flipping it to a string later silently ships a duration.
    const page = read('app/hizmetler/[slug]/page.tsx');
    expect(page).not.toContain('durationLabel');
    expect(page).not.toContain('Süre');
  });

  /**
   * Unicode-aware word boundaries, for the same reason `scripts/guard.mjs`
   * uses them (CLAUDE.md §12): JavaScript's `\b` is ASCII-only and treats `ü`
   * as a NON-word character, so `/nm\b/` happily matches inside
   * "düşünmüyoruz". The first draft of these checks did exactly that and
   * failed on a page containing no equipment reference at all.
   */
  const bounded = (alternatives: string) =>
    new RegExp(
      `(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`,
      'iu',
    );

  it('no service names a device, machine or product brand', () => {
    // Service names themselves are the owner's confirmed inventory and are
    // allowed; equipment is not. This is the vocabulary that appears when a
    // page starts describing hardware.
    const forbidden = bounded(
      'cihaz[ıi]m[ıi]z|marka|model|nm|joule|watt|dalga\\s+boyu|başl[ıi]k\\s+çap[ıi]',
    );
    for (const service of services) {
      expect(everything(service), service.slug).not.toMatch(forbidden);
    }
  });

  it('no service names staff, credentials or a qualification', () => {
    const forbidden = bounded(
      'uzman[ıi]m[ıi]z|doktorumuz|hemşiremiz|sertifikal[ıi]|diplomal[ıi]|eğitmenimiz',
    );
    for (const service of services) {
      expect(everything(service), service.slug).not.toMatch(forbidden);
    }
  });

  it('no service implies before/after imagery', () => {
    const forbidden = /önce\s*[-/]\s*sonra|öncesi ve sonras[ıi] foto/i;
    for (const service of services) {
      expect(everything(service), service.slug).not.toMatch(forbidden);
    }
  });

  it('the boundary helper does not fire inside an ordinary Turkish word', () => {
    // Pins the bug above so it cannot come back with the next added term.
    expect('Bunu düşünmüyoruz.').not.toMatch(bounded('nm'));
    expect('Kullanılan nm değeri.').toMatch(bounded('nm'));
  });
});

/* ── Length — docs/CONTENT-PLAN.md §2 ─────────────────────────────────────── */

describe('length', () => {
  it.each(services.map((s) => [s.slug, s] as const))(
    '%s body is 350–600 words',
    (_slug, service) => {
      const words = bodyWords(service);
      expect(words).toBeGreaterThanOrEqual(350);
      expect(words).toBeLessThanOrEqual(600);
    },
  );

  it('summaries fit a SERP, which is what the schema bounds enforce', () => {
    for (const service of services) {
      expect([...service.summary].length, service.slug).toBeGreaterThanOrEqual(
        60,
      );
      expect([...service.summary].length, service.slug).toBeLessThanOrEqual(
        165,
      );
    }
  });

  it('every service has 2–6 steps and at most 8 questions', () => {
    for (const service of services) {
      expect(service.steps.length, service.slug).toBeGreaterThanOrEqual(2);
      expect(service.steps.length, service.slug).toBeLessThanOrEqual(6);
      expect(service.faq.length, service.slug).toBeLessThanOrEqual(8);
    }
  });
});

/* ── The linking graph — docs/CONTENT-PLAN.md §5 ──────────────────────────── */

describe('relatedServices', () => {
  const bySlug = new Map(services.map((s) => [s.slug, s]));

  it('every service links to 3 or 4 siblings', () => {
    for (const service of services) {
      expect(
        service.relatedServices.length,
        service.slug,
      ).toBeGreaterThanOrEqual(3);
      expect(service.relatedServices.length, service.slug).toBeLessThanOrEqual(
        4,
      );
    }
  });

  it('every link resolves and none points at itself', () => {
    for (const service of services) {
      for (const related of service.relatedServices) {
        expect(bySlug.has(related), `${service.slug} → ${related}`).toBe(true);
        expect(related).not.toBe(service.slug);
      }
    }
  });

  it('the graph is fully reciprocal — no one-way link anywhere', () => {
    // docs/CONTENT-PLAN.md §5 called a one-way link a warning. It is asserted
    // here instead: the graph as authored is symmetric, so a warning nobody
    // reads is replaced by a failure nobody can miss. Adding a service means
    // adding it to its siblings' lists too, which is the correct obligation.
    const oneWay: string[] = [];
    for (const service of services) {
      for (const related of service.relatedServices) {
        const target = bySlug.get(related);
        if (target && !target.relatedServices.includes(service.slug)) {
          oneWay.push(`${service.slug} → ${related}`);
        }
      }
    }
    expect(oneWay).toEqual([]);
  });

  it('every service is reachable — no orphans', () => {
    const linked = new Set(services.flatMap((s) => s.relatedServices));
    for (const service of services) {
      expect(linked.has(service.slug), service.slug).toBe(true);
    }
  });

  it('every /hizmetler link written in a body resolves', () => {
    // Also enforced at build (integrity check 8); asserted here so an edit is
    // caught by `npm run test` without a full production build.
    for (const service of services) {
      const links = [
        ...service.body.matchAll(/\/hizmetler\/([a-z0-9-]+)/g),
      ].map((m) => m[1]);
      for (const link of links) {
        expect(bySlug.has(link ?? ''), `${service.slug} → ${link}`).toBe(true);
      }
    }
  });

  it('every service body carries at least one contextual link', () => {
    // The "lateral" half of the linking map is frontmatter; this is the
    // in-prose half, which is what carries descriptive anchor text.
    for (const service of services) {
      expect(service.body, service.slug).toMatch(/\]\(\/hizmetler\//);
    }
  });
});

/* ── Images — CLAUDE.md §8 ────────────────────────────────────────────────── */

describe('the image manifest', () => {
  it('holds one entry per service and nothing else', () => {
    expect(images).toHaveLength(services.length);
    for (const service of services) {
      expect(images.some((i) => i.id === service.heroImageId)).toBe(true);
    }
  });

  it('every referenced file actually exists on disk', () => {
    // A manifest entry pointing at a missing file renders a broken box in
    // production and passes every other check.
    for (const image of images) {
      const file = join(process.cwd(), 'public', image.src.replace(/^\//, ''));
      expect(existsSync(file), image.src).toBe(true);
    }
  });

  it('records a licence on every entry, and never a blank one', () => {
    for (const image of images) {
      expect(image.licence.trim().length, image.id).toBeGreaterThan(0);
    }
  });

  it('attributes nothing to a photographer who does not exist', () => {
    // The launch set is our own generated artwork. A fabricated credit or
    // source URL would be an invented fact like any other.
    for (const image of images) {
      expect(image.credit, image.id).toBeNull();
      expect(image.sourceUrl, image.id).toBeNull();
      expect(image.licence, image.id).toBe('CC0-1.0');
    }
  });

  it('the whole set is still marked replaceable', () => {
    expect(replaceableImages()).toHaveLength(images.length);
  });

  it('no component outside the manifest references a path under public/images', () => {
    const offenders = sources
      .filter((s) => !s.file.endsWith('src/config/images.ts'))
      .filter((s) => /['"`]\/images\//.test(stripComments(s.text)))
      .map((s) => s.file);
    expect(offenders).toEqual([]);
  });

  it('ManagedImage is the only caller of next/image', () => {
    const offenders = sources
      .filter((s) => !s.file.endsWith('components/content/ManagedImage.tsx'))
      .filter((s) => /from ['"]next\/image['"]/.test(s.text))
      .map((s) => s.file);
    expect(offenders).toEqual([]);
  });
});

/* ── The View Transition — docs/MOTION.md §3.5 ────────────────────────────── */

describe('view transition', () => {
  it('the name is applied to the activated card only, then cleared', () => {
    const link = read('components/motion/ViewTransitionLink.tsx');
    expect(link).toMatch(/source\.style\.viewTransitionName = transitionName/);
    expect(link).toMatch(
      /finally\(\(\) => \{\s*source\.style\.viewTransitionName = ''/,
    );
  });

  it('exactly one element per page can carry the hero name', () => {
    // The card sets it imperatively on click; the detail hero sets it in
    // markup. Two elements holding the same name at capture time makes the
    // transition silently do nothing, so nothing else may reference it.
    const users = sources
      .filter((s) =>
        /viewTransitionNames\.serviceHero/.test(stripComments(s.text)),
      )
      .map((s) => s.file.replace(/.*src\//, 'src/'))
      .sort();
    expect(users).toEqual([
      'src/app/hizmetler/[slug]/page.tsx',
      'src/components/content/ServiceCard.tsx',
    ]);
  });

  it('related-service rows are plain links, not transition sources', () => {
    // They carry no image, so there would be nothing to morph.
    const related = read('components/content/RelatedServices.tsx');
    expect(related).not.toContain('ViewTransitionLink');
  });
});

/* ── The server/client boundary ───────────────────────────────────────────── */

describe('what crosses into a client component', () => {
  it('the home panel list takes a narrow item, never a whole Service', () => {
    // Every prop of a client component is serialised into the RSC payload.
    // Passing `Service` shipped twenty MDX bodies inside the home page.
    expect(read('components/sections/service-list-item.ts')).toMatch(
      /export type ServiceListItem = \{[^}]*slug[^}]*title[^}]*group[^}]*\}/s,
    );
    const panels = read('components/sections/ServicesPanels.tsx');
    expect(panels).toMatch(/services: readonly ServiceListItem\[\]/);
    expect(panels).not.toMatch(/readonly Service\[\]/);
  });

  it('the narrowing happens on the server, at the call site', () => {
    // Narrowing inside the component would be too late — by then the wide
    // object has already been serialised.
    expect(read('app/page.tsx')).toContain('toListItems(services)');
  });
});

/* ── Copy lives in config, not in components ──────────────────────────────── */

describe('no Turkish sentence in a component', () => {
  it('holds for content components as well as sections', () => {
    const turkishSentence = /['"`][^'"`\n]*\s(bir|ve|için|ile)\s[^'"`\n]*['"`]/;
    const offenders = sources
      .filter(
        (s) =>
          s.file.includes('src/components/content/') ||
          s.file.includes('src/components/sections/') ||
          s.file.includes('src/app/hizmetler/'),
      )
      .filter((s) => turkishSentence.test(stripComments(s.text)))
      .map((s) => s.file);
    expect(offenders).toEqual([]);
  });
});

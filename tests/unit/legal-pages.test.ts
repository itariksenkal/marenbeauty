import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import { legal, LEGAL_SLUGS, legalPage } from '@/config/legal';
import { LEGAL_ENTITY_TOKEN, legalEntity } from '@/config/legal-entity';
import { getAllLegalDocuments, getLegalDocument } from '@/content-layer';

const ROOT = process.cwd();

/**
 * The one allowance the guard ships with (scripts/guard.allow.json): a verbatim
 * quotation of KVKK m. 11. Loaded rather than restated so this file cannot
 * disagree with the gate about what is permitted.
 */
const ALLOWANCES = JSON.parse(
  readFileSync(join(ROOT, 'scripts', 'guard.allow.json'), 'utf8'),
).allow;

const errorsIn = (text: string, ext = '.html') =>
  scanText(text, { file: 'fixture', ext, allowances: ALLOWANCES }).filter(
    (v: { tier: string }) => v.tier === 'error',
  );

const warningsIn = (text: string, ext = '.html') =>
  scanText(text, { file: 'fixture', ext }).filter(
    (v: { tier: string }) => v.tier === 'warning',
  );

/* ── The documents themselves ──────────────────────────────────────────────── */

describe('legal documents', () => {
  it('publishes exactly the three planned documents, in order', () => {
    const docs = getAllLegalDocuments();
    expect(docs.map((d) => d.slug)).toEqual([...LEGAL_SLUGS]);
    expect(docs.map((d) => d.order)).toEqual([1, 2, 3]);
  });

  it('gives every document a real title and a SERP-shaped summary', () => {
    for (const doc of getAllLegalDocuments()) {
      expect(doc.title.length).toBeGreaterThan(5);
      expect(doc.title.length).toBeLessThanOrEqual(60);
      expect(doc.summary.length).toBeGreaterThanOrEqual(60);
      expect(doc.summary.length).toBeLessThanOrEqual(165);
    }
  });

  it('throws on an unknown slug rather than rendering an empty notice', () => {
    expect(() => getLegalDocument('yok-boyle-bir-metin')).toThrow(
      /No legal document/,
    );
  });
});

/* ── The entity is not invented, and not printed either ────────────────────── */

describe('the legal entity stays unresolved', () => {
  afterEach(() => {
    delete process.env.LEGAL_ENTITY;
  });

  it('is unresolved with no LEGAL_ENTITY in the environment', () => {
    delete process.env.LEGAL_ENTITY;
    expect(legalEntity()).toEqual({ resolved: false, name: null });
  });

  it('treats the literal token as unresolved, not as a name', () => {
    process.env.LEGAL_ENTITY = LEGAL_ENTITY_TOKEN;
    expect(legalEntity().resolved).toBe(false);
  });

  it('resolves once the owner supplies the ünvan', () => {
    process.env.LEGAL_ENTITY = 'Örnek Güzellik Hizmetleri Ltd. Şti.';
    expect(legalEntity()).toEqual({
      resolved: true,
      name: 'Örnek Güzellik Hizmetleri Ltd. Şti.',
    });
  });

  /**
   * The failure this guards against is a plausible-sounding company name
   * appearing in a legal notice. Company-form suffixes are the tell.
   */
  it('names no entity anywhere in the three bodies or in the page copy', () => {
    // Unicode boundaries, not \b: JavaScript's \b is ASCII-only and treats "ş"
    // as a non-word character, so /A\.?\s*Ş\b/i matches inside "başvuru".
    // The same trap this repository has hit twice (CLAUDE.md §12, G15).
    const forms =
      /(?<![\p{L}\p{N}])(?:Ltd\.?\s*Şti|A\.\s?Ş\.|Limited Şirketi|Anonim Şirketi)/iu;
    for (const doc of getAllLegalDocuments()) {
      expect(doc.body).not.toMatch(forms);
    }
    expect(JSON.stringify(legalPage)).not.toMatch(forms);
  });

  it('never writes a {{token}} into a document body', () => {
    for (const doc of getAllLegalDocuments()) {
      expect(doc.body).not.toContain('{{');
    }
  });

  it('keeps the token out of the client graph by construction', () => {
    // `legal-entity.ts` is the only module holding the token, and no
    // 'use client' module may import it — a client chunk is exactly where an
    // unused string survives minification and trips guard rule 2 on its own
    // definition.
    const clientModules = execFileSync(
      'node',
      [
        '-e',
        `const {readdirSync,readFileSync,statSync}=require('fs');const {join}=require('path');
         const out=[];
         (function walk(d){for(const e of readdirSync(d)){const f=join(d,e);
           if(statSync(f).isDirectory())walk(f);
           else if(/\\.(ts|tsx)$/.test(f)&&readFileSync(f,'utf8').includes("'use client'"))out.push(f);}})('src');
         process.stdout.write(out.join('\\n'));`,
      ],
      { cwd: ROOT, encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean);

    expect(clientModules.length).toBeGreaterThan(0);
    for (const file of clientModules) {
      expect(readFileSync(join(ROOT, file), 'utf8')).not.toContain(
        'legal-entity',
      );
    }
  });
});

/* ── Guard cleanliness of the shipped text ─────────────────────────────────── */

describe('legal copy passes the content guard', () => {
  it('has no blocking violation in any body', () => {
    for (const doc of getAllLegalDocuments()) {
      expect(errorsIn(doc.body)).toEqual([]);
    }
  });

  it('has no blocking violation in the page chrome copy', () => {
    expect(errorsIn(JSON.stringify(legalPage))).toEqual([]);
  });

  /**
   * `garanti` is a blocking term, and "hiçbir garanti verilmez" is the single
   * most common sentence in a terms-of-use document. Pinning it here means a
   * future edit that reaches for the obvious phrasing fails a test rather than
   * a production build.
   */
  it('states the no-promise clause without the blocking term', () => {
    const terms = getLegalDocument('kullanim-kosullari');
    expect(errorsIn(terms.body)).toEqual([]);
    expect(terms.body).toContain('taahhüdü verilmez');
  });

  it('reports only the advisory terms it is entitled to', () => {
    for (const doc of getAllLegalDocuments()) {
      for (const warning of warningsIn(doc.body)) {
        expect(warning.rule).toMatch(/^advisory:/);
      }
    }
  });
});

/* ── Accuracy: the text must describe what the site actually does ──────────── */

describe('legal copy matches the implementation', () => {
  it('says the site sets no cookies, which is what analytics.ts says too', async () => {
    const { activeProviders } = await import('@/config/analytics');
    expect(activeProviders()).toEqual([]);

    const cookies = getLegalDocument('cerez-politikasi');
    expect(cookies.body).toContain('Bu site çerez kullanmıyor');
  });

  it('says the contact form stores nothing, which legal.dataRetention says too', () => {
    expect(legal.dataRetention).toBe('none');
    expect(getLegalDocument('kvkk').body).toContain('Sitede saklanmaz');
  });

  it('lists all nine KVKK Art. 11 rights', () => {
    const kvkk = getLegalDocument('kvkk');
    const section = kvkk.body.slice(kvkk.body.indexOf('m. 11'));
    const bullets = section
      .split('\n')
      .filter((line) => line.startsWith('- ')).length;
    expect(bullets).toBe(9);
  });

  it('is marked unreviewed until the owner says otherwise', () => {
    expect(legal.isLawyerReviewed).toBe(false);
    expect(legal.effectiveDate).toBeNull();
  });
});

/* ── Guard rule 2, demonstrated end to end against the real script ─────────── */

describe('guard rule 2 blocks an unresolved token in build output', () => {
  function fixtureRoot(html: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'mb-guard-'));
    const appDir = join(dir, '.next', 'server', 'app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(join(appDir, 'kvkk.html'), html, 'utf8');
    return dir;
  }

  function runGuard(root: string): { code: number; output: string } {
    try {
      const output = execFileSync(
        'node',
        [join(ROOT, 'scripts', 'guard.mjs'), `--root=${root}`],
        { encoding: 'utf8' },
      );
      return { code: 0, output };
    } catch (error) {
      const e = error as { status: number; stdout: string; stderr: string };
      return { code: e.status, output: `${e.stdout}${e.stderr}` };
    }
  }

  it('exits non-zero and names the file when {{LEGAL_ENTITY}} reaches output', () => {
    const root = fixtureRoot(
      `<main><h1>KVKK</h1><p>Veri sorumlusu: ${LEGAL_ENTITY_TOKEN}</p></main>`,
    );
    const result = runGuard(root);

    expect(result.code).toBe(1);
    expect(result.output).toContain('unresolved-token');
    expect(result.output).toContain('.next/server/app/kvkk.html');
    expect(result.output).toContain('BLOCKING');
  });

  it('exits 0 on the same page with the entity resolved', () => {
    const root = fixtureRoot(
      `<main><h1>KVKK</h1><p>Veri sorumlusu: Örnek Ltd. Şti.</p></main>`,
    );
    expect(runGuard(root).code).toBe(0);
  });
});

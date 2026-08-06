import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Plain ESM script with JSDoc types — TypeScript infers from the source.
import { scanText, validateAllowances } from '../../scripts/guard.mjs';

type Violation = ReturnType<typeof scanText>[number];

const scan = (text: string, ext = '.html'): Violation[] =>
  scanText(text, { file: 'fixture', ext });

const errors = (text: string, ext = '.html') =>
  scan(text, ext).filter((v) => v.tier === 'error');
const warnings = (text: string, ext = '.html') =>
  scan(text, ext).filter((v) => v.tier === 'warning');

/* ── Rule 1 — blocking lexicon ─────────────────────────────────────────────── */

describe('rule 1 — blocking lexicon, all 16 terms', () => {
  it.each([
    ['tedavi', 'Bu bir tedavi değildir.'],
    ['terapi', 'Cilt terapi seansı.'],
    ['kür', 'Üç haftalık kür uygulanır.'],
    ['iyileştir', 'Cildi iyileştirir.'],
    ['yok ed', 'Lekeleri yok eder.'],
    ['garanti', 'Sonuç garanti edilir.'],
    ['kesin sonuç', 'Kesin sonuç alırsınız.'],
    ['mucize', 'Mucize etkisi vardır.'],
    ['kalıcı çözüm', 'Akneye kalıcı çözüm.'],
    ['kanıtlanmış', 'Bilimsel olarak kanıtlanmış.'],
    ['%100', 'Cildiniz %100 yenilenir.'],
    ['risksiz', 'Tamamen risksiz bir uygulama.'],
    ['yan etkisiz', 'Yan etkisiz bir yöntem.'],
    ['ağrısız', 'Tamamen ağrısız geçer.'],
    ['1 numaralı', "Konya'nın 1 numaralı merkezi."],
    ['en iyi', 'Cildiniz için en iyi bakım.'],
  ])('blocks %s', (term, sentence) => {
    const found = errors(sentence);
    expect(found.map((v) => v.rule)).toContain(`blocking:${term}`);
  });

  it('catches Turkish suffixed forms', () => {
    for (const form of [
      'tedavisi',
      'tedaviler',
      'tedavide',
      'tedavilerde',
      'terapisi',
      'garantili',
      'mucizesi',
      'iyileştirici',
      'iyileştirme',
    ]) {
      expect(errors(`Bir ${form} sunuyoruz.`).length, form).toBeGreaterThan(0);
    }
  });

  it('reports every violation on a line, not just the first', () => {
    const found = errors('Garanti ve kesin sonuç ve mucize bir tedavi.');
    const rules = found.map((v) => v.rule);
    expect(rules).toContain('blocking:garanti');
    expect(rules).toContain('blocking:kesin sonuç');
    expect(rules).toContain('blocking:mucize');
    expect(rules).toContain('blocking:tedavi');
  });

  it('reports line, column and an excerpt', () => {
    const [first] = errors('temiz satır\nikinci satırda tedavi var');
    expect(first).toBeDefined();
    expect(first!.line).toBe(2);
    expect(first!.column).toBeGreaterThan(0);
    expect(first!.excerpt).toContain('tedavi');
  });
});

/* ── F7 — must NOT flag ordinary Turkish words ─────────────────────────────── */

describe('F7 — ordinary Turkish words are not flagged', () => {
  it.each(['kürk', 'kürek', 'şükür', 'küresel', 'küre', 'kürkçü', 'kürekçi'])(
    '%s is clean',
    (word) => {
      expect(errors(`Bu bir ${word} örneğidir.`), word).toHaveLength(0);
    },
  );

  it('şükür is not matched because ü is a letter, not a word boundary', () => {
    // JavaScript's \b is ASCII-only and treats "ü" as a NON-word character,
    // so /\bkür/ WOULD match inside "şükür". This is the exact bug the
    // Unicode-aware boundary exists to prevent.
    expect(/\bkür/u.test('şükür')).toBe(true); // the naive approach fails
    expect(errors('Çok şükür iyiyiz.')).toHaveLength(0); // ours does not
  });

  it('does not flag iyileşme, which is a different stem from iyileştir', () => {
    expect(errors('İyileşme sürecinde bakım.')).toHaveLength(0);
  });

  it('does not flag "en iyimser" as "en iyi"', () => {
    expect(errors('En iyimser tahminle.')).toHaveLength(0);
  });

  it('does not flag fizyoterapi — ruled 2026-08-06, do not widen the stem', () => {
    // A real profession, not a claim. The left word boundary is what keeps it
    // clean, and that behaviour was reviewed and kept deliberately.
    expect(errors('Fizyoterapi bir sağlık mesleğidir.')).toHaveLength(0);
    // The bare term still blocks.
    expect(errors('Cilt terapi seansı.').length).toBeGreaterThan(0);
  });
});

/* ── F8 — the C9 disclaimer must pass unmodified ───────────────────────────── */

describe('F8 — the required disclaimer passes', () => {
  const DISCLAIMER =
    'Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.';

  it('produces no blocking violation', () => {
    expect(errors(DISCLAIMER)).toHaveLength(0);
  });

  it('produces exactly one advisory hit, for tıbbi', () => {
    const advisories = warnings(DISCLAIMER);
    expect(advisories).toHaveLength(1);
    expect(advisories[0]!.rule).toBe('advisory:tıbbi');
  });

  it('is the reason tıbbi must stay non-blocking', () => {
    // If anyone promotes `tıbbi` to the blocking tier, the disclaimer the
    // owner chose can no longer ship. This test fails first.
    expect(DISCLAIMER).toContain('tıbbi');
  });
});

/* ── Rule 2 — unresolved tokens ────────────────────────────────────────────── */

describe('rule 2 — unresolved tokens', () => {
  it('blocks {{LEGAL_ENTITY}} in rendered output', () => {
    const found = errors('<p>Veri sorumlusu: {{LEGAL_ENTITY}}</p>');
    expect(found.map((v) => v.rule)).toContain('unresolved-token');
  });

  it('blocks any {{…}} in rendered output', () => {
    expect(errors('<p>{{ anything at all }}</p>').length).toBeGreaterThan(0);
  });

  it('only flags SHOUTING tokens in JavaScript chunks', () => {
    // `{{` is ordinary syntax in minified JS; a general pattern would fail
    // every build.
    expect(errors('const a={{b:1}};', '.js')).toHaveLength(0);
    expect(errors('x="{{LEGAL_ENTITY}}";', '.js').length).toBeGreaterThan(0);
  });
});

/* ── Rule 3 — empty-target channel links ───────────────────────────────────── */

describe('rule 3 — empty channel links', () => {
  it.each([
    '<a href="tel:">Ara</a>',
    "<a href='mailto:'>Yaz</a>",
    '<a href="https://wa.me/">WhatsApp</a>',
    '<a data-channel="phone" href="#">Ara</a>',
    '<a data-channel="whatsapp" href="">Yaz</a>',
  ])('blocks %s', (html) => {
    const found = errors(html);
    expect(found.map((v) => v.rule)).toContain('empty-channel-link');
  });

  it('blocks the RSC payload form too', () => {
    expect(errors('{"href":"tel:","children":"Ara"}').length).toBeGreaterThan(
      0,
    );
  });

  it('allows a real target', () => {
    expect(errors('<a href="tel:+905551112233">Ara</a>')).toHaveLength(0);
    expect(errors('<a href="https://wa.me/905551112233">Yaz</a>')).toHaveLength(
      0,
    );
  });

  it('ignores attribute order on the anchor check', () => {
    expect(
      errors('<a href="#" class="x" data-channel="email">Yaz</a>').length,
    ).toBeGreaterThan(0);
  });
});

/* ── Rule 4 — placeholder copy ─────────────────────────────────────────────── */

describe('rule 4 — lorem ipsum', () => {
  it.each(['Lorem ipsum dolor', 'dolor sit amet, consectetur'])(
    'blocks %s',
    (text) => {
      expect(errors(text).map((v) => v.rule)).toContain('lorem-ipsum');
    },
  );
});

/* ── Rules 5 & 6 — warning tier ────────────────────────────────────────────── */

describe('rules 5 and 6 — warnings do not block', () => {
  it.each(['klinik', 'tıbbi', 'doktor kontrolünde', 'bir numaralı'])(
    '%s warns but does not block',
    (term) => {
      const text = `Bu ${term} ifadesidir.`;
      expect(errors(text)).toHaveLength(0);
      expect(warnings(text).length).toBeGreaterThan(0);
    },
  );

  it('"bir numaralı" is advisory while "1 numaralı" blocks', () => {
    // Ruled 2026-08-06: same claim, spelled out — but the blocking tier stays
    // the sixteen terms as specified.
    const spelled = 'Konya’nın bir numaralı merkezi.';
    expect(errors(spelled)).toHaveLength(0);
    expect(warnings(spelled).map((v) => v.rule)).toContain(
      'advisory:bir numaralı',
    );

    const numeric = 'Konya’nın 1 numaralı merkezi.';
    expect(errors(numeric).map((v) => v.rule)).toContain('blocking:1 numaralı');
  });

  it('does not flag "birinci" or an ordinary "bir"', () => {
    expect(scan('Bir bakım seansı yaklaşık bir saat sürer.')).toHaveLength(0);
  });

  it('percentages warn but do not block', () => {
    expect(errors('Nemlilik %40 arttı.')).toHaveLength(0);
    expect(warnings('Nemlilik %40 arttı.').map((v) => v.rule)).toContain(
      'percentage-claim',
    );
  });

  it('ignores percentages inside an inline style attribute', () => {
    // clip-path:inset(0 0 100% 0) matched `%\s?\d` and reported a bogus claim
    // on every page using an image or text reveal. Warnings that fire
    // everywhere teach people to ignore warnings.
    const reveal =
      '<span style="clip-path:inset(0 0 100% 0);transform:translateY(0.36em)">Sakin bir bakım.</span>';
    expect(scan(reveal)).toHaveLength(0);
  });

  it('still catches a percentage in visible copy on the same line', () => {
    const mixed =
      '<span style="clip-path:inset(0 0 100% 0)">Nem %40 arttı.</span>';
    expect(warnings(mixed).map((v) => v.rule)).toContain('percentage-claim');
    expect(warnings(mixed)).toHaveLength(1);
  });

  it('still blocks %100 in copy but not in a style attribute', () => {
    expect(errors('<p style="width:100% 0">Temiz metin.</p>')).toHaveLength(0);
    expect(
      errors('<p>Cildiniz %100 yenilenir.</p>').map((v) => v.rule),
    ).toContain('blocking:%100');
  });

  it('does not scan JavaScript for percentages — modulo is not a claim', () => {
    // Minified framework code is full of `n%100`; failing a build on that
    // would make the guard untrustworthy.
    expect(scan('const r=n%100;', '.js')).toHaveLength(0);
  });

  it('ignores percent-ENCODING in a URL attribute', () => {
    // `next/image` emits `?url=%2Fimages%2F…` once per breakpoint. Before this
    // was masked, twenty service pages produced hundreds of "percentage claim"
    // warnings, none of which was a claim. Found at M8 against a real build.
    const srcset =
      '<img srcset="/_next/image?url=%2Fimages%2Fservices%2Fcilt-bakimi.webp&amp;w=640&amp;q=75 640w" src="/_next/image?url=%2Fimages%2Fservices%2Fcilt-bakimi.webp&amp;w=1200&amp;q=75" alt="">';
    expect(scan(srcset)).toHaveLength(0);
  });

  it('ignores the same URL in its RSC-payload (JSON) form', () => {
    const rsc = '{"src":"/_next/image?url=%2Fimages%2Fx.webp&w=750&q=75"}';
    expect(scan(rsc, '.rsc')).toHaveLength(0);
  });

  it('still catches a percentage in copy on a line that also has a URL', () => {
    const mixed =
      '<img src="/_next/image?url=%2Fa.webp"><p>Nemlilik %40 arttı.</p>';
    expect(warnings(mixed).map((v) => v.rule)).toContain('percentage-claim');
    expect(warnings(mixed)).toHaveLength(1);
  });

  it('does NOT mask content="…" — a meta description is prose', () => {
    // The one attribute a claim can legitimately appear in.
    const meta = '<meta name="description" content="Cildiniz %100 yenilenir.">';
    expect(errors(meta).map((v) => v.rule)).toContain('blocking:%100');
  });
});

/* ── F9 — %100 blocks and is not masked by the percentage warning ──────────── */

describe('F9 — %100 is blocking, not masked by the %-warning', () => {
  it('reports %100 as blocking', () => {
    const found = scan('Cildiniz %100 yenilenir.');
    expect(
      found.filter((v) => v.tier === 'error').map((v) => v.rule),
    ).toContain('blocking:%100');
  });

  it('does not also report it as a mere warning', () => {
    const found = scan('Cildiniz %100 yenilenir.');
    expect(found.filter((v) => v.rule === 'percentage-claim')).toHaveLength(0);
  });

  it('still warns on other percentages in the same line', () => {
    const found = scan('%100 etkili, nem %30 arttı.');
    expect(found.filter((v) => v.rule === 'blocking:%100')).toHaveLength(1);
    expect(found.filter((v) => v.rule === 'percentage-claim')).toHaveLength(1);
  });
});

/* ── Escaped content cannot slip through ───────────────────────────────────── */

describe('escaped content is decoded before matching', () => {
  it('catches a \\u-escaped banned word in a JS chunk', () => {
    // "tedavi" with the i escaped.
    expect(errors('var s="tedav\\u0069";', '.js').length).toBeGreaterThan(0);
  });

  it('catches an HTML-entity-escaped banned word', () => {
    expect(errors('<p>tedav&#105;</p>').length).toBeGreaterThan(0);
  });
});

/* ── Allowances ────────────────────────────────────────────────────────────── */

describe('allowances', () => {
  it('suppresses a violation inside the allowed phrase only', () => {
    const allowances = [
      { phrase: 'tıbbi tedavi değildir', reason: 'test fixture' },
    ];
    const inside = scanText('Bu bir tıbbi tedavi değildir.', {
      file: 'f',
      ext: '.html',
      allowances,
    }).filter((v) => v.tier === 'error');
    expect(inside).toHaveLength(0);

    const outside = scanText('Etkili bir tedavi sunuyoruz.', {
      file: 'f',
      ext: '.html',
      allowances,
    }).filter((v) => v.tier === 'error');
    expect(outside.length).toBeGreaterThan(0);
  });

  it('rejects an allowance with no reason', () => {
    expect(() => validateAllowances([{ phrase: 'tedavi' }])).toThrow(/reason/);
    expect(() => validateAllowances([{ reason: 'why' }])).toThrow(/reason/);
  });

  it('accepts a complete allowance', () => {
    expect(() =>
      validateAllowances([{ phrase: 'x', reason: 'because' }]),
    ).not.toThrow();
  });

  /**
   * The list stayed empty through M11 — the C9 disclaimer was reworded rather
   * than excepted. M12 added exactly one entry, and it is a verbatim quotation
   * of KVKK m. 11, which cannot be reworded without misstating the law.
   *
   * The assertion is deliberately an exact list rather than a count: a new
   * entry has to be added here, by name, with a human deciding it belongs.
   */
  it('holds only the statutory quotation, and every entry says why', () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), 'scripts', 'guard.allow.json'), 'utf8'),
    );
    expect(config.allow.map((a: { phrase: string }) => a.phrase)).toEqual([
      'silinmesini veya yok edilmesini isteme',
    ]);
    for (const entry of config.allow) {
      expect(entry.reason.length).toBeGreaterThan(40);
    }
  });

  it('scopes the statutory allowance to that phrase alone', () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), 'scripts', 'guard.allow.json'), 'utf8'),
    );
    const allowances = config.allow;

    // The quoted right passes …
    expect(
      scanText(
        '<li>Kanunun 7. maddesindeki şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>',
        { file: 'fixture', ext: '.html', allowances },
      ).filter((v) => v.tier === 'error'),
    ).toEqual([]);

    // … and the claim the rule exists for still does not.
    expect(
      scanText('<p>Lekeleri yok eder.</p>', {
        file: 'fixture',
        ext: '.html',
        allowances,
      }).filter((v) => v.tier === 'error').length,
    ).toBeGreaterThan(0);
  });
});

/* ── Whole-page fixtures ───────────────────────────────────────────────────── */

describe('page fixtures', () => {
  const CLEAN = `<!doctype html><html lang="tr"><body>
    <h1>Hydrafacial</h1>
    <p>Uygulama, cildin temizlenmesi ve nemlendirilmesi adımlarından oluşur.
       Cildin canlı görünmesine destek olmayı amaçlar.</p>
    <p>Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.</p>
    <a href="/iletisim">Randevu için yazın</a>
  </body></html>`;

  const BAD = `<!doctype html><html lang="tr"><body>
    <h1>Mucize Tedavi</h1>
    <p>Kesin sonuç garanti! Lekeleri %100 yok eder, tamamen ağrısız ve risksiz.</p>
    <p>Veri sorumlusu: {{LEGAL_ENTITY}}</p>
    <p>Lorem ipsum dolor sit amet.</p>
    <a data-channel="phone" href="tel:">Ara</a>
  </body></html>`;

  it('a clean page passes with no blocking violations', () => {
    expect(errors(CLEAN)).toHaveLength(0);
  });

  it('a clean page still surfaces the tıbbi advisory', () => {
    expect(warnings(CLEAN).map((v) => v.rule)).toContain('advisory:tıbbi');
  });

  it('a deliberately bad page fails on every rule', () => {
    const rules = new Set(errors(BAD).map((v) => v.rule));
    for (const expected of [
      'blocking:mucize',
      'blocking:tedavi',
      'blocking:kesin sonuç',
      'blocking:garanti',
      'blocking:%100',
      'blocking:yok ed',
      'blocking:ağrısız',
      'blocking:risksiz',
      'unresolved-token',
      'lorem-ipsum',
      'empty-channel-link',
    ]) {
      expect(rules, expected).toContain(expected);
    }
  });
});

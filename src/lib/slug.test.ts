import { describe, expect, it } from 'vitest';

import { assertValidSlug, isValidSlug, slugify } from '@/lib/slug';

/**
 * Pinned against all 20 real service names from docs/CONTENT-PLAN.md §1.
 * Slugs are permanent — renaming one later needs a redirect — so these are
 * effectively frozen URLs, and this table is what freezes them.
 */
const SERVICE_SLUGS: readonly (readonly [string, string])[] = [
  ['Cilt Bakımı', 'cilt-bakimi'],
  ['Akne Bakımı', 'akne-bakimi'],
  ['Yaşlanma Karşıtı Bakım', 'yaslanma-karsiti-bakim'],
  ['Leke Bakımı', 'leke-bakimi'],
  ['Hassas Cilt Bakımı', 'hassas-cilt-bakimi'],
  ['Kolajen Bakımı', 'kolajen-bakimi'],
  ['Nemlendirme Bakımı', 'nemlendirme-bakimi'],
  ['Gözenek Sıkılaştırma', 'gozenek-sikilastirma'],
  ['Hücre Yenileme', 'hucre-yenileme'],
  ['Lazer Epilasyon', 'lazer-epilasyon'],
  ['Hydrafacial', 'hydrafacial'],
  ['Karbon Peeling', 'karbon-peeling'],
  ['Kimyasal Peeling', 'kimyasal-peeling'],
  ['Dermapen', 'dermapen'],
  ['BB Glow', 'bb-glow'],
  ['Kalıcı Makyaj', 'kalici-makyaj'],
  ['Microblading', 'microblading'],
  ['Kirpik Lifting', 'kirpik-lifting'],
  ['Kaş Tasarımı', 'kas-tasarimi'],
  ['Gelin Bakım Paketi', 'gelin-bakim-paketi'],
];

describe('slugify — the 20 service names', () => {
  it.each(SERVICE_SLUGS)('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('produces 20 unique slugs', () => {
    const slugs = SERVICE_SLUGS.map(([input]) => slugify(input));
    expect(new Set(slugs).size).toBe(SERVICE_SLUGS.length);
  });

  it('produces only valid slugs', () => {
    for (const [input] of SERVICE_SLUGS) {
      expect(isValidSlug(slugify(input)), input).toBe(true);
    }
  });
});

describe('slugify — Turkish folding', () => {
  it.each([
    ['ı', 'i'],
    ['İ', 'i'],
    ['ş', 's'],
    ['Ş', 's'],
    ['ğ', 'g'],
    ['Ğ', 'g'],
    ['ü', 'u'],
    ['Ü', 'u'],
    ['ö', 'o'],
    ['Ö', 'o'],
    ['ç', 'c'],
    ['Ç', 'c'],
  ])('folds %s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('folds dotless ı rather than dropping it', () => {
    // The classic bug: NFD + strip-diacritics deletes U+0131 entirely,
    // because it is its own letter, not an i with a mark on top.
    expect(slugify('Bakımı')).toBe('bakimi');
    expect(slugify('Kalıcı')).not.toContain('klc');
  });

  it('is not affected by Turkish locale casing of I/İ', () => {
    // In a tr-TR locale, 'I'.toLowerCase() is 'ı' and 'İ'.toLowerCase() is 'i'.
    // Folding before lowercasing makes the result locale-independent.
    expect(slugify('IĞDIR')).toBe('igdir');
    expect(slugify('İstanbul')).toBe('istanbul');
  });
});

describe('slugify — general behaviour', () => {
  it.each([
    ['  boşluklu   ad  ', 'bosluklu-ad'],
    ['Kaş & Kirpik', 'kas-ve-kirpik'],
    ["Gelin'in Paketi", 'gelinin-paketi'],
    ['30’lu Yaşlar', '30lu-yaslar'],
    ['çift--tire', 'cift-tire'],
    ['-baştan-ve-sondan-', 'bastan-ve-sondan'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('isValidSlug', () => {
  it.each(['cilt-bakimi', 'bb-glow', 'hydrafacial', '30lu-yaslar'])(
    'accepts %s',
    (slug) => expect(isValidSlug(slug)).toBe(true),
  );

  it.each([
    'Cilt-Bakimi',
    'cilt_bakimi',
    'cilt bakimi',
    '-cilt',
    'cilt-',
    'cilt--bakimi',
    'bakımı',
    '',
  ])('rejects %s', (slug) => expect(isValidSlug(slug)).toBe(false));

  it('assertValidSlug throws with a useful message', () => {
    expect(() => assertValidSlug('Cilt Bakımı', 'services/x.mdx')).toThrow(
      /services\/x\.mdx/,
    );
  });
});

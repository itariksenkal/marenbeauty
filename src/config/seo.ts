import { site } from '@/config/site';

/**
 * Titles and descriptions for the routes that do not get them from content.
 *
 * Rules from docs/SEO.md §1, and they are enforced by test rather than by
 * review: title ≤ 60 characters INCLUDING the `| Maren Beauty` suffix the
 * template adds, description 150–165 characters. A title that overruns is
 * truncated in a result page, which is the one place the brand name has to
 * survive.
 *
 * Descriptions are written for a person deciding whether to click, not for a
 * crawler. None of them claims anything the site does not: no hours, no
 * ratings, no "Konya'nın en iyi…" (which the guard would block anyway).
 */

/** What the template appends. Counted against the 60-character budget. */
export const TITLE_SUFFIX = ` | ${site.name}`;

export type RouteSeo = {
  readonly title: string;
  readonly description: string;
};

export const routeSeo = {
  home: {
    /** No suffix on the home page — the template is not applied there. */
    title: 'Maren Beauty — Konya Selçuklu Güzellik Merkezi',
    description:
      'Konya Selçuklu’da açılacak butik güzellik merkezi. Cilt bakımı, epilasyon, cilt yenileme ve kaş & kirpik uygulamaları. Sakin, ölçülü, acelesi olmayan bir yaklaşım.',
  },
  services: {
    title: 'Hizmetlerimiz',
    description:
      'Maren Beauty’de sunulan yirmi uygulama, beş grup hâlinde: cilt bakımı, epilasyon, cilt yenileme, kaş & kirpik ve özel paketler. Hangisi size uygun, birlikte bakalım.',
  },
  about: {
    title: 'Hakkımızda',
    description:
      'Maren adının nereden geldiği, merkezde nasıl çalıştığımız ve bu sitede bilerek yazmadığımız şeyler: fiyat, öncesi–sonrası görseli, süre ve uydurma sayı.',
  },
  blog: {
    title: 'Blog',
    description:
      'Cilt bakımı, epilasyon ve cilt yenileme üzerine sade yazılar. Reçete değil, genel bilgi: bir uygulamanın ne olduğunu ve nasıl düşünmek gerektiğini anlatıyoruz.',
  },
  gallery: {
    title: 'Galeri',
    description:
      'Maren Beauty’nin renk ve ışık dili: sıcak ton, yumuşak ışık, sade yüzeyler. Fotoğraflar merkeze ait değil — merkez açıldığında yerlerini kendi görsellerimiz alacak.',
  },
  faq: {
    title: 'Sık Sorulan Sorular',
    description:
      'Açılış, randevu, fiyat, konum ve uygulamalar hakkında en çok sorulan sorular. Cevabı henüz belli olmayan sorular da olduğu gibi yazıldı; hiçbiri tahmin edilmedi.',
  },
  contact: {
    title: 'İletişim',
    description:
      'Konya Selçuklu. Sorularınızı formdan iletebilir, WhatsApp’tan yazabilir ya da telefonla arayabilirsiniz. Mesajınız merkeze ulaşır ve açılışla birlikte yanıtlanır.',
  },
  licences: {
    title: 'Lisanslar ve atıflar',
    description:
      'Bu sitede kullanılan açık kaynak paketlerin lisansları ve gereken atıflar. Liste elle yazılmaz; bağımlılık ağacından üretilir ve denetimle güncel tutulur.',
  },
} as const satisfies Record<string, RouteSeo>;

/** `Blog — Sayfa 2` and the category equivalents, built rather than listed. */
export function pagedTitle(base: string, page: number): string {
  return `${base} — Sayfa ${page}`;
}

/** Every canonical is absolute and points at production (docs/SEO.md §1). */
export function absoluteUrl(path: string): string {
  if (path === '/') return site.url;
  return `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
}

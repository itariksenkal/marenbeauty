/**
 * `/galeri` — the visual language, honestly labelled.
 *
 * ⚠️ THE HARD PART OF THIS PAGE IS THE FIRST PARAGRAPH. A gallery on a beauty
 * centre's site is read as "photographs of this place". None of these are: the
 * centre has not opened and has never been photographed. Presenting stock as
 * the venue would be a claim made in pictures rather than words, which
 * `CLAUDE.md` §8 exists to prevent, and it is the single easiest way for this
 * site to become dishonest.
 *
 * So the page says what it is, in its own lead, above the images — not in a
 * footnote. When the real shoot happens, this copy changes and
 * `src/config/images.ts` is regenerated; the page itself does not.
 *
 * No photographer attribution is rendered — neither licence requires it
 * (docs/OPEN-QUESTIONS.md G30). The lead below is NOT attribution and must not
 * be removed with it: it is the sentence that stops stock reading as the venue.
 */
export const galleryPage = {
  eyebrow: 'Galeri',
  headingLines: ['Görsel dil,', 'mekân değil.'],

  /**
   * States the thing a visitor would otherwise assume. First sentence, not a
   * disclaimer at the bottom.
   */
  lead: 'Aşağıdaki fotoğraflar merkeze ait değil. Merkez henüz açılmadı ve fotoğraflanmadı. Bunlar, sitenin renk ve ışık dilini anlatan seçilmiş görseller — açılıştan sonra yerlerini merkezin kendi fotoğrafları alacak.',

  /** Why these and not others. Explains the taste, without claiming anything. */
  note: 'Seçim tek bir çerçevede kaldı: sıcak ton, yumuşak ışık, sade yüzeyler. Soğuk tonlar, klinik beyaz ve kameraya bakan portreler bilerek dışarıda bırakıldı.',

  sections: [
    {
      id: 'mekan',
      heading: 'Mekân ve ışık',
      body: 'İç mekân, doku ve gün ışığı.',
      group: 'page',
    },
    {
      id: 'detaylar',
      heading: 'Detaylar',
      body: 'Yüzeyler, nesneler ve eller.',
      group: 'gallery',
    },
    {
      id: 'uygulamalar',
      heading: 'Uygulama başlıkları',
      body: 'Her hizmet sayfasının kendi görseli.',
      group: 'service',
    },
    {
      id: 'yazilar',
      heading: 'Blog başlıkları',
      body: 'Her kategori için bir görsel.',
      group: 'blog',
    },
  ],
} as const;

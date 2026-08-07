/**
 * Home page copy — the pinned opening.
 *
 * ⚠️ PLACEHOLDER, PENDING THE OWNER'S APPROVAL (docs/OPEN-QUESTIONS.md C10).
 *
 * Every line here is real Turkish, written to the tone in `docs/BRIEF.md` §5,
 * and **states no fact about the business that is not already confirmed**.
 * There is nothing here about the team, the room, the services, how long
 * anything takes, or when the centre opens beyond "yakında" — because none of
 * that is known, and the pinned opening is the last place to start inventing.
 *
 * What it does say is limited to:
 *   - the brand name and where it comes from (docs/BRIEF.md §2);
 *   - the category, which is confirmed;
 *   - that it is not open yet.
 *
 * The district is deliberately NOT here any more. It was the whole of the
 * opening line and it is already on every page — the header, the footer
 * paragraph and the location card all carry it, each interpolated from
 * `site.address`. The first screen now carries a slogan instead.
 *
 * Replacing it is an edit to this file. No component contains a sentence.
 *
 * `storyLines` is an ARRAY OF AUTHORED LINES, one per visual line. Lines are
 * never measured or split at runtime (docs/MOTION.md §3.3) — check them at
 * 320px, 768px and 1440px after any edit.
 */
export const home = {
  /**
   * Stage 1, beneath the oversized wordmark. One line, and it should stay one
   * line: it sits under a 240px word.
   *
   * A SLOGAN, not a description. This used to read
   * "Konya Selçuklu’de güzellik merkezi." — accurate, and the same sentence the
   * header, the footer and the location card already carry. The first screen is
   * the one place that can say what the brand is FOR rather than where it is,
   * so the locality now does its work lower down (the footer paragraph and the
   * location card), where a test still pins it.
   *
   * It claims nothing. "Unhurried" is a description of how a visit feels, which
   * is what `CLAUDE.md` §9 asks copy to describe, and it is the one thing about
   * this business that is already true before it opens.
   */
  slogan: 'Güzelliğin acelesi yok.',

  /**
   * Stage 3. Revealed line by line, driven by scroll position rather than a
   * timer, so the reader sets the pace.
   */
  storyLines: [
    'Maren, denizle akraba bir isim.',
    'Sakin, ölçülü, acelesi olmayan bir yaklaşım.',
    'Yakında kapılarımızı açıyoruz.',
  ],

  /** Stage 4. Alt text for the venue image, which does not exist yet. */
  venueImageAlt: 'Merkezin iç mekânından bir görünüm.',

  /**
   * Section headings and calls to action for the rest of the home page.
   * Headings and labels only — nothing here asserts anything about how the
   * centre operates.
   */
  sections: {
    servicesEyebrow: 'Hizmetler',
    servicesHeadingLines: ['Cilde göre', 'seçilmiş uygulamalar.'],
    servicesLink: 'Tüm hizmetleri görün',

    blogEyebrow: 'Blog',
    blogHeading: 'Yazılar',
    blogLink: 'Tüm yazıları görün',

    experienceEyebrow: 'Bir ziyaret',
    experienceHeading: 'Nasıl ilerliyor',

    locationEyebrow: 'Konum',
    locationHeading: 'Nerede',
    locationHoursHeading: 'Çalışma saatleri',
    /**
     * The hours are not confirmed (docs/OPEN-QUESTIONS.md C12), so the page
     * says so rather than presenting them as settled. Removed when the owner
     * confirms them and `site.isPreLaunch` flips.
     */
    locationHoursNote:
      'Planlanan saatler. Açılışla birlikte kesinleşecek ve burada güncellenecek.',
    locationClosed: 'Kapalı',

    contactEyebrow: 'İletişim',
    contactHeadingLines: ['Bir mesaj yeterli.'],
    contactBody: 'Sorularınızı yazın; açılışla birlikte size dönüş yapacağız.',
    contactFormCta: 'Mesaj gönderin',
    contactWhatsappCta: "WhatsApp'tan yazın",
    contactPhoneCta: 'Telefonla arayın',
  },

  /**
   * The pre-launch band. An honest sentence and nothing more — no countdown,
   * no date, because there is no confirmed date (CLAUDE.md §10).
   */
  preLaunchNotice: 'Yakında Konya Selçuklu’da açılıyoruz.',

  /**
   * Names the pre-launch band as a landmark. Without it the band is content
   * outside every region — invisible to landmark navigation, and the one
   * sentence that explains why nothing on the site can be booked.
   */
  preLaunchLabel: 'Açılış durumu',

  /**
   * Flips to `true` when the owner has approved the wording. Until then the
   * copy is provisional and `docs/OPEN-QUESTIONS.md` C10 stays open.
   */
  copyApproved: false,
} as const;

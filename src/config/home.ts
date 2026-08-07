import { site } from '@/config/site';

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
 *   - the district, taken from `site.address` so the two cannot drift;
 *   - that it is not open yet.
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
   * The locality is interpolated from `site.address` rather than retyped. A
   * test asserts it still appears, so moving the centre cannot leave a stale
   * district on the first screen anyone sees.
   */
  positioningLine: `${site.address.region} ${site.address.locality}’de güzellik merkezi.`,

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

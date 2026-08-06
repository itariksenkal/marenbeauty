/**
 * What a visit is like — the second and last pinned sequence.
 *
 * ⚠️ **PLACEHOLDER COPY, pending the owner's words** (docs/OPEN-QUESTIONS.md
 * C11). The steps below describe a sequence, not a protocol: arrival,
 * conversation, the session, and what happens after. They were written to the
 * posture in `CLAUDE.md` §9 and state **no fact the business has not
 * confirmed** — no durations, no session counts, no products, no devices, no
 * credentials, no room description, no promise about a result.
 *
 * What they do assert is that the centre talks to you before it starts and
 * tells you what it is doing while it works. That is positioning, which the
 * brief already sets (`docs/BRIEF.md` §5), not an operational claim.
 *
 * The mechanism is unchanged: an EMPTY array renders nothing at all — no
 * heading, no skeleton, no "yakında". Emptying it removes the section with no
 * component edit, and that is still how a fact we do not have is expressed.
 * A test covers both states.
 */
export type ExperienceStep = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export const experience = {
  steps: [
    {
      id: 'karsilama',
      title: 'Karşılama',
      body: 'Kapıdan girdiğinizde acele yok. Oturuyoruz, ne için geldiğinizi ve neyi merak ettiğinizi dinliyoruz. Bu konuşma seansın parçası; öncesinde yapılan bir formalite değil.',
    },
    {
      id: 'birlikte-karar',
      title: 'Birlikte karar',
      body: 'Cildinize birlikte bakıyor, beklentinizi açıkça konuşuyoruz. Hangi uygulamanın size uygun olduğuna burada karar veriyoruz — bir sayfadan ya da bir listeden değil. Uygun olmadığını düşündüğümüz bir uygulamayı önermiyoruz.',
    },
    {
      id: 'seans',
      title: 'Seans',
      body: 'Uygulama sırasında ne yaptığımızı anlatıyoruz. Ne hissedeceğinizi önceden söylüyor, rahatsız olduğunuz an durduruyoruz. Sessiz kalmayı tercih ederseniz o da olur; oda sizin.',
    },
    {
      id: 'sonrasinda',
      title: 'Sonrasında',
      body: 'Seans bittiğinde cildinizin o gün ve sonraki günlerde neye ihtiyaç duyacağını konuşuyoruz. Aklınıza sonradan gelen soruyu yazabileceğiniz bir yer her zaman açık.',
    },
  ] as readonly ExperienceStep[],
} as const;

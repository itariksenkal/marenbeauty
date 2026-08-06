/**
 * Contact channels and social profiles.
 *
 * ⚠️ **EVERY VALUE IN THIS FILE IS A PLACEHOLDER** except the email address,
 * which is the real `info@marenbeauty.com` decided in docs/OPEN-QUESTIONS.md
 * B1. The phone number is `0500 000 00 00` — deliberately not a dialable
 * Turkish number, so it cannot silently look real — and the social handles are
 * the brand name, which is what they will be, on profiles that do not exist
 * yet. Every one of them is listed in `docs/STATUS.md` with the one-line change
 * that replaces it.
 *
 * The mechanism has not changed and must not: a `null` channel renders NOTHING
 * — no button, no icon, no placeholder, no disabled state, no "yakında"
 * tooltip (CLAUDE.md §7). Setting one back to `null` makes it disappear
 * everywhere with no component edit, and that is still how a channel we do not
 * have is expressed.
 *
 * Conversion hierarchy: WhatsApp → phone → form. The social profiles are
 * discovery, not conversion (docs/BRIEF.md §6).
 */
export type ContactChannel = {
  /** The machine value: an E.164 number, an address, a handle, or a URL. */
  readonly value: string;
  /** What a human reads. Never derived from `value` — a number is formatted. */
  readonly label: string;
} | null;

/** Channels a visitor uses to start a conversation. */
export type ConversionChannelKey = 'whatsapp' | 'phone' | 'email';

/** Profiles a visitor uses to look the centre up. */
export type SocialChannelKey =
  'instagram' | 'facebook' | 'tiktok' | 'googleBusiness';

export type ContactChannelKey = ConversionChannelKey | SocialChannelKey;

export const CONVERSION_CHANNELS: readonly ConversionChannelKey[] = [
  'whatsapp',
  'phone',
  'email',
];

export const SOCIAL_CHANNELS: readonly SocialChannelKey[] = [
  'instagram',
  'facebook',
  'tiktok',
  'googleBusiness',
];

/**
 * Typed as `ContactChannel` rather than inferred from the literals, so consuming
 * code stays correctly typed as nullable instead of narrowing and making every
 * guard look like dead code — which is what would happen the moment a value
 * goes back to `null`.
 */
export const contact: Readonly<Record<ContactChannelKey, ContactChannel>> = {
  /** PLACEHOLDER. E.164 for the link, national format for the eye. */
  whatsapp: { value: '+905000000000', label: '0500 000 00 00' },
  /** PLACEHOLDER. Same number; the two are separate keys because they need not be. */
  phone: { value: '+905000000000', label: '0500 000 00 00' },
  /** REAL — the mailbox decided in B1. */
  email: { value: 'info@marenbeauty.com', label: 'info@marenbeauty.com' },

  /** PLACEHOLDER handle. The profile does not exist yet. */
  instagram: { value: '@marenbeauty', label: '@marenbeauty' },
  /** PLACEHOLDER handle. */
  facebook: { value: 'marenbeauty', label: 'Maren Beauty' },
  /** PLACEHOLDER handle. */
  tiktok: { value: '@marenbeauty', label: '@marenbeauty' },
  /**
   * PLACEHOLDER, and deliberately a *working search* rather than a fabricated
   * profile URL. There is no Google Business Profile yet (C1) and a `g.page`
   * link to one that does not exist would 404 on a visitor. This resolves to a
   * real Google Maps search today and becomes the profile URL in one line.
   */
  googleBusiness: {
    value: 'https://www.google.com/maps/search/?api=1&query=Maren+Beauty+Konya',
    label: 'Google',
  },
};

/**
 * The only sanctioned way to turn a channel into an href.
 *
 * Returns `null` — never a bare scheme — so a caller cannot accidentally emit
 * `href="tel:"`. Callers must branch on null and render nothing.
 */
export function channelHref(key: ContactChannelKey): string | null {
  const channel = contact[key];
  if (!channel || channel.value.trim() === '') return null;

  const value = channel.value.trim();
  const digits = value.replace(/[^\d]/g, '');
  const handle = value.replace(/^@/, '');

  switch (key) {
    case 'whatsapp':
      return digits === '' ? null : `https://wa.me/${digits}`;
    case 'phone':
      return `tel:${value.replace(/\s/g, '')}`;
    case 'email':
      return `mailto:${value}`;
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    case 'googleBusiness':
      // Already a URL; anything else would be a guess about its shape.
      return value.startsWith('https://') ? value : null;
  }
}

/**
 * What each channel's link says.
 *
 * Separate from `ContactChannel.label`, which is the value the owner supplies
 * (a number, a handle). These are the ACTIONS, and they are fixed copy — a
 * component may not contain a Turkish sentence (CLAUDE.md §7).
 */
export const channelLabels: Readonly<Record<ContactChannelKey, string>> = {
  whatsapp: "WhatsApp'tan yazın",
  phone: 'Telefonla arayın',
  email: 'E-posta gönderin',
  instagram: "Instagram'da bakın",
  facebook: "Facebook'ta bakın",
  tiktok: "TikTok'ta bakın",
  googleBusiness: "Google'da bulun",
};

/**
 * Accessible names for icon-only links, where the icon carries the brand and
 * the label has to carry the meaning.
 */
export const channelAccessibleNames: Readonly<
  Record<ContactChannelKey, string>
> = {
  whatsapp: 'WhatsApp',
  phone: 'Telefon',
  email: 'E-posta',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  googleBusiness: 'Google',
};

/** True when at least one channel is configured — for "or reach us at" blocks. */
export function hasAnyChannel(): boolean {
  return (Object.keys(contact) as ContactChannelKey[]).some(
    (key) => channelHref(key) !== null,
  );
}

/** Configured social profiles, in display order. Empty renders nothing. */
export function configuredSocials(): readonly {
  readonly key: SocialChannelKey;
  readonly href: string;
  readonly name: string;
  readonly label: string;
}[] {
  return SOCIAL_CHANNELS.flatMap((key) => {
    const href = channelHref(key);
    if (!href) return [];
    return [
      {
        key,
        href,
        name: channelAccessibleNames[key],
        label: contact[key]?.label ?? channelAccessibleNames[key],
      },
    ];
  });
}

/**
 * Contact channels.
 *
 * Every channel is absent until the owner supplies it. A `null` channel renders
 * NOTHING — no button, no icon, no placeholder, no disabled state, no "yakında"
 * tooltip (CLAUDE.md §7). A dead `tel:` is worse than no link at all, and
 * `npm run guard` fails the build if an empty-target link reaches output.
 *
 * Conversion hierarchy once configured: WhatsApp → phone → form. Instagram is
 * discovery, not a conversion channel (docs/BRIEF.md §6).
 */
export type ContactChannel = {
  readonly value: string;
  readonly label: string;
} | null;

export type ContactChannelKey = 'whatsapp' | 'phone' | 'instagram' | 'email';

/**
 * Typed as `ContactChannel` rather than inferred from the literals, so consuming
 * code stays correctly typed as nullable instead of narrowing to `null` and
 * making every guard look like dead code.
 */
export const contact: Readonly<Record<ContactChannelKey, ContactChannel>> = {
  whatsapp: null,
  phone: null,
  instagram: null,
  email: null,
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
  switch (key) {
    case 'whatsapp':
      return `https://wa.me/${value.replace(/[^\d]/g, '')}`;
    case 'phone':
      return `tel:${value.replace(/\s/g, '')}`;
    case 'email':
      return `mailto:${value}`;
    case 'instagram':
      return `https://instagram.com/${value.replace(/^@/, '')}`;
  }
}

/**
 * What each channel's link says.
 *
 * Separate from `ContactChannel.label`, which is the value the owner supplies
 * (a number, a handle). These are the ACTIONS, and they are fixed copy — a
 * component may not contain a Turkish sentence (CLAUDE.md §7).
 *
 * Present for every key even though every channel is currently `null`: the
 * labels are not the thing that is missing. When a channel is configured, its
 * link appears with the right words and no further edit.
 */
export const channelLabels: Readonly<Record<ContactChannelKey, string>> = {
  whatsapp: "WhatsApp'tan yazın",
  phone: 'Telefonla arayın',
  email: 'E-posta gönderin',
  instagram: "Instagram'da bakın",
};

/** True when at least one channel is configured — for "or reach us at" blocks. */
export function hasAnyChannel(): boolean {
  return (Object.keys(contact) as ContactChannelKey[]).some(
    (key) => channelHref(key) !== null,
  );
}

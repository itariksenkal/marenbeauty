import {
  channelHref,
  channelLabels,
  contact,
  type ContactChannelKey,
} from '@/config/contact';

/**
 * Every configured contact channel, in conversion order.
 *
 * Today that is **none**, so this renders nothing at all — no heading, no
 * greyed-out icons, no "yakında" (CLAUDE.md §7). `channelHref` returns
 * `string | null` and never a bare scheme, so `href="tel:"` cannot be emitted
 * even by accident.
 *
 * Every link carries `data-channel`, which is how guard rule 3 tells a dead
 * channel button from an ordinary in-page anchor (CLAUDE.md §12). The attribute
 * is what makes the guard able to fail the build on a broken one, so it is not
 * optional decoration.
 */
const ORDER: readonly ContactChannelKey[] = [
  'whatsapp',
  'phone',
  'email',
  'instagram',
];

export function ContactChannels() {
  const available = ORDER.map((key) => ({
    key,
    href: channelHref(key),
  })).filter((entry): entry is { key: ContactChannelKey; href: string } =>
    Boolean(entry.href),
  );

  if (available.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {available.map(({ key, href }) => (
        <li key={key}>
          <a
            data-channel={key}
            href={href}
            className="inline-block rounded-lg border border-border-strong px-5 py-3 text-sm tracking-wide text-text-accent transition-colors hover:bg-surface-accent"
          >
            {contact[key]?.label ?? channelLabels[key]}
          </a>
        </li>
      ))}
    </ul>
  );
}

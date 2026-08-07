import {
  channelHref,
  channelLabels,
  contact,
  CONVERSION_CHANNELS,
  type ContactChannelKey,
} from '@/config/contact';
import { cn } from '@/lib/cn';

/**
 * The configured contact channels, in conversion order.
 *
 * A channel that is `null` renders nothing at all — no heading, no greyed-out
 * icon, no "yakında" (CLAUDE.md §7). `channelHref` returns `string | null` and
 * never a bare scheme, so `href="tel:"` cannot be emitted even by accident, and
 * with every channel unset this component renders nothing rather than an empty
 * row.
 *
 * Every link carries `data-channel`, which is how guard rule 3 tells a dead
 * channel button from an ordinary in-page anchor (CLAUDE.md §12). The attribute
 * is what makes the guard able to fail the build on a broken one, so it is not
 * optional decoration.
 */
export function ContactChannels({
  keys = CONVERSION_CHANNELS,
  className,
}: {
  keys?: readonly ContactChannelKey[];
  className?: string;
}) {
  const available = keys
    .map((key) => ({ key, href: channelHref(key) }))
    .filter((entry): entry is { key: ContactChannelKey; href: string } =>
      Boolean(entry.href),
    );

  if (available.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-3', className)}>
      {available.map(({ key, href }) => (
        <li key={key}>
          <a
            data-channel={key}
            href={href}
            className="inline-flex flex-col rounded-lg border border-border-strong px-5 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:focus-ring"
          >
            <span className="text-2xs tracking-eyebrow text-text-muted uppercase">
              {channelLabels[key]}
            </span>
            {/*
              text-secondary, NOT text-accent. Rosewood on nude is 4.14:1 —
              under AA — and this component renders inside the nude location
              panel. The accent colour is permitted on ivory, cream and sand
              only (docs/DESIGN-SYSTEM.md §1.4); axe caught it on three pages.
            */}
            <span className="mt-1 text-sm tracking-wide text-text-secondary">
              {contact[key]?.label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

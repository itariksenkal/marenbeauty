import { configuredSocials } from '@/config/contact';
import { cn } from '@/lib/cn';

/**
 * Social profiles, as words rather than logos.
 *
 * Two reasons, and the first is the binding one. `CLAUDE.md` §2 pins Lucide as
 * the only icon set, and Lucide has no TikTok glyph and has been retiring brand
 * marks generally — so an icon row would mean either a second icon set, which
 * is forbidden, or hand-drawn trademarks, which is worse. The second reason is
 * that a typographic brand built on Fraunces and Manrope reads better as words
 * than as a row of borrowed logos.
 *
 * Every link carries `data-channel`, so guard rule 3 fails the build on a dead
 * one (CLAUDE.md §12). A profile that is not configured renders nothing, and
 * with none configured this renders nothing at all rather than an empty row.
 *
 * `rel="me"` states the identity relationship; `noopener` is the safe default
 * for a cross-origin target.
 */
export function SocialLinks({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  const socials = configuredSocials();
  if (socials.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-x-6 gap-y-3', className)}>
      {socials.map((social) => (
        <li key={social.key}>
          <a
            data-channel={social.key}
            href={social.href}
            rel="me noopener noreferrer"
            target="_blank"
            className={cn(
              'text-sm text-text-secondary underline decoration-1 underline-offset-4 transition-colors hover:text-text-accent hover:decoration-2 focus-visible:focus-ring',
              itemClassName,
            )}
          >
            {social.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

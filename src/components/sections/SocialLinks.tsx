import { BrandGlyph } from '@/components/ui/BrandGlyph';
import { configuredFollowChannels } from '@/config/contact';
import { cn } from '@/lib/cn';

/**
 * The follow row: platform glyph plus the name.
 *
 * ⚠️ This used to be words only, and the comment here argued for it: `CLAUDE.md`
 * §2 pins Lucide as the only icon set, Lucide has no TikTok or WhatsApp glyph,
 * so logos meant either a second icon set or hand-drawn trademarks. **The owner
 * asked for the logos on 2026-08-07** (docs/OPEN-QUESTIONS.md G32), so
 * `BrandGlyph` draws simplified monochrome marks locally — no new dependency,
 * no licence question.
 *
 * The NAME IS STILL RENDERED beside each glyph, not replaced by it. An icon-only
 * row would rely on `aria-label` for anyone using a screen reader and on
 * recognition for everyone else, and these are simplified marks rather than the
 * official trademarks — so the word is what actually carries the meaning.
 *
 * WhatsApp appears here but not in `sameAs`: it is a way to reach the centre,
 * not a profile that represents it (`configuredFollowChannels`).
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
  const socials = configuredFollowChannels();
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
              'group inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-accent focus-visible:focus-ring',
              itemClassName,
            )}
          >
            <BrandGlyph channel={social.key} />
            <span className="underline decoration-1 underline-offset-4 group-hover:decoration-2">
              {social.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

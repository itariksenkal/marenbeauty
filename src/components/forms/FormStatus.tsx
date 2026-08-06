import { cn } from '@/lib/cn';

/**
 * The form's live region.
 *
 * `role="status"` with `aria-live="polite"` — announced when the message
 * changes, without interrupting whatever the reader is doing. **Not a toast**
 * (docs/ROADMAP.md M11): a toast disappears, cannot be re-read, and is often
 * missed entirely by anyone using a screen reader or reading slowly.
 *
 * It stays in the DOM at all times, empty when there is nothing to say.
 * Assistive technology only announces changes to a live region that already
 * existed — a region added to the page at the same moment as its message is
 * frequently not announced at all.
 *
 * Tone is carried by an icon and by the text itself, never by colour alone
 * (docs/DESIGN-SYSTEM.md §1.5 rule 7).
 */
export type StatusTone = 'pending' | 'success' | 'error';

const TONE: Record<StatusTone, { className: string; glyph: string }> = {
  pending: { className: 'text-text-secondary', glyph: '…' },
  success: { className: 'text-feedback-success', glyph: '✓' },
  error: { className: 'text-feedback-error', glyph: '✕' },
};

export function FormStatus({
  message,
  tone = 'pending',
  className,
}: {
  message?: string;
  tone?: StatusTone;
  className?: string;
}) {
  const { className: toneClass, glyph } = TONE[tone];

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn('min-h-6 text-sm', message && toneClass, className)}
    >
      {message ? (
        <>
          <span aria-hidden="true">{glyph} </span>
          {message}
        </>
      ) : null}
    </p>
  );
}

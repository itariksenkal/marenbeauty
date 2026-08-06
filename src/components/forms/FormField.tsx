import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Label, hint and error for one control — wired, not decorated.
 *
 * The wiring is the point (CLAUDE.md §16):
 *
 *   - a real `<label htmlFor>`, never a floating placeholder;
 *   - `aria-describedby` listing the hint AND the error, so a screen reader
 *     reads both when focus lands;
 *   - `aria-invalid` on the control, so the error is exposed as state rather
 *     than inferred from a colour;
 *   - the error text carries a `✕` glyph, because colour is never the only
 *     signal (§1.5 rule 7).
 *
 * A Server Component. It renders the wiring and takes the control as a child —
 * the caller owns the input, this owns the relationship between the parts.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the ids it must reference. */
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    required: boolean;
  }) => ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm text-text-primary">
        {label}
      </label>

      {hint ? (
        <p id={hintId} className="text-2xs text-text-muted">
          {hint}
        </p>
      ) : null}

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}

      {error ? (
        <p id={errorId} className="text-sm text-feedback-error">
          <span aria-hidden="true">✕ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The one place input styling is defined.
 *
 * `border-strong` because it is the only border colour clearing 3:1 against
 * every surface — `border-subtle` would make the field invisible to a
 * low-vision reader (docs/DESIGN-SYSTEM.md §1.5 rule 3).
 */
export const fieldClassName =
  'w-full rounded-md border border-border-strong bg-surface-raised px-4 py-3 text-base text-text-primary';

import { site } from '@/config/site';

/**
 * Date helpers.
 *
 * Formatting goes through `Intl` rather than a hardcoded month table, so no
 * Turkish strings live in code (CLAUDE.md §7) and the output follows the
 * locale in `site.ts`.
 */

/** Parse an ISO `YYYY-MM-DD` as UTC midnight, so no timezone shifts the day. */
export function parseIsoDate(iso: string): Date {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: "${iso}". Expected YYYY-MM-DD.`);
  }
  return date;
}

const longFormatter = new Intl.DateTimeFormat(site.locale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** e.g. "6 Ağustos 2026". */
export function formatDateLong(iso: string): string {
  return longFormatter.format(parseIsoDate(iso));
}

/** Newest first. Stable for equal dates via the slug tiebreak at the call site. */
export function compareByDateDesc(a: string, b: string): number {
  return parseIsoDate(b).getTime() - parseIsoDate(a).getTime();
}

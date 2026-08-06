import { testimonials } from '@/config/testimonials';

/**
 * Testimonials.
 *
 * Returns `null` while the list is empty — no heading, no "coming soon", no
 * skeleton, nothing in the DOM at all. The centre has not opened, so there are
 * no clients, so there is no section (CLAUDE.md §9).
 *
 * It exists now so that the day real testimonials arrive, the section appears
 * by adding data rather than by writing a component under time pressure.
 */
export function TestimonialsSection() {
  if (testimonials.length === 0) return null;

  // Intentionally unreachable today. Built at the milestone that has data.
  return null;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose class names, with later Tailwind utilities winning over earlier ones.
 * The only sanctioned way to build conditional classes (CLAUDE.md §14) —
 * string concatenation silently produces `p-4 p-8` and the wrong one wins.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

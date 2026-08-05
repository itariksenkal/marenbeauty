import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the real token values out of src/styles/theme.css at build time.
 *
 * The styleguide must show what the site actually uses. Retyping the hex
 * values here would create a second source of truth that silently drifts the
 * first time a colour changes — which is exactly the failure this page exists
 * to catch.
 */

const THEME_PATH = join(process.cwd(), 'src', 'styles', 'theme.css');

let cache: Map<string, string> | null = null;

/** All `--mb-*: #hex;` primitives declared in theme.css. */
export function primitiveHexMap(): Map<string, string> {
  if (cache) return cache;
  const css = readFileSync(THEME_PATH, 'utf8');
  const map = new Map<string, string>();
  const pattern = /(--mb-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    const [, name, hex] = match;
    if (name && hex) map.set(name, hex.toLowerCase());
  }
  cache = map;
  return map;
}

export function hexOf(primitive: string): string {
  const hex = primitiveHexMap().get(primitive);
  if (!hex) {
    throw new Error(
      `Styleguide: primitive ${primitive} is not declared in theme.css. ` +
        `Either the token was renamed or the styleguide is out of date.`,
    );
  }
  return hex;
}

/** Semantic token → the primitive it resolves to. Mirrors theme.css §semantics. */
export const SEMANTIC_SURFACES = [
  {
    token: '--color-surface-page',
    primitive: '--mb-cream',
    label: 'surface-page',
  },
  {
    token: '--color-surface-raised',
    primitive: '--mb-ivory',
    label: 'surface-raised',
  },
  {
    token: '--color-surface-sunken',
    primitive: '--mb-sand',
    label: 'surface-sunken',
  },
  {
    token: '--color-surface-accent',
    primitive: '--mb-nude',
    label: 'surface-accent',
  },
  {
    token: '--color-surface-decor',
    primitive: '--mb-rose-beige',
    label: 'surface-decor',
  },
  {
    token: '--color-surface-inverse',
    primitive: '--mb-espresso',
    label: 'surface-inverse',
  },
] as const;

export const SEMANTIC_TEXT = [
  {
    token: '--color-text-primary',
    primitive: '--mb-ink',
    label: 'text-primary',
  },
  {
    token: '--color-text-secondary',
    primitive: '--mb-cocoa',
    label: 'text-secondary',
  },
  { token: '--color-text-muted', primitive: '--mb-clay', label: 'text-muted' },
  {
    token: '--color-text-accent',
    primitive: '--mb-rosewood',
    label: 'text-accent',
  },
  {
    token: '--color-text-gold',
    primitive: '--mb-champagne-deep',
    label: 'text-gold',
  },
  {
    token: '--color-text-on-inverse',
    primitive: '--mb-ivory',
    label: 'text-on-inverse',
  },
] as const;

export const FEEDBACK_TEXT = [
  {
    token: '--color-feedback-error',
    primitive: '--mb-error',
    label: 'feedback-error',
  },
  {
    token: '--color-feedback-success',
    primitive: '--mb-success',
    label: 'feedback-success',
  },
  {
    token: '--color-feedback-info',
    primitive: '--mb-info',
    label: 'feedback-info',
  },
] as const;

/** Non-text: borders, focus rings, meaningful icons. Threshold is 3:1. */
export const NON_TEXT = [
  { token: '--color-focus-ring', primitive: '--mb-clay', label: 'focus-ring' },
  {
    token: '--color-border-strong',
    primitive: '--mb-rosewood',
    label: 'border-strong',
  },
  {
    token: '--color-border-decor',
    primitive: '--mb-rose-beige',
    label: 'border-decor',
  },
  {
    token: '--color-border-subtle',
    primitive: '--mb-nude',
    label: 'border-subtle',
  },
  {
    token: '--color-accent-decor',
    primitive: '--mb-champagne',
    label: 'accent-decor',
  },
] as const;

export const PRIMITIVE_GROUPS = [
  {
    name: 'Warm neutrals',
    tokens: ['--mb-ivory', '--mb-cream', '--mb-sand', '--mb-nude'],
  },
  {
    name: 'Rose family',
    tokens: [
      '--mb-rose-beige',
      '--mb-blush',
      '--mb-muted-rose',
      '--mb-rosewood',
    ],
  },
  {
    name: 'Warm darks',
    tokens: ['--mb-clay', '--mb-cocoa', '--mb-espresso', '--mb-ink'],
  },
  {
    name: 'Champagne accent',
    tokens: ['--mb-champagne-light', '--mb-champagne', '--mb-champagne-deep'],
  },
  {
    name: 'Feedback',
    tokens: ['--mb-error', '--mb-success', '--mb-info'],
  },
] as const;

import type { CSSProperties } from 'react';

/**
 * A style object that may also carry CSS custom properties.
 *
 * React accepts `--x` keys at runtime but `CSSProperties` does not type them,
 * which usually gets "solved" with `as any` or an eslint-disable. Both are
 * banned (CLAUDE.md §15, §18.13), and neither is necessary.
 */
export type CssVars = CSSProperties & {
  [key: `--${string}`]: string | number;
};

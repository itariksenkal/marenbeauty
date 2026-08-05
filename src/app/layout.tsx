import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/styles/globals.css';

/**
 * Root layout — M0 foundation only.
 *
 * Fonts (M1), the header/footer shell (M1), site config (M2), the aurora and
 * grain layers (M5) and the full metadata strategy (M13) all land later.
 * Brand name is inlined here only until src/config/site.ts exists at M2;
 * no Turkish copy appears in a component (CLAUDE.md §7).
 */
export const metadata: Metadata = {
  title: 'Maren Beauty',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

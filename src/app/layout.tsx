import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SkipLink } from '@/components/layout/SkipLink';
import { ui } from '@/config/ui';

import { fontVariables } from './fonts';
import '@/styles/globals.css';

/**
 * Root layout — M1. Fonts, tokens and the layout shell.
 * Site config (M2), aurora and grain (M5) and the full metadata strategy
 * (M13) land later.
 */
export const metadata: Metadata = {
  title: ui.brand,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={fontVariables}>
      <body className="min-h-dvh">
        <SkipLink />
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

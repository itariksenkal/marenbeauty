import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { PreLaunchBand } from '@/components/layout/PreLaunchBand';
import { SkipLink } from '@/components/layout/SkipLink';
import { AuroraBackground } from '@/components/motion/AuroraBackground';
import { GrainOverlay } from '@/components/motion/GrainOverlay';
import { MotionTierProvider } from '@/components/motion/MotionTierProvider';
import { motionTierScript } from '@/components/motion/motion-tier-script';
import { mainContentId } from '@/config/navigation';
import { site } from '@/config/site';

import { fontVariables } from './fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: site.name,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      className={fontVariables}
      // The inline script below writes data-motion-tier before hydration, so
      // the client tree legitimately differs from the server tree here.
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        {/*
          Resolves the motion tier BEFORE first paint and writes it to
          <html data-motion-tier>. Synchronous and first in <body> on purpose:
          resolving after hydration would flash animated content before telling
          it not to animate — the same class of bug as the skip link rendering
          in flow before its stylesheet arrived.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: motionTierScript(process.env.NODE_ENV === 'development'),
          }}
        />
        <SkipLink />
        <MotionTierProvider>
          <AuroraBackground />
          <PreLaunchBand />
          <SiteHeader />
          <main id={mainContentId} tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </MotionTierProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  CONVERSION_CHANNELS,
  SOCIAL_CHANNELS,
  type ContactChannelKey,
} from '@/config/contact';
import { useConsent } from '@/lib/analytics/consent';
import { track } from '@/lib/analytics/events';

const isConversion = (key: string): key is ContactChannelKey =>
  (CONVERSION_CHANNELS as readonly string[]).includes(key);

const isSocial = (key: string): key is ContactChannelKey =>
  (SOCIAL_CHANNELS as readonly string[]).includes(key);

/**
 * Site-wide event listeners. Renders nothing.
 *
 * ── WHY ONE DELEGATED LISTENER ───────────────────────────────────────────────
 *
 * Channel links appear in the header, the contact section, the CTA band and the
 * footer, and `CLAUDE.md` §12 already REQUIRES every one of them to carry
 * `data-channel` — that is how guard rule 3 tells a dead channel button from an
 * ordinary anchor. So the attribute is guaranteed present, guaranteed correct,
 * and guaranteed on links that do not exist yet. Listening for it once beats an
 * `onClick` per component, and it cannot drift from the guard.
 *
 * It also means no component has to become a Client Component to be measured,
 * which keeps `CLAUDE.md` §15 intact.
 *
 * ── WHY CONVERSIONS AND PROFILES ARE DIFFERENT EVENTS ────────────────────────
 *
 * docs/BRIEF.md §6 ranks WhatsApp → phone → form as the conversion path and
 * puts Instagram outside it, as discovery. Same attribute, same listener, two
 * events — so profile traffic can never inflate the number advertising spend is
 * judged by.
 */
export function AnalyticsEvents() {
  const pathname = usePathname();
  const { granted } = useConsent();
  const isFirstRender = useRef(true);
  const grantRecorded = useRef(false);

  // The container fires its own page view when it loads, which covers whichever
  // page the visitor consented on. Everything after that is a client-side
  // navigation the container cannot see, so it is pushed by hand — and the
  // first render is skipped so the entry page is not counted twice.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    track({ event: 'sayfa_goruntulendi', sayfa_yolu: pathname });
  }, [pathname]);

  // A refusal is deliberately unmeasurable: recording one would mean processing
  // data from the one visitor who said not to. Only the grant is recorded, once.
  useEffect(() => {
    if (!granted || grantRecorded.current) return;
    grantRecorded.current = true;
    track({ event: 'onay_guncellendi', secim: 'granted' });
  }, [granted]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.('[data-channel]');
      const key = link?.getAttribute('data-channel');
      if (!key) return;

      if (isConversion(key)) {
        track({ event: 'iletisim_baslatildi', kanal: key });
      } else if (isSocial(key)) {
        track({ event: 'sosyal_profil_tiklandi', profil: key });
      }
    }

    // Capture phase, so a handler that stops propagation cannot silence this.
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}

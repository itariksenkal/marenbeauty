import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scanText } from '../../scripts/guard.mjs';
import {
  channelHref,
  configuredSocials,
  contact,
  CONVERSION_CHANNELS,
  SOCIAL_CHANNELS,
  type ContactChannelKey,
} from '@/config/contact';
import { experience } from '@/config/experience';
import { faqPage, generalFaq } from '@/config/faq';
import { home } from '@/config/home';
import { groupedOpeningHours, openingHours, site } from '@/config/site';
import { getAllServices, getEditorialPage } from '@/content-layer';

const ALLOWANCES = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts', 'guard.allow.json'), 'utf8'),
).allow;

const errorsIn = (text: string) =>
  scanText(text, {
    file: 'fixture',
    ext: '.html',
    allowances: ALLOWANCES,
  }).filter((v: { tier: string }) => v.tier === 'error');

const read = (relative: string) =>
  readFileSync(join(process.cwd(), 'src', relative), 'utf8');

/* ── Contact channels ──────────────────────────────────────────────────────── */

describe('contact channels', () => {
  it('covers every key exactly once, split into conversion and social', () => {
    const all = [...CONVERSION_CHANNELS, ...SOCIAL_CHANNELS];
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all)).toEqual(new Set(Object.keys(contact)));
  });

  it('builds a complete href for every configured channel', () => {
    expect(channelHref('whatsapp')).toBe('https://wa.me/905000000000');
    expect(channelHref('phone')).toBe('tel:+905000000000');
    expect(channelHref('email')).toBe('mailto:info@marenbeauty.com');
    expect(channelHref('instagram')).toBe('https://instagram.com/marenbeauty');
    expect(channelHref('facebook')).toBe('https://facebook.com/marenbeauty');
    expect(channelHref('tiktok')).toBe('https://tiktok.com/@marenbeauty');
    expect(channelHref('googleBusiness')).toMatch(
      /^https:\/\/www\.google\.com\//,
    );
  });

  it('never emits a bare scheme, for any key', () => {
    for (const key of Object.keys(contact) as ContactChannelKey[]) {
      expect(channelHref(key), key).not.toMatch(/^(tel|mailto|sms):$/);
      expect(channelHref(key), key).not.toBe('https://wa.me/');
    }
  });

  it('renders all four social profiles', () => {
    expect(configuredSocials().map((s) => s.key)).toEqual([...SOCIAL_CHANNELS]);
  });

  /**
   * The phone number is a placeholder and must stay obviously one. `0500` is
   * not an allocated Turkish mobile prefix, so it cannot be dialled by mistake
   * and cannot be read as a real number the owner forgot to change.
   */
  it('uses a phone number that cannot be mistaken for a real one', () => {
    expect(contact.phone?.label).toBe('0500 000 00 00');
    expect(contact.phone?.value).toBe('+905000000000');
  });

  it('points Google at a search that works, not at a profile that does not exist', () => {
    // A g.page link to a Business Profile that has not been created 404s on a
    // visitor. A search resolves today and becomes the profile URL in one line.
    expect(contact.googleBusiness?.value).not.toMatch(/g\.page|maps\.app/);
    expect(contact.googleBusiness?.value).toContain('/maps/search/');
  });

  it('keeps the data-channel attribute on every channel link', () => {
    expect(read('components/sections/ContactChannels.tsx')).toContain(
      'data-channel={key}',
    );
    expect(read('components/sections/SocialLinks.tsx')).toContain(
      'data-channel={social.key}',
    );
  });
});

/* ── Opening hours ─────────────────────────────────────────────────────────── */

describe('opening hours', () => {
  it('covers all seven days exactly once', () => {
    expect(openingHours).toHaveLength(7);
    expect(new Set(openingHours.map((h) => h.day)).size).toBe(7);
  });

  it('collapses consecutive identical days into ranges', () => {
    const grouped = groupedOpeningHours();
    expect(grouped.map((g) => g.label)).toEqual([
      'Pazartesi – Cuma',
      'Cumartesi',
      'Pazar',
    ]);
    expect(grouped.at(-1)).toEqual({
      label: 'Pazar',
      opens: null,
      closes: null,
    });
  });

  it('labels the hours as provisional while the centre is pre-launch', () => {
    expect(site.isPreLaunch).toBe(true);
    expect(home.sections.locationHoursNote).toMatch(/Planlanan|kesinleşecek/);
    expect(read('components/sections/LocationCard.tsx')).toContain(
      'site.isPreLaunch &&',
    );
  });

  it('embeds no map, so no third-party cookie can be set', () => {
    // The JSX tag, not the word — the component's own comment explains why it
    // is absent, and a check that its explanation trips is a check nobody keeps.
    expect(read('components/sections/LocationCard.tsx')).not.toMatch(
      /<iframe/i,
    );
  });
});

/* ── The visit sequence ────────────────────────────────────────────────────── */

describe('the visit sequence', () => {
  it('has four steps with unique ids', () => {
    expect(experience.steps).toHaveLength(4);
    expect(new Set(experience.steps.map((s) => s.id)).size).toBe(4);
  });

  it('passes the content guard', () => {
    expect(
      errorsIn(experience.steps.map((s) => `${s.title} ${s.body}`).join(' ')),
    ).toEqual([]);
  });

  it('is rendered from one place, pinned and unpinned', () => {
    // Two pages show these steps. If either stopped going through
    // ExperienceSteps the two copies could drift, which is the whole reason
    // the presentational half exists.
    expect(read('components/sections/ExperienceProcess.tsx')).toContain(
      'ExperienceSteps',
    );
    expect(read('app/hakkimizda/page.tsx')).toContain('ExperienceSteps');
  });
});

/* ── /sss ──────────────────────────────────────────────────────────────────── */

describe('the FAQ page', () => {
  it('asks ten general questions, none duplicated', () => {
    expect(generalFaq).toHaveLength(10);
    expect(new Set(generalFaq.map((f) => f.question)).size).toBe(10);
  });

  it('passes the content guard on every question and answer', () => {
    expect(
      errorsIn(generalFaq.map((f) => `${f.question} ${f.answer}`).join(' ')),
    ).toEqual([]);
    expect(errorsIn(JSON.stringify(faqPage))).toEqual([]);
  });

  it('invents no date, duration, price or count', () => {
    const copy = generalFaq.map((f) => f.answer).join(' ');
    expect(copy).not.toMatch(/\d+\s*(dakika|saat|seans|hafta|ay)/i);
    expect(copy).not.toMatch(/\d+\s*(TL|₺|lira)/i);
    expect(copy).not.toMatch(/20\d{2}/);
    expect(copy).not.toMatch(/%\s?\d/);
  });

  it('does not duplicate the per-service questions', () => {
    const serviceQuestions = new Set(
      getAllServices().flatMap((s) => s.faq.map((f) => f.question)),
    );
    expect(serviceQuestions.size).toBeGreaterThan(0);
    for (const item of generalFaq) {
      expect(serviceQuestions.has(item.question), item.question).toBe(false);
    }
  });
});

/* ── /hakkimizda ───────────────────────────────────────────────────────────── */

describe('the about page', () => {
  const page = getEditorialPage('hakkimizda');

  it('passes the content guard', () => {
    expect(errorsIn(page.body)).toEqual([]);
    expect(errorsIn(`${page.title} ${page.summary} ${page.lead}`)).toEqual([]);
  });

  /**
   * The page may tell a reader to see a specialist — that is the disclaimer
   * doing its job. What it may not do is claim one of its own: no team is named
   * publicly yet (CLAUDE.md §9). So the check is for the possessive forms, not
   * for the words.
   */
  it('claims no credential of its own', () => {
    expect(page.body).not.toMatch(
      /(?<![\p{L}\p{N}])(?:dr\.|doktor|hemşire|estetisyen)/iu,
    );
    expect(page.body).not.toMatch(/uzman(?:ımız|larımız|ları?mız)/iu);
    expect(page.body).not.toMatch(/kurucu(?:muz|su)/iu);
    // The referral sentence must survive — it is the reason the words appear.
    expect(page.body).toContain('ilgili uzmana danışmanız');
  });

  it('states no price, duration, count or percentage', () => {
    expect(page.body).not.toMatch(/\d+\s*(dakika|saat|seans|hafta|ay)/i);
    expect(page.body).not.toMatch(/\d+\s*(TL|₺|lira)/i);
    expect(page.body).not.toMatch(/%\s?\d/);
  });

  it('says the centre is a beauty centre and not a health institution', () => {
    expect(page.body).toContain('güzellik merkezidir');
    expect(page.body).toContain('sağlık kuruluşu değildir');
  });
});

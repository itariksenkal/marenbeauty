import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { contrastRatio, wcagLevel } from '@/lib/contrast';

import {
  FEEDBACK_TEXT,
  NON_TEXT,
  PRIMITIVE_GROUPS,
  SEMANTIC_SURFACES,
  SEMANTIC_TEXT,
  hexOf,
} from './tokens';

/**
 * Design system review surface. Development only — returns 404 in production
 * and is noindex regardless.
 *
 * Labels here are English because this is a developer/owner tool, not a page
 * of the site. The Turkish text is specimen content: it is the point, because
 * a type scale that has not been seen set in Turkish has not been reviewed.
 */
export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false, nocache: true },
};

const IS_DEV = process.env.NODE_ENV === 'development';

/* Turkish pangram-ish specimen: every diacritic the language needs. */
const SPECIMEN = 'Pijamalı hasta yağız şoföre çabucak güvendi.';
const GLYPHS = 'ı İ ş Ş ğ Ğ ü Ü ö Ö ç Ç';

const TYPE_SCALE = [
  { token: 'text-hero', cls: 'text-hero', note: 'the word "Maren" only' },
  { token: 'text-6xl', cls: 'text-6xl', note: 'statement lines' },
  { token: 'text-5xl', cls: 'text-5xl', note: 'h1' },
  { token: 'text-4xl', cls: 'text-4xl', note: 'h2, section heads' },
  { token: 'text-3xl', cls: 'text-3xl', note: 'h3' },
  { token: 'text-2xl', cls: 'text-2xl', note: 'h4, card titles' },
  { token: 'text-xl', cls: 'text-xl', note: 'h5, large lead' },
  { token: 'text-lg', cls: 'text-lg', note: 'lead paragraph' },
  { token: 'text-base', cls: 'text-base', note: 'body' },
  { token: 'text-sm', cls: 'text-sm', note: 'labels, form hints' },
  { token: 'text-xs', cls: 'text-xs', note: 'captions, meta' },
  { token: 'text-2xs', cls: 'text-2xs', note: 'legal fine print' },
] as const;

const SPACING = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
  '16',
  '20',
  '24',
  '32',
  '40',
  '48',
] as const;

const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'panel', 'full'] as const;
const SHADOWS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const MOTION = [
  ['--duration-instant', '0ms', 'reduced-motion resolution'],
  ['--duration-fast', '140ms', 'hover, focus'],
  ['--duration-base', '220ms', 'default transition'],
  ['--duration-slow', '320ms', 'reveals, panel entry'],
  ['--duration-slowest', '400ms', 'HARD CEILING'],
  ['--duration-settle', '200ms', 'scroll-linked smoothing max'],
  ['--ease-standard', 'cubic-bezier(.2,.6,.2,1)', 'general'],
  ['--ease-entrance', 'cubic-bezier(.16,1,.3,1)', 'arriving'],
  ['--ease-exit', 'cubic-bezier(.4,0,1,1)', 'leaving'],
  ['--ease-water', 'cubic-bezier(.33,.9,.28,1)', 'signature'],
  ['--stagger-line', '60ms', 'line-by-line reveal'],
  ['--stagger-cap', '6', 'max staggered items'],
] as const;

function Ratio({
  fg,
  bg,
  threshold,
}: {
  fg: string;
  bg: string;
  threshold: number;
}) {
  const ratio = contrastRatio(fg, bg);
  const passes = ratio >= threshold;
  const level = wcagLevel(ratio);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-medium tabular-nums">{ratio.toFixed(2)}</span>
      <span
        className={
          passes
            ? 'text-xs text-feedback-success'
            : 'text-xs font-semibold text-feedback-error'
        }
      >
        {passes ? level : 'FAIL'}
      </span>
    </span>
  );
}

function Heading({ children, id }: { children: string; id: string }) {
  return (
    <h2
      id={id}
      className="mb-6 font-display text-3xl tracking-display text-text-primary"
    >
      {children}
    </h2>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mb-8 max-w-lead text-sm text-text-muted">{children}</p>;
}

export default function StyleguidePage() {
  if (!IS_DEV) notFound();

  return (
    <>
      <Section tone="raised" rhythm="tight">
        <Container>
          <p className="mb-2 text-xs tracking-eyebrow text-text-accent uppercase">
            Development only · noindex · 404 in production
          </p>
          <h1 className="font-display text-5xl tracking-display text-text-primary">
            Design system
          </h1>
          <p className="mt-4 max-w-lead text-lg text-text-secondary">
            Every value below is read from{' '}
            <code className="text-text-accent">src/styles/theme.css</code> at
            build time and every contrast ratio is computed, not transcribed. If
            a token changes, this page changes with it.
          </p>
        </Container>
      </Section>

      {/* ── Turkish glyphs — the F1 gate, seen ─────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="glyphs">1 · Turkish glyphs</Heading>
          <Note>
            The F1 gate (<code>npm run fonts</code>) proves these codepoints
            exist in the shipped <code>.woff2</code> cmap. This is the visual
            half: check that <strong>ı</strong> has no dot, <strong>İ</strong>{' '}
            has one, and that no glyph is a different weight or width from its
            neighbours — that would mean a fallback family is being substituted.
          </Note>

          <div className="space-y-8">
            {(
              [
                ['Fraunces — display', 'font-display'],
                ['Manrope — text', 'font-sans'],
              ] as const
            ).map(([label, family]) => (
              <div
                key={label}
                className="rounded-xl border border-border-subtle bg-surface-raised p-6"
              >
                <p className="mb-4 text-xs tracking-eyebrow text-text-muted uppercase">
                  {label}
                </p>
                <p className={`${family} text-6xl text-text-primary`}>
                  {GLYPHS}
                </p>
                <p className={`${family} mt-4 text-2xl text-text-primary`}>
                  {GLYPHS}
                </p>
                <p className={`${family} mt-4 text-base text-text-primary`}>
                  {GLYPHS} — {SPECIMEN}
                </p>
                <p className={`${family} mt-2 text-sm text-text-muted`}>
                  Iıİi · yığın · şeftali · ağırlık · gözenek · çilek
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Primitives ──────────────────────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="primitives">2 · Primitives</Heading>
          <Note>
            Reference only. These generate <strong>no utilities</strong> — there
            is no <code>bg-ivory</code> class — so a component cannot reach past
            the semantic layer.
          </Note>

          <div className="space-y-8">
            {PRIMITIVE_GROUPS.map((group) => (
              <div key={group.name}>
                <p className="mb-3 text-xs tracking-eyebrow text-text-muted uppercase">
                  {group.name}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {group.tokens.map((token) => (
                    <div key={token}>
                      <div
                        className="h-20 rounded-lg border border-border-subtle"
                        style={{ backgroundColor: `var(${token})` }}
                      />
                      <p className="mt-2 text-xs text-text-primary">
                        {token.replace('--mb-', '')}
                      </p>
                      <p className="text-2xs text-text-muted uppercase">
                        {hexOf(token)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Text contrast ───────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="text-contrast">3 · Text on surfaces</Heading>
          <Note>
            Body text needs <strong>4.5:1</strong>. Anything below that is only
            usable at ≥24px, and anything below 3:1 is unusable at any size.
            Cells are rendered in the real pairing — read them, do not just read
            the number.
          </Note>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border-decor p-3 text-left text-text-muted">
                    text ↓ / surface →
                  </th>
                  {SEMANTIC_SURFACES.map((s) => (
                    <th
                      key={s.token}
                      className="border-b border-border-decor p-3 text-left text-text-muted"
                    >
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...SEMANTIC_TEXT, ...FEEDBACK_TEXT].map((t) => (
                  <tr key={t.token}>
                    <td className="border-b border-border-subtle p-3 whitespace-nowrap text-text-primary">
                      {t.label}
                    </td>
                    {SEMANTIC_SURFACES.map((s) => (
                      <td
                        key={s.token}
                        className="border-b border-border-subtle p-3"
                        style={{ backgroundColor: `var(${s.token})` }}
                      >
                        <span
                          className="block text-base"
                          style={{ color: `var(${t.token})` }}
                        >
                          Aa ığş
                        </span>
                        <Ratio
                          fg={hexOf(t.primitive)}
                          bg={hexOf(s.primitive)}
                          threshold={4.5}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* ── Non-text contrast ───────────────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="non-text">4 · Borders, focus, icons</Heading>
          <Note>
            Threshold is <strong>3:1</strong>. Note that{' '}
            <code>border-subtle</code>, <code>border-decor</code> and{' '}
            <code>accent-decor</code> fail deliberately — they are decorative
            dividers. A control boundary must use <code>border-strong</code>, or
            the field is invisible to low-vision users.
          </Note>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border-decor p-3 text-left text-text-muted">
                    colour ↓ / surface →
                  </th>
                  {SEMANTIC_SURFACES.slice(0, 5).map((s) => (
                    <th
                      key={s.token}
                      className="border-b border-border-decor p-3 text-left text-text-muted"
                    >
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NON_TEXT.map((n) => (
                  <tr key={n.token}>
                    <td className="border-b border-border-subtle p-3 whitespace-nowrap text-text-primary">
                      {n.label}
                    </td>
                    {SEMANTIC_SURFACES.slice(0, 5).map((s) => (
                      <td
                        key={s.token}
                        className="border-b border-border-subtle p-3"
                        style={{ backgroundColor: `var(${s.token})` }}
                      >
                        <span
                          className="mb-2 block h-6 w-16 rounded-sm border-2"
                          style={{ borderColor: `var(${n.token})` }}
                        />
                        <Ratio
                          fg={hexOf(n.primitive)}
                          bg={hexOf(s.primitive)}
                          threshold={3}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* ── Type scale ──────────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="type">5 · Type scale</Heading>
          <Note>
            Fluid via <code>clamp()</code> — resize the window and watch these
            move. Display sizes are set in Fraunces, body in Manrope, all in
            Turkish.
          </Note>

          <div className="space-y-6">
            {TYPE_SCALE.map((t) => {
              const isDisplay = [
                'text-hero',
                'text-6xl',
                'text-5xl',
                'text-4xl',
                'text-3xl',
              ].includes(t.token);
              return (
                <div
                  key={t.token}
                  className="border-b border-border-subtle pb-6 last:border-0"
                >
                  <div className="mb-2 flex flex-wrap items-baseline gap-3">
                    <code className="text-xs text-text-accent">{t.token}</code>
                    <span className="text-2xs text-text-muted">{t.note}</span>
                  </div>
                  <p
                    className={`${t.cls} ${isDisplay ? 'max-w-display font-display tracking-display' : 'max-w-reading font-sans'} text-text-primary`}
                  >
                    {t.token === 'text-hero' ? 'Maren' : SPECIMEN}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ── Spacing ─────────────────────────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="spacing">6 · Spacing</Heading>
          <Note>
            4px base. Tailwind&apos;s dynamic scale is disabled, so only these
            steps exist — <code>p-7</code> and <code>p-13</code> do not compile.
          </Note>

          <div className="space-y-2">
            {SPACING.map((step) => (
              <div key={step} className="flex items-center gap-4">
                <code className="w-16 shrink-0 text-xs text-text-accent">
                  {step}
                </code>
                <span
                  className="block h-4 rounded-xs bg-accent-solid"
                  style={{ width: `var(--spacing-${step})` }}
                />
              </div>
            ))}
            <div className="mt-6 space-y-2 border-t border-border-subtle pt-6">
              {(['gutter', 'section-y-tight', 'section-y'] as const).map(
                (step) => (
                  <div key={step} className="flex items-center gap-4">
                    <code className="w-16 shrink-0 text-xs text-text-accent">
                      {step}
                    </code>
                    <span
                      className="block h-4 rounded-xs bg-surface-decor"
                      style={{ width: `var(--spacing-${step})` }}
                    />
                    <span className="text-2xs text-text-muted">fluid</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Radii & shadows ─────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="radii">7 · Radii and shadows</Heading>
          <Note>
            Shadows are tinted with espresso, never neutral black — a cool
            shadow breaks the palette immediately. <code>shadow-panel</code>{' '}
            casts upward; it is what separates a sticky panel from the one
            beneath it.
          </Note>

          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {RADII.map((r) => (
              <div key={r}>
                <div
                  className="h-20 border border-border-strong bg-surface-accent"
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <p className="mt-2 text-xs text-text-primary">rounded-{r}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {SHADOWS.map((s) => (
              <div key={s}>
                <div
                  className="h-24 rounded-xl bg-surface-raised"
                  style={{ boxShadow: `var(--shadow-${s})` }}
                />
                <p className="mt-3 text-xs text-text-primary">shadow-{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-t-panel bg-surface-raised p-8 shadow-panel">
            <p className="text-sm text-text-secondary">
              <code>rounded-t-panel</code> + <code>shadow-panel</code> — the
              sticky service panel treatment (40px top radius, upward shadow).
            </p>
          </div>
        </Container>
      </Section>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="controls">8 · Controls</Heading>
          <Note>
            <strong>Specimens, not primitives.</strong> The real{' '}
            <code>components/ui/</code> primitives arrive with shadcn at a later
            milestone and must match what is shown here. Tab through them —
            every focus state uses the one focus-ring token.
          </Note>

          <div className="space-y-10">
            <div>
              <p className="mb-4 text-xs tracking-eyebrow text-text-muted uppercase">
                Buttons
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent transition-colors hover:bg-accent-solid-hover"
                >
                  Randevu için yazın
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border-strong px-6 py-3 text-sm tracking-wide text-text-accent transition-colors hover:bg-surface-accent"
                >
                  Hizmetleri inceleyin
                </button>
                <button
                  type="button"
                  className="rounded-lg px-6 py-3 text-sm tracking-wide text-text-secondary transition-colors hover:bg-surface-accent"
                >
                  Ghost
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent opacity-40"
                >
                  Disabled
                </button>
                <a
                  href="#controls"
                  className="text-sm text-text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Prose link
                </a>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:max-w-page">
              <div>
                <label
                  htmlFor="sg-default"
                  className="mb-2 block text-sm text-text-secondary"
                >
                  Adınız
                </label>
                <input
                  id="sg-default"
                  type="text"
                  placeholder="Ayşe Yılmaz"
                  className="w-full rounded-md border border-border-strong bg-surface-raised px-4 py-3 text-base text-text-primary placeholder:text-text-muted"
                />
                <p className="mt-2 text-xs text-text-muted">
                  Default — border uses <code>border-strong</code> (3:1).
                </p>
              </div>

              <div>
                <label
                  htmlFor="sg-error"
                  className="mb-2 block text-sm text-text-secondary"
                >
                  E-posta
                </label>
                <input
                  id="sg-error"
                  type="email"
                  defaultValue="ayse@"
                  aria-invalid
                  aria-describedby="sg-error-msg"
                  className="w-full rounded-md border-2 border-feedback-error bg-surface-raised px-4 py-3 text-base text-text-primary"
                />
                <p
                  id="sg-error-msg"
                  className="mt-2 flex items-center gap-2 text-xs text-feedback-error"
                >
                  <span aria-hidden="true">⚠</span>
                  Geçerli bir e-posta adresi yazın.
                </p>
              </div>

              <div>
                <label
                  htmlFor="sg-textarea"
                  className="mb-2 block text-sm text-text-secondary"
                >
                  Mesajınız
                </label>
                <textarea
                  id="sg-textarea"
                  rows={3}
                  className="w-full rounded-md border border-border-strong bg-surface-raised px-4 py-3 text-base text-text-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="sg-disabled"
                  className="mb-2 block text-sm text-text-muted"
                >
                  Telefon (disabled)
                </label>
                <input
                  id="sg-disabled"
                  type="tel"
                  disabled
                  placeholder="—"
                  className="w-full rounded-md border border-border-subtle bg-surface-sunken px-4 py-3 text-base text-text-muted"
                />
                <div className="mt-4 flex items-start gap-3">
                  <input
                    id="sg-check"
                    type="checkbox"
                    className="mt-1 size-4 rounded-xs border border-border-strong"
                  />
                  <label
                    htmlFor="sg-check"
                    className="text-sm text-text-secondary"
                  >
                    Aydınlatma metnini okudum.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {FEEDBACK_TEXT.map((f) => (
                <p
                  key={f.token}
                  className="rounded-md bg-surface-page px-4 py-3 text-sm"
                  style={{ color: `var(${f.token})` }}
                >
                  {f.label} — {hexOf(f.primitive)}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Motion ──────────────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="motion">9 · Motion tokens</Heading>
          <Note>
            Values only — the five signature interactions are built at M5–M8.
            Nothing discrete may exceed <strong>400ms</strong>.
          </Note>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <tbody>
                {MOTION.map(([token, value, note]) => (
                  <tr key={token}>
                    <td className="border-b border-border-subtle p-3">
                      <code className="text-text-accent">{token}</code>
                    </td>
                    <td className="border-b border-border-subtle p-3 text-text-primary tabular-nums">
                      {value}
                    </td>
                    <td className="border-b border-border-subtle p-3 text-text-muted">
                      {note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ImageReveal } from '@/components/motion/ImageReveal';
import { MotionTierProvider } from '@/components/motion/MotionTierProvider';
import { PinnedSequence } from '@/components/motion/PinnedSequence';
import {
  StickyPanel,
  StickyPanelStack,
} from '@/components/motion/StickyPanelStack';
import {
  TEXT_REVEAL_BUDGET_MS,
  TextReveal,
} from '@/components/motion/TextReveal';
import { ViewTransitionLink } from '@/components/motion/ViewTransitionLink';
import { durations, stagger, transforms } from '@/config/motion';
import type { MotionTier } from '@/hooks/use-motion-tier';
import type { CssVars } from '@/lib/css-vars';

/**
 * Motion review surface. Development only — 404s in production, noindex
 * regardless, and covered by the `development` Playwright project so it cannot
 * quietly break (docs/OPEN-QUESTIONS.md G13).
 *
 * This is a REVIEW surface, not a smoke test. The point is to judge the rose
 * balance and the grain weight on screen, at the values that actually ship —
 * the specimens reuse the same tile, the same opacity and the same blur as the
 * live layers.
 */
export const metadata: Metadata = {
  title: 'Motion',
  robots: { index: false, follow: false, nocache: true },
};

const IS_DEV = process.env.NODE_ENV === 'development';

const STORY_LINES = [
  'Maren, denizle akraba bir isim.',
  'Sakin, sürekli, aceleye yer bırakmayan.',
  'Konya Selçuklu’da, tek kişilik bir oda.',
];

const TIERS: readonly { tier: MotionTier; label: string; note: string }[] = [
  {
    tier: 'full',
    label: 'full',
    note: 'Everything on. Scroll-linked aurora, pinning, reveals, view transitions.',
  },
  {
    tier: 'reduced',
    label: 'reduced',
    note: 'prefers-reduced-motion. Final state immediately. Aurora frozen. Grain stays — it is texture, not motion.',
  },
  {
    tier: 'static',
    label: 'static',
    note: 'Low-end or data-saving. Aurora becomes a flat gradient, no blur, no compositing layers. Grain dropped.',
  },
];

/** Bounded aurora specimen at a fixed scroll position, for side-by-side review. */
function AuroraSpecimen({
  label,
  a,
  b,
  offset,
}: {
  label: string;
  a: string;
  b: string;
  offset: number;
}) {
  const style: CssVars = { '--aurora-b': a, '--aurora-c': b };
  return (
    <figure>
      <div
        className="aurora-specimen h-48 rounded-xl border border-border-subtle"
        style={style}
      >
        <span
          style={{
            background:
              'radial-gradient(circle, var(--aurora-b), transparent 70%)',
            top: `${-20 + offset * 30}%`,
            left: `${-15 + offset * 20}%`,
          }}
        />
        <span
          style={{
            background:
              'radial-gradient(circle, var(--aurora-c), transparent 70%)',
            top: `${40 - offset * 35}%`,
            right: `${-20 + offset * 25}%`,
          }}
        />
      </div>
      <figcaption className="mt-2 text-xs text-text-muted">{label}</figcaption>
    </figure>
  );
}

function Heading({ children, id }: { children: string; id: string }) {
  return (
    <h2
      id={id}
      className="mb-3 font-display text-3xl tracking-display text-text-primary"
    >
      {children}
    </h2>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mb-8 max-w-lead text-sm text-text-muted">{children}</p>;
}

/** Stands in for photography, which arrives after the venue opens. */
function ImageStandIn({ tint }: { tint?: boolean }) {
  return (
    <div
      className={`flex h-40 w-full items-center justify-center ${
        tint ? 'bg-surface-decor' : 'bg-surface-accent'
      }`}
    >
      <span className="text-xs tracking-eyebrow text-text-secondary uppercase">
        görsel
      </span>
    </div>
  );
}

export default function MotionPage() {
  if (!IS_DEV) notFound();

  return (
    <>
      <Section tone="raised" rhythm="tight">
        <Container>
          <p className="mb-2 text-xs tracking-eyebrow text-text-accent uppercase">
            Development only · noindex · 404 in production
          </p>
          <h1 className="font-display text-5xl tracking-display text-text-primary">
            Motion &amp; surface
          </h1>
          <p className="mt-4 max-w-lead text-lg text-text-secondary">
            The live aurora is behind this page and the grain is over it, both
            at shipping values. Scroll to judge the wash; the specimens below
            let you compare without scrolling.
          </p>
          <p className="mt-4 max-w-lead text-sm text-text-muted">
            Force a tier with <code>?motion=full</code>,{' '}
            <code>?motion=reduced</code> or <code>?motion=static</code>. The
            override is development-only — in production the branch is a literal{' '}
            <code>false</code> and disappears from the bundle.
          </p>
        </Container>
      </Section>

      {/* ── 1 · Grain weight ────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="grain">1 · Grain weight</Heading>
          <Note>
            4% over a repeating 160px tile, no blend mode. Each pair is the same
            surface with the grain on and off, so the difference you see is the
            whole of its effect. A plain-alpha overlay always pulls slightly
            toward mid-grey — that is the trade for not using{' '}
            <code>mix-blend-mode</code>, which would force the entire page into
            one composited group.
          </Note>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['Ivory — no grain', 'bg-surface-raised', 'off'],
                ['Ivory — 4% grain', 'bg-surface-raised', 'on'],
                ['Rose beige — no grain', 'bg-surface-decor', 'off'],
                ['Rose beige — 4% grain', 'bg-surface-decor', 'on'],
              ] as const
            ).map(([label, surface, grain]) => (
              <figure key={label}>
                <div
                  data-grain={grain}
                  className={`grain-sample h-40 rounded-xl border border-border-subtle ${surface}`}
                />
                <figcaption className="mt-2 text-xs text-text-muted">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {(
              [
                ['Nude fill — 4% grain', 'bg-surface-accent'],
                ['Espresso — 4% grain', 'bg-surface-inverse'],
              ] as const
            ).map(([label, surface]) => (
              <figure key={label}>
                <div
                  data-grain="on"
                  className={`grain-sample h-40 rounded-xl ${surface}`}
                />
                <figcaption className="mt-2 text-xs text-text-muted">
                  {label} — grain reads strongest on dark
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 2 · Aurora at several scroll positions ──────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="aurora">2 · Aurora</Heading>
          <Note>
            The live wash is behind this page — scroll and watch it move. These
            specimens freeze it at four positions so the rose balance can be
            compared directly. Same blur, same stop opacity, same tokens.{' '}
            <code>--aurora-a</code> stays cream throughout, which is what
            removes hard section boundaries.
          </Note>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AuroraSpecimen
              label="progress 0 — nude / rose beige"
              a="var(--mb-nude)"
              b="var(--mb-rose-beige)"
              offset={0}
            />
            <AuroraSpecimen
              label="progress 0.33"
              a="var(--mb-rose-beige)"
              b="var(--mb-blush)"
              offset={0.33}
            />
            <AuroraSpecimen
              label="progress 0.66 — warmer"
              a="var(--mb-blush)"
              b="var(--mb-muted-rose)"
              offset={0.66}
            />
            <AuroraSpecimen
              label="progress 1 — champagne accent"
              a="var(--mb-nude)"
              b="var(--mb-champagne)"
              offset={1}
            />
          </div>

          <p className="mt-6 max-w-lead text-sm text-text-muted">
            Text is never placed on the wash without a token surface or a scrim
            behind it, and contrast is checked at the wash&rsquo;s{' '}
            <strong>worst case across the whole scroll range</strong>, not at
            rest.
          </p>
        </Container>
      </Section>

      {/* ── 3 · Rose in use ─────────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="rose">3 · Rose in use</Heading>
          <Note>
            Rose carries the brand through <strong>area</strong>, not detail —
            it is barred from text and control borders because it fails contrast
            there, not as a matter of taste. This applies the usage rule so the
            balance can be judged before sections exist.
          </Note>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-surface-accent p-8">
              <p className="text-xs tracking-eyebrow text-text-secondary uppercase">
                Large fill
              </p>
              <p className="mt-3 text-text-primary">
                Nude as a whole-section background. Only ink, espresso or cocoa
                may sit on it.
              </p>
            </div>

            <div className="rounded-2xl border border-border-decor bg-surface-raised p-8">
              <p className="text-xs tracking-eyebrow text-text-secondary uppercase">
                Tinted card + divider
              </p>
              <hr className="my-4 border-border-decor" />
              <p className="text-text-primary">
                Rose beige as a decorative hairline. Never around a control.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl bg-surface-raised">
              <div className="relative">
                <ImageStandIn tint />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[var(--mb-muted-rose)] opacity-20"
                />
              </div>
              <p className="p-8 text-text-primary">
                Image overlay — muted rose at 20%, which warms stock photography
                into one visual family.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 4 · Tiers side by side ──────────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="tiers">4 · The three tiers, side by side</Heading>
          <Note>
            Each column forces a tier. Reduced motion is a{' '}
            <strong>first-class layout</strong>, not a fallback — review the
            middle column for composition, not merely for &ldquo;does it still
            work&rdquo;.
          </Note>

          <div className="grid gap-8 lg:grid-cols-3">
            {TIERS.map(({ tier, label, note }) => (
              <MotionTierProvider key={tier} value={tier}>
                <div className="rounded-xl border border-border-subtle bg-surface-page p-6">
                  <p className="mb-1 text-xs tracking-eyebrow text-text-accent uppercase">
                    {label}
                  </p>
                  <p className="mb-6 text-xs text-text-muted">{note}</p>

                  <TextReveal
                    lines={STORY_LINES}
                    as="div"
                    className="max-w-display font-display text-xl tracking-display text-text-primary"
                    lineClassName="mb-1"
                  />

                  <div className="mt-6">
                    <ImageReveal>
                      <ImageStandIn />
                    </ImageReveal>
                  </div>
                </div>
              </MotionTierProvider>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── 5 · Pinned sequence ─────────────────────────────────────────── */}
      <PinnedSequence distance="250svh" mobileDistance="160svh">
        <div className="flex h-full items-center justify-center">
          <Container>
            <p className="text-xs tracking-eyebrow text-text-accent uppercase">
              5 · Pinned sequence — used in exactly two places on the site
            </p>
            <p className="mt-4 max-w-display font-display text-5xl tracking-display text-text-primary">
              Sabit sahne
            </p>
            <p className="mt-4 max-w-lead text-sm text-text-muted">
              Native scroll is untouched — the scrollbar, keyboard paging,
              Home/End and find-in-page all behave normally. There is no wheel
              or touchmove listener anywhere in this codebase, and a test
              asserts it.
            </p>
          </Container>
        </div>
      </PinnedSequence>

      {/* ── 6 · Sticky panels ───────────────────────────────────────────── */}
      <Section tone="page" rhythm="tight">
        <Container>
          <Heading id="panels">6 · Sticky stacked panels</Heading>
          <Note>
            40px top radius, outgoing panel scales to {transforms.panelScale}{' '}
            and dims to {transforms.panelDim} via an overlay&rsquo;s opacity —
            not a <code>filter</code>, which would push the whole subtree onto
            its own layer.
          </Note>
        </Container>
        <StickyPanelStack>
          {['Cilt bakımı', 'Epilasyon', 'Kaş & kirpik'].map(
            (title, index, all) => (
              <StickyPanel key={title} index={index} total={all.length}>
                <Container>
                  <div className="flex min-h-[70svh] flex-col justify-center py-16">
                    <p className="text-xs tracking-eyebrow text-text-accent uppercase">
                      {index + 1} / {all.length}
                    </p>
                    <p className="mt-3 font-display text-4xl tracking-display text-text-primary">
                      {title}
                    </p>
                  </div>
                </Container>
              </StickyPanel>
            ),
          )}
        </StickyPanelStack>
      </Section>

      {/* ── 7 · View transition + budget ────────────────────────────────── */}
      <Section tone="raised" rhythm="tight">
        <Container>
          <Heading id="budget">7 · View transition &amp; budget</Heading>
          <Note>
            The link below uses the View Transitions API where the browser has
            it, and is a plain link where it does not — no polyfill, no fallback
            animation.
          </Note>
          <ViewTransitionLink
            href="/styleguide"
            transitionName="demo-target"
            className="inline-block rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent"
          >
            Styleguide&rsquo;a geç
          </ViewTransitionLink>

          <table className="mt-10 w-full max-w-page border-collapse text-sm">
            <tbody>
              {(
                [
                  [
                    'Ceiling for any discrete transition',
                    `${durations.slowest}ms`,
                  ],
                  [
                    'Scroll-linked smoothing (aurora only)',
                    `${durations.settle}ms`,
                  ],
                  ['Stagger per line', `${stagger.line}ms`],
                  ['Max staggered items', `${stagger.cap}`],
                  ['Full stagger run', `${TEXT_REVEAL_BUDGET_MS}ms`],
                  ['Pinned sections on the whole site', '2'],
                  ['Signature interactions', '5 + grain'],
                ] as const
              ).map(([label, value]) => (
                <tr key={label}>
                  <td className="border-b border-border-subtle p-3 text-text-secondary">
                    {label}
                  </td>
                  <td className="border-b border-border-subtle p-3 text-text-primary tabular-nums">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>
    </>
  );
}

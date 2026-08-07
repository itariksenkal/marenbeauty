# Maren Beauty

The website for **Maren Beauty**, a boutique beauty centre (güzellik merkezi) in
Konya / Selçuklu, Turkey. Turkish content, English code.

**The centre has not opened.** The site ships in pre-launch mode, and a good
deal of the work here is about being honest about what is not yet known.

---

## Quick start

```bash
nvm use              # Node 24, pinned in .nvmrc
npm ci
cp .env.example .env.local   # nothing is required for `npm run dev`
npm run dev          # http://localhost:3000
```

`npm run dev` works with an empty `.env.local`. The proof-of-work signing key
falls back to a random per-process one outside production, with a loud warning;
mail simply fails, which is the state the project is in anyway.

Two review surfaces exist in development only and **404 in production**:

| Route         | What it is                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| `/styleguide` | Every design token with its computed contrast, the type scale in Turkish, glyph specimen |
| `/motion`     | Every motion primitive at all three tiers, and the motion budget as numbers              |

---

## Commands

| Command                | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Development server                                              |
| `npm run build`        | Production build (`output: 'standalone'`)                       |
| `npm run start`        | Serve the production build                                      |
| `npm run typecheck`    | `tsc --noEmit`                                                  |
| `npm run lint`         | ESLint                                                          |
| `npm run format`       | Prettier, writing                                               |
| `npm run format:check` | Prettier, checking                                              |
| `npm run fonts`        | Decodes the shipped fonts and asserts Turkish glyph coverage    |
| `npm run guard`        | Content guard over **build output** — run it after `build`      |
| `npm run test`         | Unit tests (Vitest)                                             |
| `npm run test:e2e`     | Browser tests (Playwright): production, production-reduced, dev |
| `npm run test:a11y`    | axe over every route, plus keyboard, reflow and reduced motion  |
| `npm run licenses`     | Licence audit; regenerates `NOTICE`                             |
| `npm run preflight`    | **Deployment** readiness — not part of `verify`. See below.     |
| **`npm run verify`**   | **THE gate.** All of the above except `preflight`, in order.    |

```bash
npm run verify
```

A task is not done until that exits 0. Roughly: 749 unit tests, 195 browser
tests, 102 accessibility tests.

### Manual tools, not part of `verify`

They hit the network and their output is committed:

```bash
node scripts/research-images.mjs <dir>   # search Unsplash + Pexels
node scripts/contact-sheet.mjs <dir>     # tile candidates for review by eye
node scripts/fetch-images.mjs [--force]  # download, convert, regenerate the manifest
node scripts/generate-placeholders.mjs   # the abstract artwork set, if ever wanted back
```

---

## Deploying

```bash
npm run preflight
```

**This is the gate between "pushed" and "live", and it currently fails.** It
refuses a production deployment while any of four things is unresolved:

1. `LEGAL_ENTITY` — the registered ünvan. It has never been invented.
2. `src/config/legal.ts` still says `isLawyerReviewed: false`.
3. The SMTP credential is missing.
4. `ALTCHA_HMAC_KEY` is missing.

Every one is a value the owner supplies; none is a code change. `vercel.json`
runs `preflight` before `next build`, so a deploy cannot skip it.

`docs/STATUS.md` lists all of it in priority order, with the one-line change
that resolves each.

### Self-hosting

Vercel is the deploy target, not a dependency. The site must run identically in
a plain container (`CLAUDE.md` §3), and it is verified that way:

```bash
docker build -t marenbeauty .
docker run --rm -p 3000:3000 --env-file .env.local marenbeauty
```

---

## How this repository is organised

```
content/        Turkish. Authored MDX — services, blog, legal, pages.
docs/           English. Specs, decisions and open questions. Read these.
public/images/  48 self-hosted photographs, referenced ONLY via the manifest.
scripts/        The gates: guard, licences, fonts, preflight, image pipeline.
src/app/        Routes only.
src/config/     The only home for a tunable value. No component holds a literal.
src/content-layer/  MDX loading, Zod schemas, referential integrity.
tests/          unit · e2e (3 projects) · a11y
```

**`CLAUDE.md` is the working agreement and outranks habit.** Read it before
changing anything. Then `docs/ROADMAP.md` for what was built and why, and
`docs/OPEN-QUESTIONS.md` for everything still unknown — which is the file that
keeps this project from inventing facts.

### Four rules that explain most of the odd-looking decisions

- **Nothing is invented.** No price, no duration, no statistic, no testimonial,
  no staff name, no address, no opening date. Where a section would need a fact
  nobody has, the section does not render — absence, never a placeholder that
  reads like a fact.
- **It is a beauty centre, not a clinic.** `npm run guard` fails the build on
  sixteen Turkish treatment-language stems, and no medical schema type appears
  anywhere.
- **Config, not components.** No component contains a Turkish sentence, a
  colour, a spacing value, a phone number or an image path.
- **Claims are tested, not asserted.** "No cookies" is a browser test. "One warm
  visual family" is measured on the shipped pixels. "The tracker code is not in
  the bundle" greps the bundle.

---

## Licence

Private. Third-party attributions are generated into `NOTICE` and published at
`/lisanslar`.

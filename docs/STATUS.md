# STATUS — Maren Beauty

**What is shipping, what is a placeholder, what is missing, and what to do next.**

Last updated: 2026-08-07. Every milestone through M19 is built and
`npm run verify` exits 0: **752 unit tests, 210 browser tests, 102 accessibility
tests, 0 blocking guard violations.**

The site is **feature-complete.** `npm run preflight` now passes two of its four
checks: the owner has supplied a legal entity and approved the legal texts for
publication. **Two remain — the SMTP credential and the signing key** — and both
are environment values. §2 lists everything in order.

**Two things resolved on 2026-08-07 are resolved provisionally, not finally.**
The ünvan is a placeholder for a company still being registered, and the legal
texts have had no external review. Both are recorded as open (B2, C8) and both
appear in §1 below, because a provisional answer that stops being tracked is
indistinguishable from a wrong one.

---

## 1. Every placeholder currently shipping

Each one is real, working, visible content — and none of it is a fact anybody
has confirmed. The right-hand column is the whole change.

### Contact channels — `src/config/contact.ts`

| Placeholder     | Shows as                     | Replace with                                                      |
| --------------- | ---------------------------- | ----------------------------------------------------------------- |
| Phone           | `0500 000 00 00`             | `phone: { value: '+90…', label: '0… … .. ..' }`                   |
| WhatsApp        | `0500 000 00 00`             | `whatsapp: { value: '+90…', label: '…' }` — may differ from phone |
| Instagram       | `@marenbeauty`               | The real handle, or `instagram: null` to remove it everywhere     |
| Facebook        | `marenbeauty`                | The real handle, or `facebook: null`                              |
| TikTok          | `@marenbeauty`               | The real handle, or `tiktok: null`                                |
| Google Business | a Google Maps **search** URL | The real profile URL once the GBP exists                          |

`0500` is not an allocated Turkish mobile prefix. That is on purpose: the
number cannot be dialled by mistake and cannot be read as a real one somebody
forgot to change. A test pins it.

**Setting a channel to `null` removes it from the header CTA, the location
card, the footer and the structured data, with no other edit.** That mechanism
is the reason the placeholders are safe to ship.

`email` is **not** a placeholder — `info@marenbeauty.com` is the address decided
in `docs/OPEN-QUESTIONS.md` B1.

### Opening hours — `src/config/site.ts`

| Placeholder    | Shows as                                         | Replace with                     |
| -------------- | ------------------------------------------------ | -------------------------------- |
| `openingHours` | Pzt–Cum 10:00–19:00, Cmt 10:00–18:00, Paz kapalı | The real hours in the same array |

Labelled **"Planlanan saatler. Açılışla birlikte kesinleşecek."** on screen
wherever they appear, and deliberately **absent from structured data** while
`isPreLaunch` is true — a line that says "planlanan" is a different kind of
statement from telling Google the business is open then.

### The visit sequence — `src/config/experience.ts`

Four steps (Karşılama · Birlikte karar · Seans · Sonrasında) on the home page's
pinned section and on `/hakkimizda`. They state no duration, no session count,
no product, no device and no credential — a test asserts each absence — but
they are **our words, not the owner's**. Replace the four `body` strings.
Emptying the array removes the section everywhere.

### Home page copy — `src/config/home.ts`

Every line of the pinned opening. Written to the brief and stating nothing
unconfirmed, but **unapproved**: `copyApproved: false`. Set it to `true` once
the owner has read it, or replace the strings.

### Photography — `src/config/images.ts` (generated)

48 stock photographs from Unsplash and Pexels, self-hosted as WebP, every one
credited and `replaceable: true`. **None of them is the premises**, and
`/galeri` says so in its first paragraph, above the images.

To replace: edit `scripts/image-set.mjs`, run `node scripts/fetch-images.mjs
--force`. The manifest regenerates itself. **No component changes** — components
take an `id`.

### The legal entity — environment, **provisional**

`LEGAL_ENTITY` is set in the deployment environment to **"Maren Beauty Center
Limited Şirketi"**, supplied by the owner on 2026-08-07. **The company is still
being registered**, so the KVKK aydınlatma metni currently names a data
controller that does not yet legally exist.

Replace with the registered ünvan after incorporation — one environment
variable. **It is read at BUILD time**, so a rebuild is required, and a
container needs `--build-arg LEGAL_ENTITY="…"` rather than a run-time `-e`
(B2).

### Legal texts — `src/config/legal.ts`, **published without an external review**

| Flag                     | Value        | Meaning                                                                                                     |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `isLawyerReviewed`       | `true`       | The **owner** approved publication on 2026-08-07. Removes the "Taslak metin" notice; satisfies `preflight`. |
| `hasExternalLegalReview` | `false`      | **No lawyer has read these texts.**                                                                         |
| `effectiveDate`          | `2026-08-07` | The date of the owner's approval.                                                                           |

Two flags because one boolean cannot honestly carry both answers once they
differ, and on 2026-08-07 they do (C8). Setting `isLawyerReviewed` back to
`false` brings the on-screen draft notice back with no other edit — the copy and
the conditional are both retained, and a test asserts it.

### Blog bylines

`author: 'PENDING'` on all twelve posts, and the template **never reads the
field** — so a byline cannot appear by accident. `BlogPosting.author` references
the Organization, never a Person.

### Testimonials — `src/config/testimonials.ts`

**Empty, and deliberately not filled.** The instruction to fill every section
and the standing rule against fabricated reviews collide here, and the rule
wins: `CLAUDE.md` §9, the `Testimonial` type requires recorded consent (KVKK),
and review markup for reviews that do not exist breaks Google's policy.
`TestimonialsSection` returns `null`, so no empty section renders either.

Add real, consented testimonials and the section appears, with
`aggregateRating` becoming truthful for the first time.

### Not a placeholder — deliberately absent

| Absent            | Why                                                                     |
| ----------------- | ----------------------------------------------------------------------- |
| Street address    | Premises not finalised (C1). A guessed address sends someone to a door. |
| Opening date      | None confirmed. The band says "yakında" and carries no year.            |
| Prices            | Never published, by decision. Not now, not after launch.                |
| Before/after      | Never, in any layout.                                                   |
| Analytics backend | No Umami instance, no VPS, no DNS record (C5).                          |

---

## 2. What the owner must supply, in order

### 1 · SMTP app password — **blocks the only conversion path**

`docs/OPEN-QUESTIONS.md` B3. An app password on the `info@marenbeauty.com`
Google Workspace account (needs 2FA on that account). Set `SMTP_PASS`, plus the
five variables already documented in `.env.example`.

Everything else about the form is built and tested: validation, proof of work,
the no-JavaScript path, replay protection, the rate limit, the composed RFC822
message. What is untested and cannot be tested without this: **that Workspace
accepts the credential.** No code changes with it.

### 2 · A signing key — **blocks the deploy**

`ALTCHA_HMAC_KEY`, 32+ characters. Not the owner's to obtain, only to set:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3 · The **registered** ünvan — provisionally answered, still open

B2. A provisional value is live. It must be replaced with the registered ünvan
once incorporation completes, because the KVKK notice names it as the data
controller. One environment variable and a **rebuild** — it is read at build
time, not run time.

### 4 · An external review of the three legal texts — still open

C8. The owner has approved them for publication; no lawyer has read them. Also
outstanding: the VERBİS determination, and a re-read of the KVKK notice once the
registered ünvan lands — the two are the same paragraph.

When it happens: set `hasExternalLegalReview: true` and update
`effectiveDate`.

### 5 · The real phone and WhatsApp number

One edit to `src/config/contact.ts`. Until then the site shows a number that
cannot be dialled.

### 6 · Social handles, or a decision to drop them

Four profiles render today against handles that do not exist. Either create
them, or set the unwanted ones to `null` — which removes them everywhere,
including from `sameAs` in the structured data.

### 7 · Opening hours

C12. One array in `src/config/site.ts`. When they are real, flipping
`site.isPreLaunch` to `false` also puts them into structured data and removes
the pre-launch band.

### 8 · Four sentences describing a visit

C11, in the owner's words. Ours are placeholders.

### 9 · Approval of the home page copy

C10. Read it, then set `home.copyApproved` — or rewrite the strings.

### 10 · Real photography — after opening

C7. The single highest-value change after launch. `scripts/image-set.mjs`, one
command, no component changes.

### 11 · Street address and Google Business Profile — after opening

C1. The biggest local-SEO lever there is, and it needs a real, verifiable
address.

---

## 3. Known defects and outstanding checks

Nothing here is a bug in shipped behaviour. All of it is work that a machine
could not finish.

| #   | Item                                                                                     | Status                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Screen reader pass** — NVDA or VoiceOver on home, a service page, a post and the form. | **Not done.** Needs a person. The mechanical half (landmarks, names, heading order, redundant alt, live regions) is covered by 102 automated checks, and the one missing landmark was found and fixed that way. |
| 2   | **Rich Results Test and the Schema.org validator**, one URL per route type.              | Not run — both fetch a live URL, and there is no live URL yet. 59 unit tests assert the graph shape, `@id` integrity, the absence of every medical type, and every pre-launch omission.                         |
| 3   | **A real send from production and from the container.**                                  | Blocked on item 1 of §2. Both reach the mail step and fail with the generic message, logging exactly which variables are missing.                                                                               |
| 4   | **No Content-Security-Policy.**                                                          | Decided, not overlooked — G27. Two inline scripts ship by design, so a real CSP needs per-request nonces and would make every page dynamic. Reopens the moment any third-party script is added.                 |
| 5   | `next start` prints a warning under `output: 'standalone'`.                              | Cosmetic. The container runs `node server.js`, which is the supported path; `next start` is used only by the test suites.                                                                                       |
| 6   | **Permit verification** for the six regulated services (A2).                             | Owner's checklist. No page names a device, depth, concentration or setting, so the copy is already inside whatever the permits allow — but the boxes still need ticking.                                        |
| 7   | Post 12's title was changed from the content plan.                                       | Recorded as a deviation in `docs/CONTENT-PLAN.md` §4. The planned title promised a number the posture forbids the body from giving.                                                                             |

---

## 4. From a clean clone to a live site

### Locally

```bash
git clone https://github.com/itariksenkal/marenbeauty
cd marenbeauty
nvm use                       # Node 24
npm ci
cp .env.example .env.local    # nothing required for dev
npm run dev                   # http://localhost:3000
npm run verify                # the full gate; must exit 0
```

### Before the first deploy — the owner's part

1. Resolve §2 items **1–2** — the SMTP credential and the signing key. Items 3
   and 4 are answered provisionally and do not block a deploy, but do not treat
   them as finished.
2. Set these in the Vercel project (or in `--env-file` for a container):

   | Variable          | Value                  |
   | ----------------- | ---------------------- |
   | `LEGAL_ENTITY`    | The registered ünvan   |
   | `ALTCHA_HMAC_KEY` | `openssl rand -hex 32` |
   | `SMTP_HOST`       | `smtp.gmail.com`       |
   | `SMTP_PORT`       | `587`                  |
   | `SMTP_USER`       | `info@marenbeauty.com` |
   | `SMTP_PASS`       | The app password       |
   | `MAIL_FROM`       | `info@marenbeauty.com` |
   | `MAIL_TO`         | `info@marenbeauty.com` |

   Leave `MAIL_TRANSPORT` unset. Leave every `UMAMI_*`, `GA4_*` and
   `META_*` blank.

3. `isLawyerReviewed` and `effectiveDate` are already set (2026-08-07).
4. Run `npm run preflight` locally, with the environment loaded. It must print
   four ticks.

### The deploy

1. Connect the repository to Vercel. `vercel.json` sets the build command to
   `npm run preflight && next build`, so a missing value fails the build rather
   than shipping a half-configured site.
2. Add the apex domain `marenbeauty.com` **and** `www.marenbeauty.com`, with
   `www` redirecting to the apex. `next.config.ts` already redirects `www` →
   apex; the two must agree or it is a redirect loop.
3. **DNS is the owner's, and MX records are not touched.** Follow
   `docs/DEPLOY.md` §2–§4 — it covers SPF, DKIM and DMARC alongside Google
   Workspace, which is the part that can break business email.
4. After the first successful deploy:
   - send a real message through `/iletisim` and confirm it arrives;
   - verify the domain in Search Console (DNS TXT) and submit
     `https://marenbeauty.com/sitemap.xml`;
   - run the Rich Results Test on `/`, a service page and a post (item 2 of §3).

### Self-hosting instead

```bash
docker build --build-arg LEGAL_ENTITY="…" -t marenbeauty .
docker run --rm -p 3000:3000 --env-file .env.local marenbeauty
```

The `--build-arg` is not optional: the legal pages are prerendered, so the ünvan
is baked in at build time and a run-time `-e` arrives too late.

Verified at M16: all 18 routes, image optimisation, non-root user, dev-only
routes absent. Put a TLS-terminating proxy in front and point the `A` record at
the host. Nothing in the application changes.

---

## 5. After launch, in expected-value order

From `docs/ROADMAP.md`. One at a time, not all at once.

1. **Google Business Profile** — needs the address decision. Biggest local lever.
2. **Flip `isPreLaunch: false`** — real hours become structured data, the
   pre-launch band disappears. One config change.
3. **Real photography** — swap `scripts/image-set.mjs`, set
   `replaceable: false`.
4. **Blog Batch 2** — posts 13–50, about two a week. G19 stands: written in
   several passes, never one.
5. **Git-backed admin UI** — so the owner publishes without a developer. Same
   MDX files. Licence-check the CMS first.
6. **Testimonials**, then `aggregateRating`. Only from real clients,
   unincentivised.
7. **A real author byline** — widen the schema, `BlogPosting.author` becomes a
   `Person`.

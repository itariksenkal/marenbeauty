# OPEN QUESTIONS — Maren Beauty

Everything that is unknown, undecided, or needs the owner's confirmation.

**The rule this file exists to enforce:** when something is unknown, it is
written here and left unresolved in the code. It is never guessed, never
approximated, and never filled with a plausible-sounding placeholder that could
be mistaken for fact.

**Status:** 🔴 blocking a milestone · 🟡 needed before launch · 🟢 informational ·
✅ answered

Last updated: 2026-08-06 (M0).

---

## A. Recorded decisions — the owner's call, not our assumption

### A1 — Operating permits ✅ 🟡

**Recorded as instructed by the owner.**

> All required permits are being obtained together before opening. The full
> service menu is published on that basis.

**This is the owner's decision, not an assumption made by the build team.**

**Answered 2026-08-06:** assume all six services in A2 are covered. Build and
publish the full menu.

**The pre-launch checklist item stands** and is not closed by this answer: before
go-live, each service in A2 must be verified against the permits actually
obtained. If any is not covered, its page is removed **before** the site is
public. A published service page for an unpermitted service is a live regulatory
exposure that the site's own content makes easy to find.

Service copy stays within appearance language regardless of permit status.

### A2 — Services with regulatory sensitivity 🟡 (verify pre-launch)

Assumed covered per A1. Listed so the owner can tick them off individually
against the real permits.

| Service            | Verify | Why                                                                                                                      |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `lazer-epilasyon`  | ☐      | Laser device operation is regulated; device class, operator qualification and premises approval are typically specified. |
| `dermapen`         | ☐      | Micro-needling. Needle depth is usually the line between beauty and medical scope.                                       |
| `bb-glow`          | ☐      | Needle-based pigment delivery. Regulatory status is contested in several jurisdictions.                                  |
| `kalici-makyaj`    | ☐      | Permanent make-up — needle-based pigment; usually its own permit and hygiene certification.                              |
| `microblading`     | ☐      | As above.                                                                                                                |
| `kimyasal-peeling` | ☐      | Acid concentration and depth usually determine whether it is within beauty scope.                                        |

**Still open:** whether any permit carries depth / concentration / device-class
limits that the service copy should reflect. Since copy publishes **no** device
names, depths or concentrations (§H), this is unlikely to force a rewrite — but
it should be checked at the same time as the boxes above.

**M8 update — all six pages are now written and live in the build.** Each says
explicitly, in its own words, that the technical detail is not published and is
discussed before a session instead. Nothing on any of them names a device, a
depth, a concentration or a setting, and a unit test asserts it per service. So
the copy is already inside whatever the permits turn out to allow, and the boxes
above remain a compliance check rather than a rewrite risk.

### A3 — Other recorded decisions ✅ 🟢

| Decision                                                       | Recorded |
| -------------------------------------------------------------- | -------- |
| No prices anywhere, not even ranges                            | Owner    |
| Testimonials ship empty; none fabricated                       | Owner    |
| Photography deferred until after opening; free stock at launch | Owner    |
| Turkish only; no i18n scaffolding                              | Owner    |
| No dark mode                                                   | Owner    |
| No booking system                                              | Owner    |
| Display address "Konya, Selçuklu" only                         | Owner    |
| Every dependency MIT / Apache / ISC / BSD                      | Owner    |
| Hosting on Vercel but the app stays self-hostable              | Owner    |
| Copy stays general; no invented operational detail (§H)        | Owner    |

---

## B. Blockers

### B1 — Destination inbox ✅ → M11

**Answered 2026-08-06.**

- Destination and sender: **`info@marenbeauty.com`**
- Same address for `SMTP_USER`, `MAIL_FROM` and `MAIL_TO`.
- **No send-as alias, no second identity.** One mailbox, one identity.

This removes the Workspace `From`-alignment risk entirely: the authenticated
account and the `From` header are the same address, so SPF and DKIM align with
no extra configuration.

Recorded in `.env.example`. The password itself is B3 and is never committed.

### B2 — Legal entity name 🔴 → M12

**Still unresolved. Confirmed 2026-08-06 that it stays unresolved, and that the
build gate must not be softened.**

**Need:** the registered ünvan (and tax office / registration number, if the KVKK
text should carry them).

**Why it matters:** KVKK aydınlatma metni, çerez politikası and kullanım
koşulları must name the data controller. An invented name makes the notice
legally worthless.

**Meanwhile:** the literal token `{{LEGAL_ENTITY}}` appears in all three pages,
and `npm run guard` **fails the production build** if any `{{…}}` reaches
output. The site cannot ship with this unresolved. That is deliberate and is
not to be relaxed for a deploy, a demo, or a preview.

### B3 — SMTP authentication ✅ → M11

**Answered 2026-08-06:** **app password** on the `info@marenbeauty.com`
Workspace account. Requires 2FA on that account.

- Not used for bulk mail. Contact-form volume only.
- Stored as `SMTP_PASS`, environment only, never committed.
- Revisit if the mailbox changes hands (OAuth2 with domain-wide delegation is
  the fallback).

**Status after M11 🔴 — this is the single remaining step on the contact form.**

The decision is made; the value does not exist yet. Everything that does not
need it is built and tested for real: validation, proof of work, the no-JS page
token, replay protection, the rate limit, the composed RFC822 message, the
error and success states, the `data-channel` contract. The send path is verified
against a **local capture** — nodemailer's own stream transport composes the
identical message and hands back the bytes — driven end to end through a real
browser, with and without JavaScript.

What that leaves untested, and cannot be tested without the value: **that Google
Workspace accepts the credential.** Nothing else.

Until then, in production: the page renders, the form validates, the spam gate
runs, and delivery fails with the generic Turkish message while the server log
names exactly which variables are missing. **No fallback address was invented**
and nothing was weakened to make the milestone pass — the capture transport is
refused in production, and the checklist item is in `docs/DEPLOY.md`.

Setting the six variables is the whole change. There is no code to write.

---

## C. Pre-launch items

### C1 — Street address and Google Business Profile ✅ 🟢 → post-launch

**Answered 2026-08-06:** the premises are not finalised. **District-only stands.**
GBP setup with the real address happens after opening.

- `LocalBusiness` omits `streetAddress` and `postalCode` entirely.
- Display address stays "Konya, Selçuklu".
- **Not a blocker for any build milestone.** Post-launch backlog item 1.

### C2 — Canonical host ✅ → DNS cutover

**Answered 2026-08-06:** **apex — `https://marenbeauty.com`.** `www` 301s to it.

Enforced in two places, which must agree: the Vercel domain redirect setting and
`next.config.ts`. A disagreement is a redirect loop.

### C3 — Canonical NAP string ✅ 🟡

**Answered 2026-08-06.** Locked as:

```
Name:    Maren Beauty
Address: Konya, Selçuklu
Phone:   (none)
```

**Locked until a phone number and street address exist**, at which point all
three are updated **everywhere at once** — footer, schema, GBP, every directory
listing — in a single change. Partial updates create the inconsistency this
lock exists to prevent.

### C4 — Session durations ✅ → held at M8

**Answered 2026-08-06: publish none.** `durationLabel` stays `null` on all 20
services and renders **nothing** — no dash, no "TBD", no estimate.

This is now a standing content rule, not a temporary state (§H). The "Süre"
block has been removed from the service page structure in
`docs/CONTENT-PLAN.md` §2 rather than left as a null-rendering slot.

### C5 — Analytics at launch ✅ → M14

**Answered 2026-08-06: skip at launch.**

- **Do not** stand up Umami. **Do not** provision a VPS. **Do not** add a DNS
  record.
- Build the analytics module behind a flag that is **off**, so it can be
  switched on later without a refactor.

Reasoning, as given: there is no traffic to measure before opening, and a second
server to maintain is real cost for zero return.

**Consequence for M14:** the milestone still ships — it builds the module, the
flag and the consent gate (C6). It does not deploy an analytics backend.

### C6 — Advertising and consent ✅ → M14

**Answered 2026-08-06: assume yes within 12 months.**

**Ship the consent gate live at launch with all tags off**, so tracking can never
start before consent exists.

This is the only ordering that works: adding a consent gate after tracking has
begun means a window during which data was collected without consent, which
cannot be retroactively fixed.

At launch, therefore:

- Consent gate: **live**.
- Umami: **not deployed** (C5).
- GA4 / Meta Pixel: **flagged off, absent from the production bundle.**
- Result: no cookies, no third-party requests, and a gate already in place for
  the day advertising starts.

### C7 — Photography ✅ 🟢 → judged at M8, one question back to the owner

**Answered 2026-08-06:** free stock at launch, curated to **one narrow visual
family**. Manifest as specified.

Paid stock is revisited **only if the free set looks generic in review** — a
judgement made when the images are on the page, not in advance.

**M8 outcome: no stock photograph ships, free or paid.** Once the pages existed,
every stock option turned out to be a claim in picture form. A treatment room is
a room that is not this one. A face is a person who does not work here — already
banned outright by `CLAUDE.md` §8. Neither survives the content posture in §H,
which is the same standard the copy is held to.

The launch set is **abstract warm gradient artwork generated from the palette**
(`scripts/generate-placeholders.mjs`), one per service, in the same visual
family as the aurora. It asserts nothing. Because it is ours: `licence` is a
real `CC0-1.0`, `credit` and `sourceUrl` are `null` rather than fabricated, and
`alt` is empty — the images carry no information, so decorative markup is the
correct accessibility answer and no alt text had to be invented either.

**For the owner:** this is a design decision, not only a legal one, and it is
worth a look on screen at `/hizmetler`. If the pages read too abstract, the
alternative is real photography of the actual space once it exists — not stock.
Swapping the set is one edit to `src/config/images.ts`; no component moves.

**REVERSED AT M18, on instruction.** The owner asked for real photography
everywhere: several images per service page, plus home, blog, about and a
gallery. The abstract set was replaced entirely.

What did NOT change is the reason the abstract set existed. The constraint that
a picture must not make a claim the copy would not is now enforced by
**selection** rather than by abstraction:

- 450 candidates were gathered from Unsplash and Pexels and filtered
  mechanically for warm dominant colour, mid luminance and landscape
  orientation (`scripts/research-images.mjs`);
- the survivors were reviewed as contact sheets, by eye, and rejected for:
  an identifiable face, legible foreign-language product packaging, a device or
  anything reading as clinical, cool tone, or a colourful outlier;
- 48 were selected and are recorded in `scripts/image-set.mjs`.

Everything is **self-hosted** as WebP; nothing is hotlinked, so the cookie
policy's "no third-party request" stays true and a browser test asserts it.

**Two things a reader must not be allowed to assume**, and both are handled on
screen rather than in a note here: no photograph is the premises, and
`/galeri`'s first paragraph says so, above the images. Alt text describes the
photograph, never the room.

`generate-placeholders.mjs` is kept — it is how the set is regenerated if the
owner ever wants the abstract treatment back.

Still open, and now more so: **real photography of the actual space.** All 48
are `replaceable: true`, and the swap is `scripts/image-set.mjs` plus one run of
`node scripts/fetch-images.mjs`.

### C8 — KVKK review and VERBİS 🟡 → M12

**Answered 2026-08-06:** the owner's lawyer reviews pre-launch, including the
VERBİS registration question.

**Build-side obligation:** draft the pages accurately for what the site actually
does — a form that emails and stores nothing, no cookies at launch — and **mark
them unreviewed**. The unreviewed marker is removed only when the owner confirms
the review has happened.

Still outstanding: the review itself, and the VERBİS determination.

### C10 — Home opening copy 🟡 → owner approval

The pinned opening ships with **real Turkish placeholder copy** in
`src/config/home.ts`. It is written to the tone in `docs/BRIEF.md` §5 and
**states no fact about the business that is not already confirmed**.

What it says:

| Line                                           | Basis                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Konya Selçuklu’de güzellik merkezi.`          | Category and district, both confirmed. District is interpolated from `site.address`, and a test asserts it still appears. |
| `Maren, denizle akraba bir isim.`              | The brand rationale in `docs/BRIEF.md` §2.                                                                                |
| `Sakin, ölçülü, acelesi olmayan bir yaklaşım.` | Positioning and tone, not a claim.                                                                                        |
| `Yakında kapılarımızı açıyoruz.`               | Pre-launch status, which is true.                                                                                         |

What it deliberately does **not** say: anything about the team, the room, the
services, session lengths, credentials, equipment, or an opening date. The
first screen a visitor ever sees is the last place to start inventing.

**Needed:** the owner's wording, or approval of this. `home.copyApproved` flips
to `true` when that happens; until then this stays open.

### C9 — Disclaimer wording ✅ → M12

**Answered 2026-08-06: reword. No allowlist entry.** The exact sentence:

> Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine geçmez.

This contains no blocking term. `tıbbi` is **warning tier** (D1), which is why
`tıbbi` must stay non-blocking.

**M3 acceptance criterion:** a fixture test asserting this exact sentence passes
`npm run guard`. If a future change to the lexicon would break it, the test
fails first.

`scripts/guard.allow.json` therefore ships **empty** — the exception mechanism
exists but is unused, which is the better outcome.

---

### C11 — What a visit is like 🟡 → placeholder copy shipped at M17

`ExperienceProcess` — the second and last pinned section — rendered **nothing**
through M16, because `src/config/experience.ts` shipped with no steps.

**Changed at M17, on instruction:** four steps are now written and the section
renders on the home page (pinned) and on `/hakkimizda` (unpinned, same source).

They are **placeholder copy pending the owner's words.** They describe a
sequence — arrival, conversation, the session, afterwards — and state no fact
the business has not confirmed: no durations, no session counts, no products, no
devices, no credentials, no room description, no promise about a result. A test
asserts each of those absences.

**Need:** the owner's own wording, or approval of this.

**The mechanism is unchanged and must stay:** emptying `experience.steps`
removes the section everywhere with no component edit, and a test asserts the
`return null` branch still exists in both components.

### C12 — Opening hours 🟡 → placeholder shipped at M17

**Placeholder.** `src/config/site.ts` carries Pazartesi–Cuma 10:00–19:00,
Cumartesi 10:00–18:00, Pazar closed. These are ordinary hours for a Konya
beauty centre. **They are not hours the owner has confirmed.**

They are shown on `/iletisim`, `/hakkimizda` and the home page because a
location block with no hours is a hole a visitor notices — and they are
labelled on screen as _"Planlanan saatler. Açılışla birlikte kesinleşecek."_

They are deliberately **absent from structured data** while
`site.isPreLaunch` is true. A line on a page that says "planlanan" is a
different kind of statement from `openingHoursSpecification`, which tells a
search engine the business is open at those times. `docs/SEO.md` §2.5 and a
unit test both hold that line.

**Need:** the real hours. Then flip `isPreLaunch` and the schema fills itself in.

## D. Guard configuration ✅

### D1 — Lexicon tiers ✅ → M3

**Answered 2026-08-06.** The proposed advisory tier is split:

**BLOCKING — build fails** (16 terms)

`tedavi` · `terapi` · `kür` · `iyileştir` · `yok ed` · `garanti` ·
`kesin sonuç` · `mucize` · `kalıcı çözüm` · `kanıtlanmış` · `%100` ·
`risksiz` · `yan etkisiz` · `ağrısız` · `1 numaralı` · `en iyi`

**WARNING — reported, does not fail** (3 terms + the percentage rule)

`klinik` · `tıbbi` · `doktor kontrolünde`

**`tıbbi` must remain non-blocking** — the C9 disclaimer contains it. This is a
load-bearing constraint, not a preference. It is recorded here, in `CLAUDE.md`
§9, and asserted by the M3 fixture test.

Two known strictnesses, accepted deliberately:

- **`en iyi`** will also flag benign uses such as "cildinizi en iyi şekilde
  desteklemek". Rewriting around it is cheap; the phrase reads as marketing
  regardless. No allowlist entry.
- **`%100`** is blocking while other percentages only warn (D2). The guard must
  therefore check `%100` **before** the generic percentage rule, or the blocking
  hit is masked by the warning.

### D2 — Percentage rule ✅ → M3

**Answered 2026-08-06:** `%\d` stays a **warning**. Every hit is reviewed by
hand before merge. `%100` specifically is blocking (D1).

### D3 — Motion scope ✅ 🟢

**Answered 2026-08-06: no sixth signature interaction, no third pinned section.**

Five signature interactions plus the grain overlay. Exactly two pinned sections.
Closed.

---

## E. Licence decisions ✅

### E1 — `axe-core` exception ✅ **APPROVED** → M15

**Approved 2026-08-06 as a devDependency exception.**

Reasoning, recorded as instructed:

> MPL-2.0 is **file-level** copyleft. Its obligations attach to modifications of
> MPL-licensed files themselves. `@axe-core/playwright` is consumed unmodified,
> is a devDependency, and is never shipped or distributed in the built site.
> **No obligation is triggered.**

Recorded in `docs/LICENSES.md` §5. The audit allow-list carries a scoped
exclusion for this package only — not a widening of the policy.

### E2 — Analytics engine ✅

**Answered 2026-08-06: Umami. Plausible CE rejected** (AGPL-3.0, outside
policy).

Note this interacts with C5: Umami is the chosen engine but is **not deployed at
launch**. The decision matters for when analytics is switched on, not for M14's
shipped output.

### E3 — Rejected picks, recorded 🟢

| Rejected                  | Reason                                                                                 | Chosen instead                              |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| `next-mdx-remote`         | MPL-2.0                                                                                | `@mdx-js/mdx` `evaluate()` (MIT)            |
| GSAP / ScrollTrigger      | Not an OSI licence                                                                     | `motion` (MIT)                              |
| Lenis / Locomotive Scroll | MIT, but they rewrite native scrolling — banned by the motion contract, not by licence | `position: sticky` + scroll-linked progress |
| Resend                    | Proprietary SaaS                                                                       | Nodemailer over Workspace SMTP              |
| Cloudflare Turnstile      | Proprietary SaaS                                                                       | Altcha (MIT)                                |
| `@vercel/analytics`       | Proprietary, and a Vercel-only API                                                     | Umami (deferred, C5)                        |
| Plausible CE              | AGPL-3.0                                                                               | Umami (MIT)                                 |

---

### E4 — Licence policy amendment ✅ **RULED 2026-08-06**

The M0 audit found the policy as written was not satisfiable by this stack.
The owner ruled:

**Added to the allow-list:**

| Licence                  | Reasoning                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `BlueOak-1.0.0`          | Permissive, explicit patent grant, no conditions we cannot meet. |
| `Python-2.0`             | OSI-approved permissive, no copyleft.                            |
| `CC-BY-4.0`, `CC-BY-3.0` | Admitted **with a condition** — see below.                       |

**The CC-BY condition, as ruled:** CC-BY is not a free pass, it obliges
attribution. A real attribution surface must ship, listing every CC-BY package
with author and licence link, **generated by `scripts/licenses.mjs` so it can
never drift from the actual tree.**

Implemented as a generated **`NOTICE`** file at the repository root. The audit
rebuilds it from the installed tree on every run and **fails the build** if the
committed copy differs — so attribution cannot fall behind the code. The public
`/lisanslar` route rendering it is scheduled with the other legal pages at M12
(the ruling permitted either).

**Approved as named exceptions, deliberately NOT folded into the allow-list:**

| Package                                       | Licence                     | Scope                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@img/sharp-*`                                | LGPL-3.0-or-later (libvips) | **Production.** Unmodified, dynamically linked, which LGPL permits. Licence text ships in `NOTICE` §3. The alternative is losing `next/image` — a worse trade for an image-heavy site. |
| `lightningcss`, `lightningcss-win32-x64-msvc` | MPL-2.0                     | Build-time. Same reasoning as `axe-core`.                                                                                                                                              |

Both stay printed on every `npm run licenses` run.

**Result:** 476 packages, **0 violations**, 5 named exceptions (all approved),
3 attribution entries. Detail in `docs/LICENSES.md` §5.

One implementation note: `spdx-ranges` carries `(MIT AND CC-BY-3.0)`, so the
audit needed SPDX **expression** support — `AND` requires every term allowed,
`OR` requires any one. Without it a compound string matched nothing and would
have needed a spurious exception.

---

## F. Verification tasks

Assumptions that must be confirmed by testing, not by reasoning.

| #   | Assumption                                                                       | How it gets confirmed                                                                                     | When    | Status                                                  |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| F1  | Fraunces and Manrope render `ı İ ş Ş ğ Ğ ü Ü ö Ö ç Ç` in the shipped subsets     | `npm run fonts` decodes the woff2 cmap and asserts all 20 codepoints; `/styleguide` §1 is the visual half | M1      | ✅ **Both pass**                                        |
| F2  | Every dependency's actual licence matches the table in `docs/LICENSES.md`        | `npm run licenses` after a real install                                                                   | M0      | ✅ **Done** — audit output now in `docs/LICENSES.md` §3 |
| F3  | Vercel Node functions can open outbound SMTP on port 587                         | A real send from a preview deployment                                                                     | M11     | ☐                                                       |
| F4  | The aurora holds AA contrast for overlaid text at **every** scroll position      | Worst-case check per section, not at rest                                                                 | M7, M15 | ☐                                                       |
| F5  | View Transitions degrade cleanly where unsupported                               | Test in a browser without `document.startViewTransition`                                                  | M8      | ☐                                                       |
| F6  | The `static` motion tier heuristics do not misclassify mid-range Android devices | Real-device check; absent APIs must resolve to `full`                                                     | M15     | ☐                                                       |
| F7  | Turkish stem matching does not flag `kürk`, `kürek`, `şükür`, `küresel`          | Fixture tests, both directions                                                                            | M3      | ✅ **Passed** — plus `küre`, `kürkçü`, `kürekçi`        |
| F8  | The C9 disclaimer sentence passes the guard unmodified                           | Fixture test on the exact sentence                                                                        | M3      | ✅ **Passed** — 0 blocking, 1 advisory (`tıbbi`)        |
| F9  | `%100` is caught as blocking and is not masked by the `%\d` warning              | Fixture test, ordering asserted                                                                           | M3      | ✅ **Passed** — both directions                         |

---

## G. New questions raised during the build

### G1 — TypeScript major version 🟢 → resolved at M0

**Not a question for the owner; recorded because it deviates from what a reader
would expect from "latest".**

TypeScript **7.0.2** is the current `latest` tag. It is **not usable yet**:
`typescript-eslint@8.66.0` declares `typescript: ">=4.8.4 <6.1.0"`. Installing
TS 7 would either break linting or force `--force`, which hides a real
incompatibility.

**Resolved:** pinned to **TypeScript 6.0.3** — the newest stable release inside
the supported range. Revisit when `typescript-eslint` widens its peer range.

### G2 — Analytics environment variables 🟢

Given C5, `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID` are in `.env.example` but
are **unused at launch** and documented as such. They are not required by
`env.ts`; a missing value is not a startup failure.

---

### G3 — ESLint major version 🟢 → resolved at M0

Same shape as G1, recorded for the same reason.

ESLint **10.8.0** is current. It is **not usable yet**: `eslint-config-next@16.3.0`
pulls `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react`,
all of which cap at `eslint@^9`. Installing ESLint 10 succeeded only with npm
overriding three peer dependencies — which does not fix the incompatibility, it
just stops npm mentioning it.

**Resolved:** pinned to **ESLint 9.39.5**. Peer resolution is now clean — zero
`ERESOLVE` warnings. Revisit when `eslint-config-next` updates its plugins.

### G4 — `licenses` is a wrapper, not the raw CLI 🟢 → M0 deviation

`docs/LICENSES.md` originally specified
`license-checker-rseidelsohn --onlyAllow "…"`. That proved inadequate in
practice: it exits on the **first** violation (so the 20 findings in E4 would
have surfaced one run at a time) and its exclusion list is a semicolon string
with nowhere to record _why_.

**Resolved:** `npm run licenses` runs `scripts/licenses.mjs`, which wraps the
same tool's `--json` output and enforces `licenses.exceptions.json`. It reports
every violation at once, requires a written reason per exception, fails if an
excepted package **changes licence**, flags stale exceptions, and prints
everything still awaiting approval on each run.

A small deviation from the M0 file list, taken because the specified approach
would have hidden the E4 finding rather than surfaced it.

---

### G5 — `max-w-prose` is a static Tailwind utility 🟢 → resolved at M1

`docs/DESIGN-SYSTEM.md` §2.4 specified a 68ch reading measure. Naming the token
`--container-prose` produced a **65ch** measure instead: Tailwind ships a
_static_ `max-w-prose` utility that `--container-*: initial` does not clear, so
the token was silently shadowed.

Nothing errored — the page would simply have been laid out to the wrong measure
site-wide. Caught by reading the built CSS rather than trusting the source.

**Resolved:** renamed to `--container-reading` / `max-w-reading`. Recorded in
`docs/DESIGN-SYSTEM.md` §2.4 so nobody renames it back.

### G6 — `next/font` cannot read a referenced constant 🟢 → resolved at M1

`next/font/local` statically analyses its call site at build time. Passing
`declarations: [{ prop: 'unicode-range', value: LATIN }]` where `LATIN` is a
module constant — or any concatenation — resolves to `undefined` and the build
fails with ``missing field `value` ``.

**Resolved:** the unicode ranges are inlined as literals at each of the four
call sites, with a comment saying why. Do not refactor them into a variable.

---

### G7 — `env.ts` parses secrets lazily 🟢 → resolved at M2

`docs/ROADMAP.md` M2 asked for env parsed "once, throwing at startup on a
missing required variable". Implemented as two tiers, because the literal
reading breaks the build:

`next build` evaluates route modules during route collection. An eager
module-scope parse of required secrets would therefore make **`npm run build`
impossible without a populated `.env.local`** — a worse failure than the one
the check exists to prevent, and one that would land the moment M11 adds a
route importing it.

**Resolved:** public/non-secret env is parsed eagerly at module load. Secrets
(`SMTP_*`, `ALTCHA_HMAC_KEY`) are parsed on first access and memoised — still
exactly once. `assertServerEnv()` is available for eager validation, and M11's
contact route calls it at module scope so a misconfigured deployment fails
immediately rather than accepting submissions it cannot deliver.

Verified by running `serverEnv()` with an empty environment: it throws, naming
every missing variable.

### G8 — Skip link depended on the stylesheet 🟢 → fixed 2026-08-06

Reported as "visible at rest, above the header in normal flow". Reproduced in
**dev only**: Turbopack injects the stylesheet via JS, so for the first few
hundred milliseconds no utility class applied and the link — the first element
in `<body>` — rendered `position: static` at `y: 8, height: 17`. Production was
never affected; its stylesheet is a render-blocking `<link>` in `<head>`.

The underlying problem was the guarantee, not the symptom: `sr-only` hides an
element _only once the stylesheet loads_. That is the wrong guarantee for the
first control a keyboard user meets, and it fails outright if the stylesheet
404s.

**Fixed:** position and visibility now come from inline critical CSS hoisted
into `<head>`, so the link is out of the viewport from the first paint.
Appearance still comes from tokens. Four browser tests cover it, including one
that loads the page **with the stylesheet blocked** — that test fails on the
old implementation with exactly the reported symptom.

Also found and fixed while investigating: the M0 placeholder page rendered its
own `<main id="main">` inside the layout's, giving two landmarks and a
duplicate id.

---

### G9 — Guard scoping decisions 🟢 → resolved at M3

Three narrowings, each made because the obvious implementation would have made
the guard untrustworthy rather than stricter.

**Percentage rules scan rendered text only** (`.html`/`.rsc`), not `.js`.
Minified framework code is full of `n%100` modulo arithmetic. A guard that
fails the build because the framework formatted a number is one that people
start bypassing — which is worse than a narrower rule. Any `%100` a component
actually renders still reaches the HTML and is caught there.

**Rule 2 is narrowed in JavaScript** to SHOUTING tokens (`{{LEGAL_ENTITY}}`),
because `{{` is ordinary syntax in minified code. In rendered text, any `{{…}}`
still fails.

**`terapi` is matched at a word boundary**, so `fizyoterapi` is _not_ flagged.
That follows from the ruling — the blocking list is the sixteen terms as
specified, not a family of related words. If the owner wants `fizyoterapi`
caught, it is a one-line addition to the advisory tier; recorded here rather
than assumed.

Not a narrowing, but recorded for the same reason: **`1 numaralı` is matched as
specified, so `bir numaralı` is not caught.** Adding it would be inventing
scope beyond the ruling.

### G10 — Channel links need a `data-channel` attribute 🟢 → new contract

Guard rule 3 catches bare-scheme hrefs (`tel:`, `mailto:`, numberless
`wa.me/`) anywhere. But `href="#"` is only wrong on a _channel_ button — it is
perfectly ordinary on an in-page anchor — so the guard cannot judge it without
a marker.

**Contract:** every contact-channel link carries
`data-channel="whatsapp|phone|email|instagram"`. Recorded in `CLAUDE.md` §12
and added to M11's acceptance criteria, since that is where the first channel
link is built.

---

### G11 — Content layer clarifications 🟢 → resolved at M4

Three things `docs/ARCHITECTURE.md` §3.4 left ambiguous, settled while
implementing and written back into the doc.

**Seven integrity checks, not six.** §3.4 always listed seven bullets; the M4
criterion said "six". The doc is now a numbered table with stable check ids so
the count cannot drift again.

**Check 5 applies to services only.** "Filename equals `slugify(title)`" is
right for services — every one of the twenty planned names folds cleanly. It is
wrong for posts: `docs/CONTENT-PLAN.md` §4 plans _"Lazer Epilasyon Nedir?
Uygulama Nasıl İlerler"_ at `/blog/lazer-epilasyon-nedir`, so the same rule
would have rejected all fifty planned posts at M10. Posts remain covered by
check 4 (valid ASCII slug).

**Check 7 needed an implementation, not just a rule.** "A draft post is
referenced from a published one" has no explicit reference field to check —
related posts are derived, not authored. It is implemented by scanning MDX
bodies for `/blog/<slug>` links, which makes it a genuine broken-link check
rather than one that could never fire.

### G12 — When invalid content fails 🟢 → M4, closes at M8

M4's criterion says invalid frontmatter must fail **the build**. It does — but
only once a route imports the content layer, which happens at M8. Verified by
temporarily adding the import: both a schema failure and an integrity failure
were reproduced against a real `next build`, each naming the file and every
offending field.

Until M8 the guarantee holds through a different gate: `npm run test` imports
the content layer at module scope, so invalid content fails `npm run verify`
and therefore CI. Recorded so nobody later reads "it doesn't fail the build" as
a hole rather than a sequencing detail.

> ✅ **Closed at M7**, earlier than expected: the home page reads
> `getAllServices()` and `getAllPosts()` to build the service panels and the
> blog teaser, which puts the content layer in the build graph. Invalid
> frontmatter and dangling references now fail `next build` directly.

---

### G13 — A stale dev server survived a fix 🟢 → gate closed 2026-08-06

**What happened.** During M4 the content fixture was deliberately broken to
prove that invalid frontmatter fails the build, and a route temporarily
imported the content layer. Both were reverted and committed correctly — the
repository was never in a bad state, and `git show HEAD` confirms it.

But a `next dev` server started hours earlier was still running. It had
hot-reloaded through the broken window, and a module-scope throw in the dev
module registry does not recover on HMR. It kept serving the error long after
the files were fixed. `npm run verify` was correctly green; `localhost:3000`
was throwing. Nothing was wrong with the code, and nothing could have been
detected by inspecting it.

**Two real causes:**

1. **Process hygiene.** Background dev servers were launched and not reliably
   stopped — `pkill` does not match them on Windows. Recorded in `CLAUDE.md`
   §4 with a command that does work.
2. **A genuine coverage hole.** `/styleguide` is dev-only: it 404s in
   production, so the production build never exercises it and **no gate loaded
   it at all**. A broken design-review surface would have sat broken with a
   green `verify`. M5's motion demo is dev-only too, so the hole was about to
   get bigger.

**Closed by** a second Playwright project, `development`, running against
`next dev` and asserting on each dev-only route: HTTP 200, no page error, no
console error, no Next error overlay, and real content present. Plus a
`production` health check asserting `/styleguide` and `/motion` 404 there.

**And by `scripts/free-ports.mjs`**, wired as `pretest:e2e`. The hygiene
problem recurred twice more while building M5, so it is now automated rather
than remembered: it stops anything holding 3000/3100/3101 and any stray
`next dev` for this project. Next refuses a second dev server in the same
directory **whatever port it is given**, so a leftover on :3000 breaks a test
run on :3101 — and `next dev` spawns children that outlive a SIGTERM on
Windows.

Verified by breaking `/styleguide` on purpose — the dev project failed with the
underlying error; the production build was, correctly, unaffected.

**What did NOT need fixing:** the content gate. Breaking the fixture and running
`npm run test` fails with exit 1, naming the file and both offending fields, so
`npm run verify` would not have gone green on a genuinely bad commit. That was
confirmed rather than assumed.

### G14 — The guard drowned itself in false positives 🟢 → fixed at M8

**What happened.** The first real build with images produced **105 advisory hits
and several hundred percentage-claim warnings**. Not one percentage was a claim.
`next/image` emits `?url=%2Fimages%2Fservices%2F….webp` once per breakpoint, and
`%2` matches `/%\s?\d/`. Twenty service pages, a dozen breakpoints each.

This is the failure mode the guard's own notes warn about: _warnings that fire
on every page teach people to ignore warnings_, which costs more than the rule
is worth. At that volume the 105 genuine advisories would have been invisible.

**Fixed the way the M7 inline-style false positive was fixed** — the rule stays
exactly as strict and its INPUT is narrowed. `style="…"` was already masked;
URL-bearing attributes (`src`, `srcset`, `href`, `action`, `poster`, and their
RSC/JSON forms) now are too. A percentage claim is something a reader reads, so
it lives in a text node, never in a URL.

**`content="…"` is deliberately not masked** — a meta description is prose, and
an efficacy claim there is precisely what the rule exists to catch. A fixture
test asserts `%100` inside a `content` attribute still blocks.

Recorded in `CLAUDE.md` §12 alongside the other load-bearing details.

### G15 — A test regex reproduced the ASCII `\b` bug 🟢 → fixed at M8

`CLAUDE.md` §12 explains at length that JavaScript's `\b` is ASCII-only and
matches inside Turkish words. The M8 content-posture checks then used
`/\b(…|nm\b|…)\b/` — and it matched inside **düşünmüyoruz**, failing a page that
contains no equipment reference at all.

The rule is documented; the reflex is not. Any new pattern touching Turkish
needs `(?<![\p{L}\p{N}])` / `(?![\p{L}\p{N}])` with `/u`, and the posture checks
now share one helper that does. A test pins the behaviour in both directions, so
the next term added cannot reintroduce it.

**Worth noting for future milestones:** this is the second time this exact bug
has appeared, in two different files. Anything that matches Turkish text should
start from the guard's boundary helpers rather than from `\b`.

### G16 — Client-component props are payload 🟢 → fixed at M8

`ServicesPanels` is a client component. It took `readonly Service[]` and rendered
twenty titles — but every prop of a client component is serialised into the RSC
payload, so **all twenty MDX bodies, roughly nine thousand words, shipped inside
the home page**. Nothing rendered them; they were simply there.

Found by a browser test that was looking for something else entirely: a check
that the word "görüş" never appears on the home page (part of the testimonials
absence rule) matched inside a service body in the serialised stream.

**Fixed by narrowing on the server** — `toListItems()` maps to `{slug, title,
group}` at the call site in `page.tsx`. Narrowing inside the component would be
too late; by then the wide object has already been serialised.

**A second lesson, learned by failing the build:** `toListItems` could not live
in `ServicesPanels.tsx`, because anything exported from a `'use client'` module
is a client reference and calling it during server rendering fails with
_"attempted to call it from the server"_. It lives in
`src/components/sections/service-list-item.ts`.

Two tests now hold the line: a unit test asserting the component's props type,
and a browser test asserting body copy never appears in the home page payload.

**Applies to every future client component that takes content** — `PostCard` and
the blog teaser at M9/M10 have the same shape. **Checked at M9:** `PostCard`,
`PostGrid`, `CategoryPills`, `Pagination` and `PostListing` are all Server
Components, so no post crosses the boundary at all.

### G17 — A post template with no posts is untestable 🟢 → closed at M9

**The hole.** M9 builds the post template; M10 writes the posts. In between,
`/blog/[slug]` generates **zero pages**. No production test can load a route
that does not exist, so `npm run verify` would have gone green over a template
nobody had rendered once — the same shape as the `/styleguide` gap at G13, and
the same reason it matters: the gate would have been reporting on nothing.

**Closed with one `draft: true` preview post**,
`content/blog/sablon-onizleme.mdx`. `visible()` honours `includeDrafts` only
outside production, so the post has a route under `next dev` and none in the
build that ships. Ten tests in the `development` project drive it: the §6
blocks, heading order, the FAQ opening without JavaScript, exactly one CTA
inside `<main>`, no byline, `noindex`, and 320px. The production project asserts
the other half — 404, and no build artefact containing its title.

**It states nothing about the business.** It describes the template, in Turkish,
and says in its own body that it is not a real post.

**Scheduled for deletion at M10**, like the M4 fixtures before it — and this
time the removal milestone is in the roadmap rather than only in a comment.

**If the owner prefers not to ship a fixture at all**, deleting the file is the
only change required; the milestone still passes, with the post template
unexercised until M10.

### G18 — Pagination that would need retrofitting 🟢 → decided at M9

The roadmap specified pagination for `/blog` only. But `docs/CONTENT-PLAN.md`
§4 puts **fourteen** of the fifty planned posts in `cilt-yenileme-rehberi`,
which is more than one page of twelve — so a category archive will overflow, and
adding `/blog/kategori/[slug]/sayfa/[page]` after those posts were published
would change archive URLs that already existed.

Built now instead. It shares `src/lib/pagination.ts` with the blog index, so it
cost one route file and no new concepts. The same primitive owns the page-1 rule
for both, which is what makes `…/sayfa/1` structurally impossible to emit rather
than a convention someone has to remember.

**Open for M13:** empty listings currently declare `noindex, follow`, flipping
by themselves once a post publishes. Confirm that is the wanted behaviour when
the full robots/canonical pass happens. **Note after M10:** with Batch 1
published, `/blog` and all six archives are non-empty and therefore indexable
already — the flag has done its job and flipped itself.

### G19 — Twelve posts in one pass read like twelve posts in one pass 🟢 → M10

**What happened.** The first draft of Batch 1 came out **909–972 words** — a
52-word spread across twelve articles. Every post had ten or eleven `h2`
sections of two to three paragraphs, opened with a definition and closed with
the same "hangi başlıklarla birlikte anılır" move.

Nothing in it was factually wrong and nothing tripped the guard. It was still
the most obviously machine-written thing this project has produced, because
uniformity at that scale is not something a person does.

**Fixed by reshaping rather than lengthening.** Length now follows the topic:
broad subjects (`lazer-epilasyon`, `kalıcı makyaj`, `leke görünümü`, `gelin
takvimi`) run 1014–1119; posts answering one narrow question
(`microblading`, `kirpik lifting`, `hydrafacial`) stay near 910. Openings vary —
a definition, a misconception, a distinction between two things, a question
answered flatly in the first sentence.

**Three blunt tests now guard it**: the word-count spread, the number of
distinct section counts, and that no two posts share an opening sentence. None
of them can detect good writing. All three fail on the specific failure mode
that occurred, which is what a regression test is for.

**Ruled 2026-08-06 by the owner: accepted.** Batch 2 (posts 13–50) is written in
**several passes, not one**. Recorded here rather than only in the roadmap
because it binds every remaining content milestone, not just the next one.

### G20 — The contact route cannot assert its env at startup 🟢 → M11

`src/config/env.ts` used to promise that the contact route would read the server
env **at module scope**, so a misconfigured deployment failed immediately rather
than on the first enquiry. That is the better behaviour and it is not available:
`next build` evaluates route modules during route collection, so an eager parse
of required secrets makes a local build — and CI — impossible without a
populated `.env.local`. A build that cannot run without production credentials
is a worse failure than a late one.

**What happens instead:** the route verifies on the first request, logs exactly
which variables are missing, and returns the generic message. The gap between
"deployed" and "known broken" is one enquiry, and `docs/DEPLOY.md` carries the
check as a pre-flight item. The stale promise in `env.ts` was corrected.

### G21 — A dynamic route escapes the content guard 🟢 → DECIDED at M13

`npm run guard` scans **prerendered output**. `/iletisim` is rendered per
request (it issues a signed token and reads `searchParams`), so it emits no
`.html` for the guard to read, and its server-rendered copy is invisible to the
gate that exists to catch banned language.

**Closed for now** by a unit test that runs the real `scanText` rules over
`src/config/forms.ts`, where every string on that page lives. Partial cover also
comes free: the form is a client component, so its strings appear in
`.next/static/chunks` and the guard does scan those.

**DECIDED at M13: the guard is not taught to render.**

Booting a server inside `scripts/guard.mjs` would couple a fast static scan to a
running application, add a server lifecycle to a script whose whole value is
that it cannot fail for interesting reasons, and duplicate machinery the browser
suite already has — it starts the production server for every run anyway.

So the HTML moves to the guard. `tests/e2e/production/guard-dynamic.spec.ts`
fetches `/iletisim` in all four states it can render (including each no-JS
outcome), writes each into a fixture build tree, and runs **the guard's own CLI**
over it through the `--root=` flag M12 added. Same script, same lexicon, same
`guard.allow.json`.

A fifth test poisons the fetched HTML with a known-bad sentence and asserts the
pipeline reports it — so the four green checks cannot be green because the
plumbing is broken.

**Guard coverage is now 100% of routes.** Static ones through build output,
dynamic ones through this. Neither path reimplements the other, and `/iletisim`
remained the only dynamic route, which is why the cheaper answer was the right
one.

### G22 — One env blob coupled two unrelated secrets 🟢 → fixed at M11

The contact page returned **500 with no mailbox configured** — which is the
state the site is in today.

`serverEnv()` parsed one schema containing both the challenge signing key and
the six SMTP variables. Issuing a page token needs the key; it does not need a
mailbox. But the single parse tripped over the missing SMTP values and took down
a page that sends nothing.

Split into `spamEnv()` and `mailEnv()`, parsed independently. The page renders,
the form validates, the spam gate runs, and the failure is confined to delivery
— which is exactly what "the credential is the last remaining step" should mean.

**Found by serving the production build**, not by reading the code. Worth
repeating for M12: a milestone that adds a required secret should be exercised
against a server that does not have it.

### G23 — A silent worker left the form stuck on "gönderiliyor" 🟢 → M11

The proof-of-work solver was handed to `altcha-lib`'s `solveChallengeWorkers`,
which speaks its own message protocol, while the worker implemented ours. No
error was raised: the worker simply never answered, `ensure()` never resolved,
and the submit handler waited forever. The status line sat at "Mesajınız
gönderiliyor." and the form could not be sent at all.

Two fixes, and the second matters more than the first:

1. The worker is driven directly, with our protocol on both ends.
2. **The solve is bounded.** Anything that does not answer within
   `SPAM_LIMITS.powTimeoutMs` resolves to `null`, and the signed page token
   carries the submission. A spam check that can block a legitimate send is a
   worse bug than the spam it prevents.

Caught by a browser test that filled the form and waited for the live region —
no unit test would have seen it, because every piece worked in isolation.

### G24 — The legal-entity gate had to move to survive `verify` 🟡 → decided at M12

**The conflict.** `docs/ROADMAP.md` M12 asks for two things that cannot both be
true while B2 is open:

1. `{{LEGAL_ENTITY}}` reaches build output, so `npm run guard` refuses the
   build — the site cannot ship without the ünvan.
2. `npm run verify` exits 0 at every commit, and CI stays green.

A page that prints the token fails the guard, and the guard is inside `verify`.
So either the gate is real and no commit is ever green, or `verify` is green and
the token is not in output. The roadmap wrote (1) before there was a `verify`
that included the guard.

**Decided:** the gate moves from the build to the **deploy**, and gets stronger.

- The legal pages print **no entity at all** while it is unresolved. Not a
  guess, not the token, not a plausible placeholder — a sentence saying the
  ünvan is pending and when it lands. Nothing was invented.
- `{{LEGAL_ENTITY}}` is still the sentinel value in `src/config/legal-entity.ts`,
  and **guard rule 2 is unchanged**. It is now proven end to end rather than
  assumed: a test runs the real `scripts/guard.mjs` against a fixture build tree
  containing the token and asserts exit 1, and the same was demonstrated by hand
  against a real production build.
- `npm run preflight` refuses a production deployment while the ünvan is
  unresolved — and additionally while the legal text is unreviewed, the SMTP
  credential is missing, or the signing key is absent. It is wired into
  `vercel.json`'s build command, so the failure lands between "pushed" and
  "live". Deliberately **not** in `verify`, where these values are legitimately
  absent.

**Net effect.** The site still cannot go live with an unresolved entity. Four
things now block a deploy where one blocked a build, and every commit can be
green. `scripts/guard.mjs` gained a `--root=` flag so the gate can be
demonstrated against a fixture tree; it changes which directory is walked and
nothing about what the rules match.

**Owner action:** set `LEGAL_ENTITY` in the deployment environment. One value,
no code change. See `docs/STATUS.md`.

### G25 — The guard's first allowance is a quotation of statute 🟢 → M12

`scripts/guard.allow.json` shipped empty through M11, which was the better
outcome and is recorded as such (C9).

M12 added exactly one entry. KVKK m. 11/1-e reads "…silinmesini veya **yok
edilmesini** isteme", and `yok ed` is a blocking term — it exists to stop
"lekeleri yok eder". Paraphrasing a data-subject right in an aydınlatma metni
would misstate the law, so this is the case the exception mechanism was built
for (`CLAUDE.md` §9: false positives go in the allow file with a justification,
never by weakening the pattern).

The allowance is scoped to that exact phrase. A test asserts both directions:
the quoted right passes, and "Lekeleri yok eder." still blocks. The
"ships empty" test became an exact-list test, so a second entry has to be added
by name with a human deciding it belongs.

### G26 — A dead branch still ships its dynamic import 🟢 → M14

M14 requires that the analytics adapters be **absent from the production
bundle**, not merely inactive.

The obvious implementation does not achieve it:

```ts
if (analytics.ga4.enabled) {
  // statically false
  const { Ga4Script } = await import('./adapters/Ga4Script');
}
```

**Turbopack emits the dynamic import's chunk anyway.** `googletagmanager.com`
appeared in four build files. Gating on a build-time `NEXT_PUBLIC_*` literal
instead — the technique M5 used successfully for the `?motion=` override —
made no difference: two non-map files still contained it. Both were checked by
grepping `.next/`, not reasoned about.

**Resolution.** Umami is wired (Server Component, URL from `env`, no consent
needed, no third-party host in the source). GA4 and the Meta Pixel are complete
but **not imported by anything**, so their code cannot enter the graph. Turning
one on adds an env var, a flag, and one uncommented line — documented at the
import site.

The third step is a feature rather than friction: it means the two config
changes alone cannot put a tracker into the bundle of a site that has decided
not to track anyone. A test greps the build for four tracker strings and fails
on any of them.

### G27 — No Content-Security-Policy yet 🟡 → post-launch decision

Security headers ship in `next.config.ts` — Referrer-Policy,
X-Content-Type-Options, X-Frame-Options, Permissions-Policy and HSTS, all
verified against the running production server. **CSP is not among them.**

The layout ships two inline scripts by design:

1. the motion-tier resolver, which must run before first paint — resolving the
   tier after hydration flashes animated content before telling it not to
   animate (M5);
2. the JSON-LD block, which is a `<script type="application/ld+json">`.

A meaningful CSP therefore needs per-request nonces, and a nonce makes every
page dynamic — turning a fully prerendered site into a server-rendered one.
`'unsafe-inline'` would be the alternative, and a CSP with `'unsafe-inline'`
buys almost nothing while looking like it does.

**Not decided in passing.** The site has no user accounts, no third-party
scripts, no ad network and no user-generated content, so the attack surface a
CSP would narrow is small today. That changes the moment an advertising tag is
switched on (C6) — which is the right moment to take the dynamic-rendering
trade seriously.

**Revisit when:** GA4 or the Meta Pixel is enabled, or any third-party script
is added.

---

## H. Content posture — standing rule

**Recorded 2026-08-06. This is a working rule, not a question.** Also written
into `CLAUDE.md` §9 and `docs/CONTENT-PLAN.md`.

> Service and page copy stays **general and non-specific**. The business has not
> opened and few operational details are confirmed.

**Never invent specifics to fill space:**

| Never publish                                 | Why                                                          |
| --------------------------------------------- | ------------------------------------------------------------ |
| Session durations                             | Not confirmed (C4). A published duration is a promise.       |
| Product or device brand names                 | Not confirmed, and naming a device makes a capability claim. |
| Staff names, credentials or qualifications    | No team is named publicly yet.                               |
| Claims about equipment                        | Unverifiable, and edges toward medical positioning.          |
| Depths, concentrations, wavelengths, settings | Regulatory exposure (A2) and unverifiable.                   |
| Session counts, intervals, recovery times     | Outcome promises in disguise.                                |

**Where a section would need a fact we do not have, cut the section rather than
pad it.** A shorter page that is entirely true is better than a longer one
padded with plausible detail.

The effort goes into **design and motion quality**, not into invented detail.

**Consequences already applied:**

- The "Süre" block is removed from the service page structure
  (`docs/CONTENT-PLAN.md` §2), not merely left rendering `null`.
- Service body target reduced from 500–800 to **350–600 words** — the honest
  length for what is actually known.
- `suitableFor` and `aftercare` stay general; neither may carry a number.

---

## I. Answered — kept for the record

| Question            | Answer                                                 | Date       |
| ------------------- | ------------------------------------------------------ | ---------- |
| Content source      | MDX + Zod frontmatter; Git-backed admin UI later       | 2026-08-05 |
| Contact backend     | Route Handler + Nodemailer + Altcha; nothing persisted | 2026-08-05 |
| Deploy target       | Vercel, but the app stays self-hostable                | 2026-08-05 |
| Email               | Google Workspace SMTP, not Resend                      | 2026-08-05 |
| Spam protection     | Altcha, not Turnstile                                  | 2026-08-05 |
| Analytics engine    | Umami; Plausible CE rejected (AGPL)                    | 2026-08-05 |
| Dark mode           | No. `color-scheme: light`, semantic tokens throughout  | 2026-08-05 |
| English version     | No. Turkish only, no i18n scaffolding                  | 2026-08-05 |
| Prices              | None, anywhere, not even ranges                        | 2026-08-05 |
| Package manager     | npm; Node 24 pinned                                    | 2026-08-05 |
| Author byline       | `PENDING`; no fabricated name                          | 2026-08-05 |
| Blog volume         | System scales to 50+; 12 written now                   | 2026-08-05 |
| Permits             | Assume all six covered; verify pre-launch              | 2026-08-06 |
| Destination inbox   | `info@marenbeauty.com`, no alias                       | 2026-08-06 |
| SMTP auth           | App password on `info@`                                | 2026-08-06 |
| Canonical host      | Apex; `www` 301s to it                                 | 2026-08-06 |
| Session durations   | Publish none                                           | 2026-08-06 |
| Analytics at launch | Skip; module behind an off flag                        | 2026-08-06 |
| Consent gate        | Live at launch, all tags off                           | 2026-08-06 |
| Disclaimer          | Reword, no allowlist entry                             | 2026-08-06 |
| Lexicon tiers       | 16 blocking, 3 warning                                 | 2026-08-06 |
| `axe-core` MPL-2.0  | Approved, devDependency only                           | 2026-08-06 |
| Motion scope        | Five interactions, two pinned sections. Closed.        | 2026-08-06 |
| TypeScript version  | 6.0.3 — TS 7 blocked by `typescript-eslint` peer range | 2026-08-06 |

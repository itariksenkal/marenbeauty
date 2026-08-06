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

### C11 — What a visit is like 🟡 → unblocks the second pinned section

`ExperienceProcess` — the second and last pinned section — is built and
renders **nothing**, because `src/config/experience.ts` ships with no steps.

Every step would be a claim about how the centre operates: what happens on
arrival, in what order, what is discussed. None of that is confirmed, and the
centre has not opened.

**Need:** three or four short steps describing a visit, in the owner's words.

**Meanwhile:** the section is absent entirely — no heading, no skeleton, no
"yakında". Adding two or more steps makes it appear, pinned, with no code
change. A test covers both states.

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
the blog teaser at M9/M10 have the same shape.

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

# OPEN QUESTIONS — Maren Beauty

Everything that is unknown, undecided, or needs the owner's confirmation.

**The rule this file exists to enforce:** when something is unknown, it is
written here and left unresolved in the code. It is never guessed, never
approximated, and never filled with a plausible-sounding placeholder that could
be mistaken for fact.

**Status:** 🔴 blocking a milestone · 🟡 needed before launch · 🟢 informational

Last updated: 2026-08-05 (Phase 0).

---

## A. Recorded decisions — the owner's call, not our assumption

These are not questions. They are decisions the owner has made, recorded here so
the reasoning is not lost and so no one later mistakes them for our inference.

### A1 — Operating permits 🟢

**Recorded as instructed by the owner.**

> All required permits are being obtained together before opening. The full
> service menu is published on that basis.

**This is the owner's decision, not an assumption made by the build team.**
Publication of all 20 services — including those listed in A2 — assumes the
relevant permits are in hand at launch. The site does not verify, and cannot
verify, permit status.

**Before launch the owner should confirm** that each service in A2 is covered by
the permits actually obtained. If any is not, its page must be removed **before**
the site goes live — a published service page for an unpermitted service is a
live regulatory exposure, and one that the site's own content makes easy to find.

### A2 — Services with regulatory sensitivity 🟡

Listed so the owner can check them individually against the permits, not to
re-open A1.

| Service | Why it warrants a specific check |
| --- | --- |
| `lazer-epilasyon` | Laser device operation is regulated; device class, operator qualification and premises approval are typically specified. |
| `dermapen` | Micro-needling. Needle depth is usually the line between beauty and medical scope. |
| `bb-glow` | Needle-based pigment delivery. Regulatory status is contested in several jurisdictions. |
| `kalici-makyaj` | Permanent make-up — needle-based pigment; usually its own permit and hygiene certification. |
| `microblading` | As above. |
| `kimyasal-peeling` | Acid concentration and depth usually determine whether it is within beauty scope. |

**Question:** does the permit set cover all six, and are there depth /
concentration / device-class limits that the service page copy should reflect?

**Meanwhile:** all six have full pages. Copy stays within appearance language
and describes the session, never a clinical outcome.

### A3 — Other recorded decisions 🟢

| Decision | Recorded |
| --- | --- |
| No prices anywhere, not even ranges | Owner |
| Testimonials ship empty; none fabricated | Owner |
| Photography deferred until after opening; free stock at launch | Owner |
| Turkish only; no i18n scaffolding | Owner |
| No dark mode | Owner |
| No booking system | Owner |
| Display address "Konya, Selçuklu" only | Owner |
| Every dependency MIT / Apache / ISC / BSD | Owner |
| Hosting on Vercel but the app stays self-hostable | Owner |

---

## B. Blocking — a milestone cannot complete

### B1 — Destination inbox for the contact form 🔴 → M11

**Need:** the email address that contact form submissions are delivered to, and
the Google Workspace account that sends them.

**Why it matters:** the form is the only live conversion path pre-launch. Without
a destination, submissions go nowhere.

**Also needed:** whether the `From` address is the authenticated Workspace
account or a verified send-as alias (`iletisim@marenbeauty.com`). Workspace SMTP
rejects a `From` that is neither.

**Meanwhile:** the address comes from `env.ts`. M11 is verified against a test
mailbox, and the blocker is reported — never worked around with a hardcoded
address.

### B2 — Legal entity name 🔴 → M12

**Need:** the registered ünvan (and tax office / registration number, if the KVKK
text should carry them).

**Why it matters:** KVKK aydınlatma metni, çerez politikası and kullanım
koşulları must name the data controller. A wrong or invented name makes the
notice legally worthless.

**Meanwhile:** the literal token `{{LEGAL_ENTITY}}` appears in all three pages,
and `npm run guard` **fails the production build** if any `{{…}}` reaches
output. The site cannot ship with this unresolved. That is deliberate.

### B3 — Google Workspace SMTP credentials 🔴 → M11

**Need:** which authentication method, and the credential.

| Option | Trade-off |
| --- | --- |
| App password (2FA required on the account) | Simplest. One env var. Tied to a personal account. |
| OAuth2 service account with domain-wide delegation | More robust, survives password changes, more setup. |

**Recommendation:** app password for launch, revisit if the sending account
changes hands.

**Also confirm:** Workspace SMTP daily send limits are per-account. Contact form
volume will be far below any limit, but the sending account should not also be
used for bulk mail.

---

## C. Needed before launch

### C1 — Street address and Google Business Profile 🟡

**Decided:** the site displays "Konya, Selçuklu" and omits `streetAddress` from
`LocalBusiness` schema rather than guessing.

**Open:** GBP requires a verifiable address. The owner chooses between:

| Option | Effect |
| --- | --- |
| Publish the street address | Strongest local ranking. Appears on the map and in schema. |
| Service-area listing, address hidden | Address verified with Google but not shown publicly. Weaker for "near me", still eligible for local results. |

**Question:** is district-only a deliberate privacy choice, or simply what was
available at Phase 0?

**Blocks:** post-launch backlog item 1. Does not block any build milestone.

### C2 — Canonical host: `www` or apex 🟡 → DNS cutover

**Need:** `marenbeauty.com` or `www.marenbeauty.com` as canonical. The other 301s
to it.

**Recommendation:** apex. Shorter, and matches how the brand reads.

**Why now:** changing it after indexing means a site-wide redirect and a
temporary ranking dip. Decide once, before launch.

### C3 — Canonical NAP string 🟡

**Need:** the exact Name / Address / Phone string to be used identically in the
footer, schema, GBP and every future directory listing.

**Why it matters:** local ranking depends on exact-match consistency. Agreeing it
before the first listing exists is free; fixing it later means editing every
listing.

**Meanwhile:** name is "Maren Beauty"; address displays as "Konya, Selçuklu";
phone is absent.

### C4 — Session durations 🟡 → affects M8 content

**Need:** realistic session lengths per service, or explicit confirmation that
none should be published.

**Meanwhile:** `durationLabel` is `null` on all 20 services and renders
**nothing** — no dash, no "TBD", no estimate. A guessed duration is a promise the
centre would have to keep.

### C5 — Umami hosting location 🟡 → M14

**Need:** where self-hosted Umami runs, and its hostname.

**Recommendation:** `analytics.marenbeauty.com` on a small VPS or container.
Requires one DNS record — the owner's action, per `CLAUDE.md` §17.

**Alternative:** skip analytics entirely at launch. The site is honest without
it, and it can be added any time.

### C6 — Advertising plans 🟡 → M14

**Need:** will Google Ads or Meta ads run within 12 months?

**Effect:** if no, cookieless Umami only and no consent banner is required. If
yes, the consent gate must be live at launch — retrofitting consent after
tracking has started is the wrong order.

**Meanwhile:** both code paths exist; both flags are `false`; neither ships in
the production bundle.

### C7 — Photography source and budget 🟡 → M8

**Decided:** free stock at launch, one narrow visual family, no stock person
presented as owner, staff or client.

**Open:** the owner may prefer paid licensed stock (Adobe Stock / Stocksy,
roughly €100–300 for a launch set) for images competitors are not also using.
Free stock in this category is heavily reused locally.

**Meanwhile:** every image is recorded in the manifest with `licence`,
`sourceUrl` and `replaceable: true`. Swapping the entire set is a one-file
change.

### C8 — KVKK legal review 🟡 → M12

**Need:** a Turkish lawyer or consultant to review the aydınlatma metni, çerez
politikası and kullanım koşulları.

**Also:** whether the business must register with **VERBİS**. Thresholds depend
on employee count and annual turnover; a single-operator beauty centre is often
exempt, but that determination is not ours to make.

**Meanwhile:** the pages are drafted accurately for what the site actually does
(a form that emails and stores nothing, cookieless analytics). They are not a
substitute for legal review.

### C9 — Disclaimer wording vs the content guard 🟡 → M12

A genuine conflict worth deciding deliberately.

A sensible disclaimer might read *"Bu uygulamalar tıbbi tedavi yerine geçmez."* —
which contains a **banned word** and would fail `npm run guard`.

| Option | Effect |
| --- | --- |
| Add an exact-phrase entry to `scripts/guard.allow.json` with a reason | Keeps the disclaimer, keeps the guard strict everywhere else. **Recommended.** |
| Reword without the banned term | e.g. *"Uygulamalarımız güzellik bakımı kapsamındadır ve tıbbi bir hizmet değildir."* Avoids the exception entirely. |
| Omit the disclaimer | Not recommended. |

**Question:** does the owner want an explicit disclaimer, and if so, in which
form?

---

## D. Proposals awaiting approval

### D1 — Advisory banned-word tier 🟢

The blocking list is exactly as specified: `tedavi`, `terapi`, `kür`,
`iyileştir`, `yok ed`, `garanti`, `kesin sonuç`.

**Proposed additions**, as a **warning** tier only — not blocking unless the
owner asks:

`mucize` · `kalıcı çözüm` · `kanıtlanmış` · `klinik` · `tıbbi` ·
`doktor kontrolünde` · `%100` · `en iyi` · `1 numaralı` · `risksiz` ·
`yan etkisiz` · `ağrısız`

Rationale: each either implies medical status, or is an unverifiable
superlative, or is a claim the centre would have to defend. Several are also
against the tone in `docs/BRIEF.md` §5.

**Question:** add as warnings, promote to blocking, or leave out?

### D2 — Percentage rule tier 🟢 → M3

`%\d` currently **warns**. Promoting it to blocking would prevent any efficacy
percentage reaching production, but would also flag legitimate uses (e.g. a
product concentration in a blog post).

**Recommendation:** keep as a warning; every hit is reviewed by hand before
merge. Promote to blocking if a percentage ever slips through.

### D3 — Sixth signature interaction or third pinned section 🟢

The art direction fixes **five** signature interactions plus grain, and
**exactly two** pinned sections. Anything beyond that needs owner approval and is
recorded here — never added quietly during a build milestone.

No requests outstanding.

---

## E. Licence and dependency flags

### E1 — `axe-core` is MPL-2.0 🟡 → M15

Accessibility testing (`@axe-core/playwright`) is **MPL-2.0**, which is outside
the stated policy of MIT / Apache / ISC / BSD.

**Context:** MPL-2.0 is weak, file-level copyleft. It applies to modifications of
MPL files themselves, not to a project that merely uses the tool. It is a
**devDependency** that never ships in the bundle.

**Options:**

| Option | Effect |
| --- | --- |
| Approve as a devDependency exception | Keeps the best-in-class a11y tooling. **Recommended.** |
| Use Playwright's built-in checks plus manual auditing | No exception needed; materially weaker coverage. |

**Question:** approve the exception?

### E2 — Plausible CE is AGPL-3.0 🟡 → M14

The brief named "self-hostable Umami **or** Plausible CE". Plausible Community
Edition is **AGPL-3.0** — outside the licence policy.

It is a separate service rather than a linked dependency, so the practical risk
is low, but AGPL's network clause is exactly the kind of thing the policy exists
to avoid arguing about later.

**Recommendation: Umami (MIT).** It satisfies the policy with no exception and
meets every stated requirement — self-hostable, cookieless.

**Decision needed only if the owner specifically wants Plausible.**

### E3 — Rejected picks, recorded 🟢

| Rejected | Reason | Chosen instead |
| --- | --- | --- |
| `next-mdx-remote` | MPL-2.0 | `@mdx-js/mdx` `evaluate()` (MIT) |
| GSAP / ScrollTrigger | Not an OSI licence | `motion` (MIT) |
| Lenis / Locomotive Scroll | MIT, but they rewrite native scrolling — banned by the motion contract, not by licence | `position: sticky` + scroll-linked progress |
| Resend | Proprietary SaaS | Nodemailer over Workspace SMTP |
| Cloudflare Turnstile | Proprietary SaaS | Altcha (MIT) |
| `@vercel/analytics` | Proprietary, and a Vercel-only API | Self-hosted Umami |

---

## F. Verification tasks — assumptions we must not carry

Things currently taken on trust that must be confirmed by testing, not by
reasoning.

| # | Assumption | How it gets confirmed | When |
| --- | --- | --- | --- |
| F1 | Fraunces and Manrope both render `ı İ ş Ş ğ Ğ ü Ü ö Ö ç Ç` correctly in the subset build | Visual check at display and body sizes; swap the family if not | M1 |
| F2 | Every dependency's actual licence matches the provisional table in `docs/LICENSES.md` | `npm run licenses` after a real install; audit output replaces the table | M0 |
| F3 | Vercel Node functions can open outbound SMTP on port 587 | A real send from a preview deployment | M11 |
| F4 | The aurora holds AA contrast for overlaid text at **every** scroll position | Worst-case check per section, not at rest | M7, M15 |
| F5 | View Transitions degrade cleanly where unsupported | Test in a browser without `document.startViewTransition` | M8 |
| F6 | The `static` motion tier heuristics do not misclassify mid-range Android devices | Real-device check; absent APIs must resolve to `full` | M15 |
| F7 | Turkish stem matching in the guard does not flag `kürk`, `kürek`, `şükür`, `küresel` | Fixture tests, both directions | M3 |

---

## G. Answered — kept for the record

| Question | Answer | Date |
| --- | --- | --- |
| Content source | MDX + Zod frontmatter; Git-backed admin UI later | 2026-08-05 |
| Contact backend | Route Handler + Nodemailer + Altcha; nothing persisted | 2026-08-05 |
| Deploy target | Vercel, but the app stays self-hostable | 2026-08-05 |
| Email | Google Workspace SMTP, not Resend | 2026-08-05 |
| Spam protection | Altcha, not Turnstile | 2026-08-05 |
| Analytics | Cookieless Umami; GA4/Pixel flagged off | 2026-08-05 |
| Dark mode | No. `color-scheme: light`, semantic tokens throughout | 2026-08-05 |
| English version | No. Turkish only, no i18n scaffolding | 2026-08-05 |
| Prices | None, anywhere, not even ranges | 2026-08-05 |
| Package manager | npm; Node 24 pinned | 2026-08-05 |
| Author byline | `PENDING`; no fabricated name | 2026-08-05 |
| Blog volume | System scales to 50+; 12 written now | 2026-08-05 |

# LICENSES — Maren Beauty

Dependency licence policy, the planned inventory, and rejected alternatives.

> **Audited 2026-08-06 at M0.** 474 packages installed and checked. §3.0 is
> real audit output; §3.1–§3.2 remain forward-looking for packages not yet
> installed and are marked as such. §5 records 20 exceptions the audit
> surfaced — **19 of them awaiting owner approval.**
>
> **The policy as literally written is not satisfiable by this stack.** Tailwind
> v4 requires an MPL-2.0 transformer, Next.js requires CC-BY-4.0 browser data,
> and `sharp`'s prebuilt binaries carry LGPL-3.0 libvips into production. This
> is a real finding, not a technicality — see §5 and §6.

---

## 1. Policy

Every runtime and development dependency must carry one of:

**MIT · MIT-0 · Apache-2.0 · ISC · BSD-2-Clause · BSD-3-Clause · 0BSD ·
CC0-1.0 · Unlicense**

Fonts may additionally be **OFL-1.1**.

Anything else — GPL, LGPL, AGPL, MPL, SSPL, BUSL, CC-BY-NC, "source available",
"free for non-commercial use" — requires an explicit owner-approved exception,
recorded in §5 of this document with a reason. There are no silent exceptions.

### Enforcement

```bash
npm run licenses     # → node scripts/licenses.mjs
```

The policy list and every exception live in **`licenses.exceptions.json`**;
`scripts/licenses.mjs` enforces them over `license-checker-rseidelsohn --json`.

A wrapper rather than the raw `--onlyAllow` flag, because the raw CLI exits on
the **first** violation and its exclusion list is a semicolon string with no
room for a justification. The wrapper:

- reports **every** violation at once;
- **requires** `licence`, `scope`, `reason` and `status` on each exception, and
  fails if any is missing;
- **pins the licence each exception was granted against** — if an excepted
  package changes licence, the audit fails even though an exception exists;
- reports **stale** exceptions that are no longer needed;
- prints every exception still **awaiting owner approval** on each run, so a
  pending decision cannot go quiet.

It never widens the policy silently. Runs as part of `npm run verify`
(`CLAUDE.md` §4).

The audit tool itself satisfies the policy: `license-checker-rseidelsohn` is
**BSD-3-Clause** — confirmed at M0.

---

## 2. Why this matters here

The owner asked for an open-source stack with no proprietary lock-in, and for
the site to remain self-hostable off Vercel. Licence discipline is what makes
that real rather than aspirational: if a dependency's terms restrict commercial
use, redistribution, or self-hosting, the portability guarantee in `CLAUDE.md`
§3 is void.

---

## 3. Inventory

### 3.0 Audit result — M0, 2026-08-06

Real output of `npm run licenses` against the installed tree.

**474 packages audited. 454 conform. 20 need an exception.**

| Licence                              | Count | Status                                  |
| ------------------------------------ | ----- | --------------------------------------- |
| MIT                                  | 340   | ✅ policy                               |
| ISC                                  | 69    | ✅ policy                               |
| Apache-2.0                           | 30    | ✅ policy                               |
| BSD-2-Clause                         | 9     | ✅ policy                               |
| BSD-3-Clause                         | 3     | ✅ policy                               |
| CC0-1.0                              | 2     | ✅ policy                               |
| 0BSD                                 | 1     | ✅ policy                               |
| **BlueOak-1.0.0**                    | 11    | ⚠️ exception — permissive, dev only     |
| **MPL-2.0**                          | 3     | ⚠️ exception — 1 approved, 2 build-time |
| **Apache-2.0 AND LGPL-3.0-or-later** | 2     | ⚠️ exception — **reaches production**   |
| **Python-2.0**                       | 1     | ⚠️ exception — permissive, dev only     |
| **CC-BY-4.0**                        | 1     | ⚠️ exception — build-time data          |
| **CC-BY-3.0**                        | 1     | ⚠️ exception — dev data                 |
| **(MIT AND CC-BY-3.0)**              | 1     | ⚠️ exception — dev data                 |

Direct dependencies installed at M0, all conforming:

| Package                                           | Version | Licence      |
| ------------------------------------------------- | ------- | ------------ |
| `next`                                            | 16.3.0  | MIT          |
| `react`, `react-dom`                              | 19.2.8  | MIT          |
| `typescript`                                      | 6.0.3   | Apache-2.0   |
| `tailwindcss`, `@tailwindcss/postcss`             | 4.3.3   | MIT          |
| `eslint`, `@eslint/js`                            | 9.39.5  | MIT          |
| `eslint-config-next`                              | 16.3.0  | MIT          |
| `typescript-eslint`                               | 8.66.0  | MIT          |
| `prettier`                                        | 3.9.6   | MIT          |
| `prettier-plugin-tailwindcss`                     | 0.8.1   | MIT          |
| `license-checker-rseidelsohn`                     | 5.0.1   | BSD-3-Clause |
| `@types/node`, `@types/react`, `@types/react-dom` | —       | MIT          |

Version notes recorded at M0 (`docs/OPEN-QUESTIONS.md` G1, G3):

- **TypeScript pinned to 6.0.3, not 7.0.2** — `typescript-eslint@8.66.0`
  declares `typescript: ">=4.8.4 <6.1.0"`. TS 7 would break linting.
- **ESLint pinned to 9.39.5, not 10.8.0** — `eslint-config-next`'s transitive
  plugins (`eslint-plugin-import`, `-jsx-a11y`, `-react`) cap at `^9`. ESLint 10
  installs only with peer overrides, which hides a real incompatibility.

### 3.1 Runtime — planned, not yet installed

| Package                    | Expected licence                               | Purpose                                 |
| -------------------------- | ---------------------------------------------- | --------------------------------------- |
| `next`                     | MIT                                            | Framework, App Router                   |
| `react`, `react-dom`       | MIT                                            | UI runtime                              |
| `motion`                   | MIT                                            | Animation (`motion/react`)              |
| `lucide-react`             | ISC                                            | Icons — the only icon set               |
| `@radix-ui/react-*`        | MIT                                            | Accessible primitives under shadcn/ui   |
| `class-variance-authority` | Apache-2.0                                     | Component variants                      |
| `clsx`                     | MIT                                            | Class composition                       |
| `tailwind-merge`           | MIT                                            | Class conflict resolution               |
| `zod`                      | MIT                                            | Validation at every boundary            |
| `gray-matter`              | MIT                                            | Frontmatter parsing                     |
| `@mdx-js/mdx`              | MIT                                            | MDX compilation via `evaluate()` in RSC |
| `remark-gfm`               | MIT                                            | GFM support                             |
| `rehype-slug`              | MIT                                            | Heading ids                             |
| `rehype-autolink-headings` | MIT                                            | Anchor links                            |
| `nodemailer`               | MIT-0 _(verify — has varied by major version)_ | SMTP to Google Workspace                |
| `altcha`                   | MIT                                            | Proof-of-work widget                    |
| `altcha-lib`               | MIT                                            | Server-side challenge and verification  |
| `sharp`                    | Apache-2.0                                     | Image optimisation (`next/image`)       |

### 3.2 Development — planned, not yet installed

Packages already installed at M0 are in §3.0 with their **verified** licences.
The rows below are still forward-looking and are confirmed as each arrives.

| Package                       | Expected licence   | Purpose                                                   |
| ----------------------------- | ------------------ | --------------------------------------------------------- |
| `typescript`                  | Apache-2.0         | Types                                                     |
| `tailwindcss`                 | MIT                | Styling (v4, CSS-first `@theme`)                          |
| `@tailwindcss/postcss`        | MIT                | Build integration                                         |
| `eslint`                      | MIT                | Linting                                                   |
| `@typescript-eslint/*`        | MIT / BSD-2-Clause | TS lint rules                                             |
| `eslint-config-next`          | MIT                | Next.js rules                                             |
| `prettier`                    | MIT                | Formatting                                                |
| `prettier-plugin-tailwindcss` | MIT                | Class ordering                                            |
| `vitest`                      | MIT                | Unit tests                                                |
| `@playwright/test`            | Apache-2.0         | E2E and a11y harness                                      |
| `@axe-core/playwright`        | **MPL-2.0** ⚠️     | Accessibility assertions — **exception required, see §5** |
| `license-checker-rseidelsohn` | BSD-3-Clause       | This audit                                                |
| `@types/*`                    | MIT                | Type definitions                                          |

### 3.3 shadcn/ui

shadcn/ui is **MIT** and is not an npm dependency — components are copied into
`src/components/ui/` and owned by this repo. The MIT notice is retained in
`src/components/ui/LICENSE`. Its transitive Radix packages are ordinary
dependencies and appear in §3.1.

---

## 4. Assets

Assets are not npm packages and are not covered by `npm run licenses`. They are
tracked here and, for images, in `src/config/images.ts`.

### 4.1 Fonts

| Font                | Licence     | Notes                                                       |
| ------------------- | ----------- | ----------------------------------------------------------- |
| Fraunces (variable) | **OFL-1.1** | Display. Self-hosted `woff2`, subset `latin` + `latin-ext`. |
| Manrope (variable)  | **OFL-1.1** | Text. Same treatment.                                       |

OFL-1.1 permits embedding, subsetting and commercial use. It requires that the
font not be sold on its own and that the Reserved Font Name is not reused for a
modified version. Subsetting for web delivery is explicitly permitted.

The full OFL text for each family is committed at `public/fonts/OFL-<family>.txt`.

**No runtime font CDN call, ever** (`CLAUDE.md` §2) — a privacy and portability
requirement, not only a performance one.

### 4.2 Icons

Lucide, **ISC**. Notice retained. No other icon set is permitted.

### 4.3 Images

Launch imagery is free stock. Every image is recorded in
`src/config/images.ts` with `licence`, `credit`, `sourceUrl` and
`replaceable: true` (`CLAUDE.md` §8).

| Source              | Licence          | Attribution                   |
| ------------------- | ---------------- | ----------------------------- |
| Unsplash            | Unsplash Licence | Not required; recorded anyway |
| Pexels              | Pexels Licence   | Not required; recorded anyway |
| Public domain / CC0 | CC0-1.0          | Not required; recorded anyway |

Constraints that apply regardless of licence:

- **No stock photograph of a person may be presented as the owner, a staff
  member or a client.** Model releases cover commercial use, not
  misrepresentation, and under Turkish personality-rights law implying a real
  relationship is a separate exposure.
- **No before/after imagery**, whatever its licence.
- Paid stock (Adobe Stock, Stocksy) remains an option — see
  `docs/OPEN-QUESTIONS.md` C7.

### 4.4 Grain texture

`public/grain.png` is generated for this project. No third-party licence.

---

## 5. Exceptions

Exceptions require owner approval. Each entry records the package, its licence,
why it is acceptable, and the scope of the approval.

| Package                                                | Licence | Scope                                                                     | Status                                                   |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `@axe-core/playwright` (and its `axe-core` dependency) | MPL-2.0 | **devDependency only.** Never modified, never bundled, never distributed. | ✅ **Approved 2026-08-06** — `docs/OPEN-QUESTIONS.md` E1 |

**Approved reasoning, as recorded by the owner:**

> MPL-2.0 is **file-level** copyleft. Its obligations attach to modifications of
> MPL-licensed files themselves. `@axe-core/playwright` is consumed unmodified,
> is a devDependency, and is never shipped or distributed in the built site.
> **No obligation is triggered.**

Scope of the approval: this package and its `axe-core` dependency, as
devDependencies, unmodified. It is **not** a widening of the policy in §1.

Note `axe-core` was **already present at M0**, arriving transitively via
`eslint-plugin-jsx-a11y`. The exception was needed sooner than expected and is
recorded in `licenses.exceptions.json` with `status: "approved"`.

### 5.2 Awaiting approval — surfaced by the M0 audit

Nineteen further exceptions, all transitive, none chosen deliberately. Grouped
by what the owner is actually deciding.

**Group A — reaches production. The real decision.**

| Package                | Licence                          | Why                                                                                                            |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@img/sharp-win32-x64` | Apache-2.0 AND LGPL-3.0-or-later | Prebuilt libvips binary behind `sharp`, which Next.js uses for image optimisation. **Ships in the container.** |
| `@img/sharp-wasm32`    | + MIT                            | WASM fallback build of the same.                                                                               |

`sharp` itself is Apache-2.0; the copyleft is **libvips**, used unmodified and
dynamically linked. LGPL-3.0 permits exactly this, provided the library is not
modified and relinking remains possible — both hold. Obligations reduce to
shipping the licence text and not obstructing replacement of the library.

This is the **only** copyleft component that reaches production. Avoiding it
means giving up `next/image` optimisation, which is not a reasonable trade.
Platform-specific: other `@img/sharp-*` binaries appear on other build hosts and
will need matching entries — expect this list to grow at M16 when the Linux
container is built.

**Group B — build-time only, same reasoning as the approved E1.**

| Package                       | Licence | Why                                                               |
| ----------------------------- | ------- | ----------------------------------------------------------------- |
| `lightningcss`                | MPL-2.0 | Tailwind v4's stylesheet transformer, via `@tailwindcss/postcss`. |
| `lightningcss-win32-x64-msvc` | MPL-2.0 | Its platform binary.                                              |

Runs at build time; no MPL file is modified or distributed. **Unavoidable if
Tailwind v4 is the styling choice** — it is not an optional plugin.

**Group C — data packages, attribution-only, no copyleft.**

| Package           | Licence             | Why                                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------------------- |
| `caniuse-lite`    | CC-BY-4.0           | Browser-support data behind `browserslist`; required by both Next.js and Babel. |
| `spdx-exceptions` | CC-BY-3.0           | SPDX identifier data used by the licence tooling itself.                        |
| `spdx-ranges`     | (MIT AND CC-BY-3.0) | As above.                                                                       |

**Group D — permissive licences the policy simply did not anticipate.**

| Package(s)                                                                                                                                 | Licence       | Why                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chownr`, `common-ancestor-path`, `glob`, `isexe`, `lru-cache`, `minimatch`, `minipass`, `minipass-flush`, `path-scurry`, `tar`, `yallist` | BlueOak-1.0.0 | Blue Oak Model License 1.0.0 — modern permissive licence with an explicit patent grant, no copyleft, no attribution burden. isaacs relicensed much of the npm core tooling to it. At least as permissive as MIT. |
| `argparse`                                                                                                                                 | Python-2.0    | Via `eslint` → `@eslint/eslintrc` → `js-yaml`. OSI-approved permissive, no copyleft.                                                                                                                             |

### 5.3 Recommendation

Groups **C** and **D** are not really exceptions — they are gaps in the policy
list. **Recommend amending §1** to add `BlueOak-1.0.0`, `Python-2.0`,
`CC-BY-4.0` and `CC-BY-3.0`, which removes 15 of the 19 pending entries and
leaves the list genuinely meaningful.

Groups **A** and **B** are real decisions and should stay as named exceptions,
reviewed rather than absorbed into the policy.

Until the owner rules, all 19 remain `awaiting-approval` and are printed on
every `npm run licenses` run. Nothing is hidden.

No other exception is approved.

---

## 6. Rejected alternatives

Recorded so they are not reconsidered by accident.

| Rejected                                         | Licence / reason                                                                                       | Chosen instead                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `next-mdx-remote`                                | **MPL-2.0** — outside policy                                                                           | `@mdx-js/mdx` `evaluate()` (MIT), ~30 lines |
| Contentlayer                                     | Effectively unmaintained                                                                               | Hand-rolled loader in `src/content-layer/`  |
| GSAP / ScrollTrigger / ScrollSmoother            | Not an OSI licence                                                                                     | `motion` (MIT)                              |
| Lenis, Locomotive Scroll                         | MIT, **but they replace native scrolling** — banned by `docs/MOTION.md` §2.3 on behaviour, not licence | `position: sticky` + scroll-linked progress |
| Plausible Community Edition                      | **AGPL-3.0** — outside policy                                                                          | Umami (MIT) — `docs/OPEN-QUESTIONS.md` E2   |
| Resend                                           | Proprietary SaaS; sending data through a third party                                                   | Nodemailer over Google Workspace SMTP       |
| Cloudflare Turnstile                             | Proprietary SaaS; third-party request on every form view                                               | Altcha (MIT), self-hosted proof-of-work     |
| `@vercel/analytics`                              | Proprietary **and** a Vercel-only API (`CLAUDE.md` §3)                                                 | Self-hosted Umami                           |
| `@vercel/kv`, `@vercel/blob`, `@vercel/postgres` | Vercel-only APIs; break portability                                                                    | Not needed — nothing is persisted           |
| Sanity, Contentful, Storyblok                    | Proprietary hosted CMS; vendor lock-in                                                                 | MDX in-repo; Git-backed admin UI later      |
| Google Fonts CDN                                 | Third-party request, privacy exposure, offline breakage                                                | Self-hosted OFL fonts                       |
| Google Maps embed                                | Third-party cookies; and there is no street address to pin                                             | `LocationCard`, text only                   |

---

## 7. Self-hosted services

Not npm dependencies, but part of the stack and subject to the same policy.

| Service                         | Licence                          | Notes                                                                                                                    |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Umami                           | MIT                              | Chosen analytics engine, but **not deployed at launch** (`docs/OPEN-QUESTIONS.md` C5). Plausible CE rejected — AGPL-3.0. |
| Node.js 24                      | MIT                              | Runtime                                                                                                                  |
| Docker base image (`node:24-*`) | MIT (Node) + Debian/Alpine terms | Confirm the base image's own notice at M16                                                                               |

---

## 8. Attribution obligations

| Licence                     | Obligation                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| MIT, ISC, BSD-2, BSD-3      | Retain the copyright notice and licence text in distributed source                                       |
| Apache-2.0                  | Retain notice, licence and any `NOTICE` file; state significant modifications                            |
| MIT-0, 0BSD, CC0, Unlicense | None                                                                                                     |
| OFL-1.1                     | Retain the licence; do not sell the font alone; do not reuse a Reserved Font Name for a modified version |
| MPL-2.0 (if approved)       | Retain notice; disclose modifications **to MPL-licensed files only**                                     |

Because dependencies are consumed as npm packages and their notices remain in
`node_modules`, and because the built site distributes no dependency source
verbatim, no separate third-party notice page is required on the website.

**Reassess if that changes** — for example if a vendored library is copied into
`src/` (as shadcn/ui is; its MIT notice is retained at
`src/components/ui/LICENSE`).

---

## 9. Adding a dependency

1. Check the licence **before** installing.
2. If it is outside §1, stop. Open an entry in `docs/OPEN-QUESTIONS.md` and ask.
   Do not install it "temporarily".
3. If it is inside §1, install, add a row to §3 with its purpose, and run
   `npm run licenses`.
4. Verify no transitive dependency broke the policy — the audit covers the whole
   tree, which is the point.
5. If it is a Vercel-only API, it is rejected regardless of licence
   (`CLAUDE.md` §3).

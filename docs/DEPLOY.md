# DEPLOY — Maren Beauty

DNS cutover, email authentication alongside Google Workspace, and self-hosting.

> **This is a checklist for a human.** No agent executes any step in this
> document. DNS, the Vercel dashboard and the Google Workspace admin console are
> the owner's (`CLAUDE.md` §17). An agent may draft and verify; it does not
> change records.

> **Never copy DNS values out of this document.** Vercel's required A/CNAME
> targets change over time and differ per project. Read the exact values from
> **Vercel → Project → Settings → Domains** at the moment of cutover, and use
> those. The placeholders below are shape, not data.

---

## 0. The one thing that must not break

`marenbeauty.com` already carries **live Google Workspace email**.

**Do not touch the `MX` records.** Not to "tidy them up", not to re-add them at
a new provider "to be safe". Pointing the website at Vercel affects `A` /
`CNAME` / `TXT` records only. A wrong move on `MX` takes the business's email
down, and mail sent during the outage bounces — it does not queue indefinitely.

Before changing anything: **export the current zone file** and save it outside
the DNS provider. That export is the rollback.

---

## 1. Pre-flight

- [ ] `npm run verify` passes on `main`.
- [ ] Docker build and run verified (M16) — proves portability off Vercel.
- [ ] Every `{{LEGAL_ENTITY}}` resolved; `npm run guard` passes on a production
      build. **The build will fail if any remain.**
- [ ] Destination inbox confirmed (`docs/OPEN-QUESTIONS.md` B1).
- [ ] SMTP credential in hand (B3).
- [x] Canonical host decided: **apex, `https://marenbeauty.com`**; `www` 301s
      to it (C2).
- [ ] Current zone file exported and saved.
- [ ] All TTLs on records being changed lowered to **300s at least 24–48 hours
      before** cutover, so a rollback propagates in minutes rather than hours.

---

## 2. Vercel project

- [ ] Import the GitHub repository. Framework preset: Next.js.
- [ ] Node version: **24** (matches `.nvmrc` and `engines`).
- [ ] Build command `npm run build`, install `npm ci`.
- [ ] Production branch: `main`.
- [ ] Deploy and verify on the `*.vercel.app` URL **before** any DNS change.

### Environment variables

Set for Production and Preview. Values come from `.env.example`; never commit
real values.

| Variable           | Example                   | Notes                                          |
| ------------------ | ------------------------- | ---------------------------------------------- |
| `SITE_URL`         | `https://marenbeauty.com` | Canonical origin — apex, decided (C2)          |
| `SMTP_HOST`        | `smtp.gmail.com`          | Google Workspace                               |
| `SMTP_PORT`        | `587`                     | STARTTLS                                       |
| `SMTP_USER`        | `info@marenbeauty.com`    | The authenticated Workspace account (B1)       |
| `SMTP_PASS`        | —                         | App password on that account. **Secret.** (B3) |
| `MAIL_FROM`        | `info@marenbeauty.com`    | Same as `SMTP_USER` — **no send-as alias**     |
| `MAIL_TO`          | `info@marenbeauty.com`    | Same mailbox. One identity.                    |
| `ALTCHA_HMAC_KEY`  | —                         | Random 32+ bytes. **Secret.**                  |
| `UMAMI_SCRIPT_URL` | _(unset)_                 | **Unused at launch** (C5). Not required.       |
| `UMAMI_WEBSITE_ID` | _(unset)_                 | **Unused at launch** (C5). Not required.       |

`SMTP_USER`, `MAIL_FROM` and `MAIL_TO` are deliberately the same address. A
single identity means the authenticated account and the `From` header always
align, so SPF and DKIM pass with no alias configuration and nothing to keep in
sync.

**No analytics backend is deployed at launch** (C5). The `UMAMI_*` variables are
listed so the shape is known; `env.ts` does not require them and a missing value
is not a startup failure.

`src/config/env.ts` parses these with Zod at startup and **throws on a missing
required value** — a misconfigured deployment fails loudly rather than serving a
broken form.

- [ ] Confirm the contact form works from the `*.vercel.app` preview before
      cutover. This is the real test of F3 (`docs/OPEN-QUESTIONS.md`): Vercel's
      Node runtime opening outbound SMTP on 587.

---

## 3. DNS cutover

Work in this order. Web records first, email records untouched.

### 3.1 Record the current state

- [ ] Zone exported.
- [ ] Existing `A` / `CNAME` for apex and `www` written down.
- [ ] Existing `MX` written down — **for verification afterwards, not for
      editing.**
- [ ] Existing `TXT` written down, especially any record beginning `v=spf1`.

### 3.2 Add the web records

Read the exact targets from the Vercel dashboard.

| Host  | Type    | Value           | Note                   |
| ----- | ------- | --------------- | ---------------------- |
| `@`   | `A`     | _(from Vercel)_ | Apex cannot be a CNAME |
| `www` | `CNAME` | _(from Vercel)_ |                        |

- [ ] Add the domain in Vercel **first** so it can begin certificate issuance.
- [ ] Set the redirect in Vercel so the **apex serves** and **`www` 301s to it**
      (C2) — not the reverse.
- [ ] `next.config.ts` enforces the same canonical. The two must agree — a
      disagreement is a redirect loop.

### 3.3 Verify propagation before proceeding

```bash
dig +short marenbeauty.com A
dig +short www.marenbeauty.com CNAME
dig +short marenbeauty.com MX          # MUST be unchanged
```

Windows PowerShell:

```powershell
Resolve-DnsName marenbeauty.com -Type A
Resolve-DnsName www.marenbeauty.com -Type CNAME
Resolve-DnsName marenbeauty.com -Type MX
```

- [ ] `A` and `CNAME` resolve to the Vercel targets.
- [ ] **`MX` is byte-identical to what was recorded in §3.1.**
- [ ] TLS certificate issued; `https://marenbeauty.com` loads.
- [ ] The non-canonical host 301s to the canonical one — once, not in a chain.

---

## 4. Email authentication alongside Google Workspace

The site sends through Workspace SMTP, which is a genuine simplification: mail
originates from Google's infrastructure, so **no additional SPF include is
needed** for the website.

### 4.1 SPF — exactly one record

There must be **one** `TXT` record on the apex beginning `v=spf1`. Two SPF
records is a permanent failure, not a warning: receivers treat it as `permerror`.

| Host | Type  | Value                                 |
| ---- | ----- | ------------------------------------- |
| `@`  | `TXT` | `v=spf1 include:_spf.google.com ~all` |

- [ ] Confirm only one `v=spf1` record exists.
- [ ] If one already exists with `include:_spf.google.com`, **leave it alone.**
- [ ] Do **not** add an include for the website. It sends via Workspace.
- [ ] Do not exceed 10 DNS lookups total across includes.

### 4.2 DKIM — Workspace generates it

In **Admin console → Apps → Google Workspace → Gmail → Authenticate email**:

- [ ] Generate a new record for `marenbeauty.com`. Prefer **2048-bit**.
- [ ] Google gives a selector (default `google`) and a value.
- [ ] Publish `TXT` at `google._domainkey` with that value.
- [ ] Wait for propagation, then click **Start authentication** in the console.
- [ ] Confirm status shows authenticating.

DKIM is per-domain and independent of the web records. Adding it does not affect
the website.

### 4.3 DMARC — start permissive, then tighten

| Host     | Type  | Value                                                      |
| -------- | ----- | ---------------------------------------------------------- |
| `_dmarc` | `TXT` | `v=DMARC1; p=none; rua=mailto:dmarc@marenbeauty.com; fo=1` |

- [ ] Publish with `p=none` and collect reports for **at least two weeks**.
- [ ] Confirm reports show SPF and DKIM passing for legitimate mail, including
      contact-form notifications.
- [ ] Only then move to `p=quarantine`, and later `p=reject`.

Do not start at `p=reject`. If anything is misaligned, legitimate mail silently
disappears.

### 4.4 Verify

```bash
dig +short TXT marenbeauty.com              # exactly one v=spf1
dig +short TXT google._domainkey.marenbeauty.com
dig +short TXT _dmarc.marenbeauty.com
dig +short MX marenbeauty.com               # unchanged
```

- [ ] Send a test message from the Workspace account to an external address;
      check the received headers show `spf=pass` and `dkim=pass`.
- [ ] Submit the production contact form; confirm it reaches `MAIL_TO` **and
      does not land in spam**.

---

## 5. Rollback

If the site is broken after cutover:

1. Restore the previous `A` / `CNAME` from the §3.1 export. With TTL at 300s,
   propagation is minutes.
2. Leave `MX`, SPF, DKIM and DMARC in place — none of them affect the website.
3. Diagnose on the `*.vercel.app` URL, which is unaffected by DNS.

If **email** breaks:

1. Restore `MX` immediately from the export. This is the highest-priority
   rollback on the list.
2. Then restore any `TXT` record that was changed.
3. Website records can stay as they are; they are unrelated.

---

## 6. Post-cutover

- [ ] Every route loads over HTTPS; no mixed content.
- [ ] Non-canonical host redirects once, with a 301.
- [ ] `robots.txt` and `sitemap.xml` resolve at the canonical origin.
- [ ] Contact form sends from production; message arrives; nothing is persisted.
- [ ] Google Search Console: verify by DNS `TXT`, submit the sitemap.
- [ ] Rich Results Test on one URL per route type (`docs/SEO.md` §2.6).
- [ ] Confirm in a clean browser profile: **zero third-party requests, zero
      cookies** while the analytics flags are off.
- [ ] Raise TTLs back to a normal value (3600s) once stable.
- [ ] Record the cutover date in `docs/OPEN-QUESTIONS.md` §G.

---

## 7. Self-hosting

The portability guarantee (`CLAUDE.md` §3). Verified at M16, and it must stay
verified — if this stops working, Vercel has become a dependency.

```bash
docker build -t marenbeauty .
docker run --rm -p 3000:3000 --env-file .env.local marenbeauty
```

- [ ] Multi-stage build on a Node 24 base; runs as a non-root user.
- [ ] `output: 'standalone'`; only the standalone bundle, `public/` and
      `.next/static` are copied into the final image.
- [ ] Every route renders. Image optimisation works (`sharp` present).
- [ ] The contact form sends from inside the container.
- [ ] `grep -r "@vercel/" src/` returns nothing.

To move off Vercel: point the `A` record at the host running the container, put
a TLS-terminating reverse proxy in front of it, and supply the same environment
variables. Nothing in the application changes.

---

## 8. What is deliberately not automated

| Not automated           | Why                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------- |
| DNS changes             | Owner-controlled. An error takes down business email.                                 |
| Vercel project settings | Owner-controlled.                                                                     |
| Google Workspace admin  | Owner-controlled, and holds live credentials.                                         |
| DMARC tightening        | Requires reading two weeks of real reports and judging them.                          |
| Google Business Profile | Needs a verifiable address (`docs/OPEN-QUESTIONS.md` C1) and the business to be open. |

An agent may prepare, draft and verify any of these. It does not execute them.

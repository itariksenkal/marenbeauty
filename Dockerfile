# Portability rule — CLAUDE.md §3. The site must run identically on Vercel and
# in a plain container. Fully verified at M16.

# ── deps ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# The legal entity is a BUILD-TIME variable, not a runtime one.
#
# The three legal pages are statically prerendered, so `legalEntity()` runs
# during `next build` and the ünvan is baked into the HTML. Supplying
# LEGAL_ENTITY only to `docker run` does nothing — the pages would already say
# it is pending. Vercel exposes project environment variables to the build, so
# it works there without this; a container needs it passed explicitly:
#
#   docker build --build-arg LEGAL_ENTITY="…" -t marenbeauty .
#
# Left empty, the pages name no entity and say so, which is the correct
# unresolved state rather than a broken one.
ARG LEGAL_ENTITY=""
ENV LEGAL_ENTITY=$LEGAL_ENTITY

# NOT `npm run build` — that is the Vercel-shaped build, which no longer emits
# a standalone bundle for the runtime stage below to copy. Setting
# `output: 'standalone'` unconditionally is what broke every Vercel deploy;
# only this build asks for it (scripts/build-standalone.mjs).
RUN npm run build:standalone

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root. `--ingroup` is not optional: without it Alpine's adduser puts the
# user in `nogroup`, and the `nodejs` group created on the line above is never
# used. `docker exec … id` reported `gid=65533(nogroup)` at M16 — the files are
# chowned to `nextjs:nodejs`, so the process was running outside the group that
# owns them.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

# `output: 'standalone'` emits a self-contained server; only these three
# artefacts are needed at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.11.2 --no-fund --no-audit
WORKDIR /app

FROM base AS deps
COPY src/package.json src/pnpm-lock.yaml src/pnpm-workspace.yaml ./
COPY src/apps/web/package.json apps/web/package.json
COPY src/packages/application/package.json packages/application/package.json
COPY src/packages/domain/package.json packages/domain/package.json
COPY src/packages/infrastructure/package.json packages/infrastructure/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app ./
COPY src/ ./

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NODE_ENV=production

RUN pnpm --filter @tfi/web build

FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100 \
    HOSTNAME=0.0.0.0

WORKDIR /app

RUN mkdir -p /app/apps/web/.next/cache \
 && chown -R node:node /app

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3100/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]

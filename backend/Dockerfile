# syntax=docker/dockerfile:1

# Etapa común para instalar dependencias del monorepo.
FROM node:24-bookworm-slim AS base
ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM deps AS build
COPY database ./database
COPY backend ./backend
RUN npm run db:generate -w backend \
    && npm run build -w backend

# Herramientas operativas: migraciones y datos de demostración.
FROM build AS migrator
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "database/prisma/schema.prisma"]

FROM build AS seeder
USER node
CMD ["node", "node_modules/tsx/dist/cli.mjs", "database/seeds/seed.ts"]

# Imagen final: solo dependencias de producción, cliente Prisma generado y dist.
FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production \
    PORT=4000 \
    PRISMA_SKIP_POSTINSTALL_GENERATE=true \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

# Instala únicamente las dependencias de producción del backend.
# --omit=optional evita el peer opcional de Prisma CLI y herramientas de desarrollo.
RUN npm ci --omit=dev --omit=optional --workspace @incident-hub/backend --include-workspace-root \
    && npm cache clean --force

COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/database/prisma/schema.prisma ./database/prisma/schema.prisma

USER node
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:4000/health/ready').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"]

CMD ["node", "backend/dist/server.js"]

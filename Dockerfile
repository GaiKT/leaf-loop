FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `postinstall` runs `prisma generate`, so the schema and config must be here first.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Applies pending migrations, then exits. compose runs this before the app starts.
FROM deps AS migrate
# Also holds the password reset script, so it can be run with: docker compose run --rm migrate npx tsx scripts/reset-password.mts <username>
COPY scripts ./scripts
COPY src/lib/passwords.ts ./src/lib/passwords.ts
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY tsconfig.json ./

# Copy CSV files for seeding (from project root)
COPY csv/ /data/csv/

ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

RUN mkdir -p uploads

# Versi build (commit SHA) supaya backend bisa menyiarkannya ke client.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && (npx prisma db seed || echo 'Seed skipped or failed, continuing...') && npx tsx src/server.ts"]

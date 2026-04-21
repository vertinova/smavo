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

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma db seed && npx tsx src/server.ts"]

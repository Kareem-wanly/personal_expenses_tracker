# Build from the repository root:  docker build -f apps/api/Dockerfile -t masrufi-api .
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app

# Dependencies first, so they are cached until a package.json changes.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/
RUN npm ci --omit=dev --workspace @masrufi/api

COPY packages packages
COPY apps/api apps/api

USER node
WORKDIR /app/apps/api
EXPOSE 4000
# Apply migrations, then start.
CMD ["sh", "-c", "node --import tsx src/database/migrate.ts && exec node --import tsx src/server.ts"]

# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
# better-sqlite3 falls back to compiling from source when no prebuilt binary matches
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json .npmrc ./
RUN npx -y npm@11 ci
COPY . .
# SvelteKit validates required env vars during the build. These placeholders only satisfy
# that check; they are not baked into the output. Real values come from the pod's env.
RUN DATABASE_URL=:memory: SESSION_SECRET=build-time-placeholder-not-used-at-runtime \
    npx -y npm@11 run build && npx -y npm@11 prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/data/library.db
RUN apk add --no-cache sqlite \
    && mkdir -p /data && chown node:node /data
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/package.json ./
USER node
EXPOSE 3000
VOLUME /data
CMD ["node", "build"]

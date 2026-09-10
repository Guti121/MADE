# syntax=docker/dockerfile:1

# Pin by digest for reproducible builds (update deliberately).
# node:20-alpine — replace the digest when bumping.
FROM node:20-alpine AS deps
WORKDIR /app
# bcrypt is a native addon; alpine (musl) may lack a prebuilt binary and then
# needs a toolchain to compile from source.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Unambiguous timestamps: user_sessions.expires_at math assumes UTC everywhere.
ENV TZ=UTC
WORKDIR /app

# tini as PID 1: reaps zombies and forwards SIGTERM so graceful shutdown works.
RUN apk add --no-cache tini

# Non-root runtime user.
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=app:app . .

USER app
EXPOSE 1234

# Container-level healthcheck hits the unauthenticated probe.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||1234)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]

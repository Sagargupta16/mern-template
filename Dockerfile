# Node major for every stage; keep in sync with .nvmrc and .github/workflows/ci.yml
ARG NODE_VERSION=24

# Stage 1: build the React client into /app/client/dist
FROM node:${NODE_VERSION}-alpine AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --ignore-scripts
COPY client/ ./
RUN npm run build

# Stage 2: server production dependencies. --ignore-scripts is safe: bcrypt ships
# prebuilt glibc and musl binaries that node-gyp-build loads at runtime.
FROM node:${NODE_VERSION}-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 3: runtime. Express serves the API and, with NODE_ENV=production, the built client.
FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=client /app/client/dist ./client/dist
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/
# Code stays root-owned; only the working directory is writable so winston can create combined.log
RUN chown node:node /app/server
WORKDIR /app/server
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/health').then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "index.js"]

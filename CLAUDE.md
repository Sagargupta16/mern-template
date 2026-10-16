# CLAUDE.md

> This file stacks on top of the workspace root at `C:\Code\GitHub\`:
> - Root [`CLAUDE.md`](../../CLAUDE.md) -- voice, rules, routing map, references, skills, slash commands, conventions.
> - Root [`MEMORY.md`](../../MEMORY.md) -- live facts across repos.
> - Root [`STATUS.md`](../../STATUS.md) -- live PR/CI/security dashboard.
> - [`.claude/resources/`](../../.claude/resources/README.md) -- deep reference for collaboration, workflow, git, OSS, debugging, voice.
>
> Read those first. The guidance below only adds **repo-specific context** -- it does not override anything in the root.

## Project

MERN stack starter template: full-stack app with JWT auth, OTP email verification, and rate limiting. Scaffolding source for new repos in this workspace (see root CLAUDE.md "Creating a New Repo") -- not deployed anywhere itself.

## Stack

- **Language**: JavaScript (ESM throughout, no CommonJS), Node 24 (`.nvmrc`, CI and `Dockerfile` all pin 24)
- **Framework**: React 19 + Vite 8 + React Router 7 (client); Express 5 + Mongoose 9 (server)
- **Database**: MongoDB (local or Atlas; `mongo:9` in `docker-compose.yml`)
- **Package manager**: npm (three separate trees: root, `client/`, `server/`; no workspaces)
- **Deploy target**: none (template repo); ships a production `Dockerfile` + `docker-compose.yml`

## Run

```
npm run install-all              # installs root + server + client deps
cp server/.env.example server/.env   # then fill values
npm run dev                      # concurrently: client on :3000, server on :5000
npm run build                    # vite build (client only) -> client/dist
NODE_ENV=production npm start    # Express serves the API + client/dist on :5000
docker compose up -d --build     # same production build in a container + mongo:9, on :5000 (needs server/.env)
```

`npm run server` / `npm run client` run each half alone.

## Test

No test suite. CI (`.github/workflows/ci.yml`) runs: client `npm ci --ignore-scripts`, `npm run lint` (ESLint 10 flat config), `npm run build`; server `npm ci --ignore-scripts`, `node --check index.js`; then, once both pass, `docker compose up --build --wait` with an empty `server/.env` and curls `/health`, `/` and `/token-check` (401). Root has Prettier with organize-imports.

## Entry points

- `server/index.js` -- Express app: CORS, route mounting, `/health`, production static serving, Mongo connect (top-level await), listen
- `client/src/main.jsx` -- React root
- `client/src/App.jsx` -- router configuration

## Key files

- `server/routes/` + `server/controllers/` -- MVC pairs (auth, user)
- `server/middleware/authMiddleware.js` -- JWT guard (`authenticateUser`)
- `server/models/` -- Mongoose schemas: User, OTP
- `client/src/api/` -- Axios instance and API calls
- `client/vite.config.js` -- dev proxy to backend
- `server/utils/limiter.js` -- the single rate limiter (100 req / 5 min per IP), shared by every limited route
- `server/utils/logger.js` -- winston logger + `sanitizeLog()` for user-controlled values in log lines
- `server/.env.example` -- source of truth for required env vars
- `Dockerfile` / `docker-compose.yml` / `.dockerignore` -- production image and local app + Mongo stack

## Gotchas

- Server hard-exits if `DB_CONNECTION_STRING` is missing or Mongo is unreachable -- copy and fill `server/.env` before `npm run dev`.
- Vite proxy only forwards `/auth`, `/users`, `/token-check`, `/health`. New backend route prefixes must be added to `client/vite.config.js` or the client gets 404s in dev.
- New DB-touching routes need `limiter` before any DB-hitting middleware (CodeQL `js/missing-rate-limiting`). `/users` gets it via `router.use(limiter)`; don't also add it per route, the shared counter would double count.
- Body values that reach a Mongoose query must be plain strings: coerce like `toSafeString` in `authController.js` or reject non-strings with 400 like `updateUser`. Wrap user-controlled values in `sanitizeLog()` before logging them.
- Production static serving and the SPA fallback (`/{*splat}`, Express 5 syntax) are registered after the API routes; keep new API routes above that block.
- Docker: the runtime runs as `node` from `/app/server`, which is the only writable directory (winston writes `combined.log` there). `--ignore-scripts` works because bcrypt ships glibc and musl prebuilds; if a new native dependency needs its install script, add `npm rebuild <pkg>` after `npm ci`.
- `docker-compose.yml` reads `server/.env` and overrides `DB_CONNECTION_STRING` (mongo service) and `PORT` (5000). The client bundle calls `VITE_API_URL` or `http://localhost:5000`, so keep the 5000 mapping.
- OTP email flows need real `EMAIL_ID` / `EMAIL_PASSWORD` (nodemailer); without them signup verification and password reset fail at send time.
- Express 5 and Mongoose 9: use current APIs, older MERN snippets (Express 4 middleware patterns, Mongoose callbacks) will not work.

## Repo-specific rules

- Uses npm, not pnpm -- root scripts and `install-all` are npm-wired. Keep it npm unless migrating all three package trees at once.
- This is a template: changes here propagate to every repo scaffolded from it. Keep it generic; no project-specific features.

## Routes / Pages

- `/` -- Home (public)
- `/auth` -- login / signup / forgot password forms
- `/profile` -- user profile (protected)
- 404 via NotFound component

## API routes

- `POST /auth/signup|login|verify-email|verify-otp|reset-password` -- all rate limited
- `GET /users/view`, `GET /users/view/:id`, `PUT /users/update/:id`, `DELETE /users/delete/:id` -- rate limited + authenticated
- `GET /token-check` -- JWT validity probe, rate limited
- `GET /health` -- liveness probe (`{ status: 'ok' }`), no DB, not rate limited
- `GET /{*splat}` -- production only: `client/dist` + SPA fallback, rate limited
- Full table with descriptions in [README.md](README.md)

## Auth

- JWT (7-day expiry) issued at login, verified by `server/middleware/authMiddleware.js`; passwords bcrypt-hashed
- OTP over email (nodemailer) for verification and password reset
- Required env vars: `DB_CONNECTION_STRING`, `JWT_SECRET`, `JWT_SALT_ROUNDS`, `EMAIL_ID`, `EMAIL_PASSWORD`, `CORS_ORIGINS`

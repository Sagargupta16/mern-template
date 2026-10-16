# Contributing to mern-template

This repo is a MERN stack starter (MongoDB, Express 5, React 19 with Vite, Node.js) with JWT authentication, OTP email verification and rate limiting. Bug reports, fixes, doc corrections and improvements that keep the template minimal and generic are welcome.

## Setup

You need Node.js (`.nvmrc` pins 24, which CI also uses), npm and MongoDB (local or Atlas). There are three separate npm package trees, root, `client/` and `server/`, with no workspaces.

```bash
npm run install-all
cp server/.env.example server/.env    # then fill in the values
npm run dev                           # client on http://localhost:3000, server on http://localhost:5000
```

The server exits if `DB_CONNECTION_STRING` is missing or MongoDB is unreachable. OTP flows need real `EMAIL_ID` and `EMAIL_PASSWORD` values.

## Before you open a PR

`.github/workflows/ci.yml` runs three jobs on every push and pull request, on Node 24. Installs use `--ignore-scripts`; bcrypt still works because it ships prebuilt binaries.

Client:

```bash
cd client
npm ci --ignore-scripts
npm run lint
npm run build
```

Server:

```bash
cd server
npm ci --ignore-scripts
node --check index.js
```

Docker (runs after both pass; nothing is pushed). CI writes a throwaway `server/.env`, starts the compose stack with `docker compose up -d --build --wait`, then checks `/health`, the client at `/` and a 401 from `/token-check`:

```bash
docker build -t mern-template .
```

If you touch the `Dockerfile`, `docker-compose.yml` or production serving in `server/index.js`, also run `docker compose up -d --build` (needs `server/.env`) and check that `curl http://localhost:5000/health` returns `{"status":"ok"}` and `http://localhost:5000/` serves the client.

There is no test suite, so describe how you checked your change by hand in the pull request.

## Conventions

- Keep it a template: changes propagate to every repo created from it, so no project-specific features.
- Use npm, not pnpm or yarn. Root scripts and `install-all` are npm-wired, and CI installs with `npm ci`, so commit the matching `package-lock.json` whenever you change a `package.json`.
- ESM throughout; do not add CommonJS.
- Server code follows MVC: routes in `server/routes/`, handlers in `server/controllers/`, Mongoose schemas in `server/models/`, the JWT guard in `server/middleware/authMiddleware.js`.
- The Vite dev proxy forwards only `/auth`, `/users`, `/token-check` and `/health`. Add any new backend route prefix to `client/vite.config.js`, and register new API routes in `server/index.js` above the production static block so the SPA fallback never shadows them.
- Put `limiter` (from `server/utils/limiter.js`) in front of every route that touches the database or the filesystem, pass only plain strings from `req.body` into Mongoose queries, and wrap user-controlled values in `sanitizeLog()` before logging them.
- Use current Express 5 and Mongoose 9 APIs; Express 4 middleware patterns and Mongoose callbacks will not work.
- `server/.env.example` is the source of truth for environment variables. Add new ones there and never commit `server/.env`.
- Format with Prettier using the root `.prettierrc` (tabs, single quotes, print width 150, organize-imports plugin).
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), with an optional scope such as `fix(deps):`.
- Add a `CHANGELOG.md` entry under a concrete next version, for example `## [2.1.1] - YYYY-MM-DD`, and keep the `version` in the root, `server/` and `client/` `package.json` files on that same version.
- Fill in the pull request template: description, changes and testing.

## Security issues

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).

## License

This project is released under the MIT License (see [LICENSE](LICENSE)). By contributing, you agree that your contributions are licensed under it.

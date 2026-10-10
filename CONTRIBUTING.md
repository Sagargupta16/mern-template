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

`.github/workflows/ci.yml` runs two jobs on every push and pull request, on Node 24.

Client:

```bash
cd client
npm ci
npm run lint
npm run build
```

Server:

```bash
cd server
npm ci
node --check index.js
```

There is no test suite, so describe how you checked your change by hand in the pull request.

## Conventions

- Keep it a template: changes propagate to every repo created from it, so no project-specific features.
- Use npm, not pnpm or yarn. Root scripts and `install-all` are npm-wired, and CI installs with `npm ci`, so commit the matching `package-lock.json` whenever you change a `package.json`.
- ESM throughout; do not add CommonJS.
- Server code follows MVC: routes in `server/routes/`, handlers in `server/controllers/`, Mongoose schemas in `server/models/`, the JWT guard in `server/middleware/authMiddleware.js`.
- The Vite dev proxy forwards only `/auth`, `/users` and `/token-check`. Add any new backend route prefix to `client/vite.config.js`.
- Use current Express 5 and Mongoose 9 APIs; Express 4 middleware patterns and Mongoose callbacks will not work.
- `server/.env.example` is the source of truth for environment variables. Add new ones there and never commit `server/.env`.
- Format with Prettier using the root `.prettierrc` (tabs, single quotes, print width 150, organize-imports plugin).
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), with an optional scope such as `fix(deps):`.
- Add a `CHANGELOG.md` entry under a concrete next version, for example `## [2.0.1] - YYYY-MM-DD`.
- Fill in the pull request template: description, changes and testing.

## Security issues

Do not report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).

## License

This project is released under the MIT License (see [LICENSE](LICENSE)). By contributing, you agree that your contributions are licensed under it.

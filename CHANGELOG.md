# Changelog

## [2.1.1] - 2026-10-24

- Client: bump `follow-redirects` to 1.16.1 (GHSA-8r9p-f939-6h3c, GHSA-q3jh-wrc6-jgq8) and dev-only `zod` to 4.6.7 (GHSA-mrhx-c7xc-m3w5)
- Server: bump `body-parser` to 2.4.0 (GHSA-27r3-jxmh-p828), `nodemailer` to 10.2.1 (GHSA-8c8m-p3m8-cjg8, GHSA-m943-m63m-w62w, GHSA-85x2-q946-cp5h) and `ip-address` to 10.7.4 (GHSA-rxp7-6hxx-x8q5); lockfile-only, within existing ranges

## [2.1.0] - 2026-10-16

- Add `GET /health` (no database access) and production static serving: with `NODE_ENV=production`, Express serves `client/dist` with an SPA fallback
- Add a multi-stage `Dockerfile` (Node 24 alpine, non-root, healthcheck) and `docker-compose.yml` with MongoDB; CI now starts the compose stack until healthy and smoke-tests `/health`, the client at `/` and `/token-check`
- Rate limit every `/users` route and `/token-check`, not just update and delete
- Reject a non-string or blank `name` on `PUT /users/update/:id` with 400 (NoSQL operator injection)
- Strip control characters from user-controlled values in log lines (log injection)
- CI: least-privilege `permissions: contents: read`, `npm ci --ignore-scripts`
- Forgot-password modal: drop `autoFocus` and stop remounting the input on every keystroke
- Bump `concurrently` to 10.0.6 (patched `shell-quote`); align root, server and client versions on 2.1.0; document Node 24

## [2.0.0] - 2026-03-14

- Migrate CRA to Vite, convert backend to full ESM
- Upgrade Express 5, React 19, Mongoose 9
- Remove CommonJS, add .env.example

## [1.0.0] - 2024-02-20

- Initial MERN template with JWT auth, email OTP, rate limiting, bcrypt

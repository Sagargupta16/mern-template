# MERN Stack Template

[![CI](https://github.com/Sagargupta16/mern-template/actions/workflows/ci.yml/badge.svg)](https://github.com/Sagargupta16/mern-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)

A full-stack web application template using the MERN stack with JWT authentication, OTP email verification, and rate limiting.

## Tech Stack

**Backend**: Express 5, Mongoose 9, JWT, bcrypt, Winston, nodemailer
**Frontend**: React 19, Vite, React Router 7, Axios, React Toastify
**Database**: MongoDB

## Features

- JWT authentication with 7-day token expiry
- OTP-based email verification and password reset
- Rate limiting on every endpoint that touches the database (100 requests per IP per 5 minutes)
- MVC architecture (models, controllers, routes)
- Protected routes on both frontend and backend
- Winston structured logging
- ESM modules throughout (no CommonJS)
- Docker image and Compose stack with MongoDB, `/health` endpoint for healthchecks

## Quick Start

### Prerequisites

- Node.js 24+ (`.nvmrc`)
- MongoDB (local or Atlas), or Docker for the Compose stack below

### Setup

```bash
# Install all dependencies
npm run install-all

# Copy environment config
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, and email credentials

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Run Individually

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

### Production build

With `NODE_ENV=production`, Express serves the built client from `client/dist` (with an SPA fallback to `index.html`) next to the API, all on one port.

```bash
npm run build                    # builds client/dist
NODE_ENV=production npm start    # API + client on http://localhost:5000
```

### Docker

`docker-compose.yml` runs the production image (API + built client) on http://localhost:5000 next to a MongoDB 9 container with a named volume.

```bash
cp server/.env.example server/.env   # fill JWT_SECRET, JWT_SALT_ROUNDS, EMAIL_*; compose sets DB_CONNECTION_STRING and PORT
docker compose up -d --build
curl http://localhost:5000/health    # {"status":"ok"}
docker compose down                  # add -v to also delete the MongoDB volume
```

The `Dockerfile` is multi-stage on `node:24-alpine`: it builds the client, installs server production dependencies with `npm ci --omit=dev --ignore-scripts`, and runs as the non-root `node` user with `NODE_ENV=production` and a `HEALTHCHECK` on `/health`. The client bundle calls `VITE_API_URL` if it was set at build time (for example in a committed `client/.env.production`), otherwise `http://localhost:5000`, so keep the `5000:5000` port mapping or set it.

## Project Structure

```
MERN-TEMPLATE/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/                # Axios instance and API calls
│   │   ├── components/         # Reusable components
│   │   │   ├── AuthForms/      # Login, signup, forgot password
│   │   │   ├── Filter/         # Generic filter component
│   │   │   ├── Modal/          # Reusable modal (portal-based)
│   │   │   ├── NavBar/         # Navigation bar
│   │   │   ├── NotFound/       # 404 page
│   │   │   ├── Structure/      # Layout wrapper
│   │   │   └── ToastContent/   # Custom toast notifications
│   │   ├── pages/              # Route pages (Auth, Home, Profile)
│   │   ├── utils/              # Auth helpers, user data
│   │   ├── App.jsx             # Router configuration
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js          # Vite config with API proxy
│   ├── eslint.config.js        # ESLint flat config
│   └── package.json
│
├── server/                     # Express backend
│   ├── controllers/            # Route handlers (auth, user)
│   ├── middleware/              # JWT auth middleware
│   ├── models/                 # Mongoose schemas (User, OTP)
│   ├── routes/                 # Route definitions
│   ├── utils/                  # Logger, rate limiter
│   ├── index.js                # Server entry point
│   ├── .env.example            # Environment template
│   └── package.json
│
├── Dockerfile                  # Multi-stage production image
├── docker-compose.yml          # App + MongoDB stack
└── package.json                # Root scripts (concurrently)
```

## API Endpoints

### Auth (`/auth`)

| Method | Path | Rate Limited | Description |
|--------|------|:---:|-------------|
| POST | `/auth/signup` | Yes | Register new user |
| POST | `/auth/login` | Yes | Login, returns JWT |
| POST | `/auth/verify-email` | Yes | Send OTP to email |
| POST | `/auth/verify-otp` | Yes | Verify OTP |
| POST | `/auth/reset-password` | Yes | Reset password with OTP |

### Users (`/users`) -- all authenticated

| Method | Path | Rate Limited | Description |
|--------|------|:---:|-------------|
| GET | `/users/view` | Yes | Get all users |
| GET | `/users/view/:id` | Yes | Get user by ID |
| PUT | `/users/update/:id` | Yes | Update user (`name` must be a non-empty string) |
| DELETE | `/users/delete/:id` | Yes | Delete user |

### Other

| Method | Path | Rate Limited | Description |
|--------|------|:---:|-------------|
| GET | `/token-check` | Yes | Verify JWT validity |
| GET | `/health` | No | Liveness probe, returns `{ "status": "ok" }` without touching the database |
| GET | `/*` | Yes | Production only: serves `client/dist`, falling back to `index.html` |

## Environment Variables

See `server/.env.example` for all required variables:

- `DB_CONNECTION_STRING` -- MongoDB connection URI
- `JWT_SECRET` -- Secret for signing JWTs
- `JWT_SALT_ROUNDS` -- bcrypt salt rounds (default: 10)
- `EMAIL_ID` / `EMAIL_PASSWORD` -- Email credentials for OTP
- `CORS_ORIGINS` -- Allowed frontend origins

Optional: `PORT` (default 5000) and `NODE_ENV` (`production` makes Express serve `client/dist`; the Docker image sets it).

## License

MIT License - see the [LICENSE](LICENSE) file for details.

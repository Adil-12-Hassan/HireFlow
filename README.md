![HireFlow by ARQYON Tech — People. Potential. Possibility.](docs/assets/hireflow-banner.svg)

# HireFlow by ARQYON Tech

**💼 Professional networking · 🤝 Hiring workflows · 🚀 Career opportunities**

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Change history](CHANGLOG.md) · [License](LICENSE)

HireFlow is ARQYON Tech’s professional networking and hiring platform. It brings professional profiles, job publishing, proposals, and application tracking into one web application.

Built and maintained for ARQYON Tech. HireFlow is an independent product and is not affiliated with or endorsed by LinkedIn.

## ✨ Product scope

- Account registration, sign-in, email verification, password recovery, and cookie-based sessions.
- Professional profiles with visibility controls, skills, experience, and projects.
- Ongoing experience marked as **Present**.
- Public job discovery and owner-managed job creation and editing.
- Job descriptions and proposals with lightweight Markdown formatting, preview, undo/redo, and character limits.
- Applicant tracking, hiring status updates, withdrawal, and status history.
- Responsive layouts, light/dark themes, skeleton loading, and pending-action feedback.

A member can apply for one job and own another. Ownership is a relationship to a resource, not a separate account type.

Submitted proposals cannot currently be revised through the API. Feeds, messaging, connections, billing, and notifications are outside the implemented scope. This repository is under active development; enterprise positioning does not imply a completed security audit or production certification.

## 🏗️ Architecture

![Technology stack: React 19, TypeScript, Express 5, PostgreSQL, and Supabase](docs/assets/technology-stack.svg)

| Area | Technology |
| --- | --- |
| Web client | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Client data | TanStack Query 5, Axios, React Router 7 |
| API | Node.js, Express 5, TypeScript, Zod |
| Identity and storage | Supabase Auth and PostgreSQL |

```text
client/                 Web application and client tests
server/                 API and server tests
README.md               Setup and project overview
CONTRIBUTING.md         Engineering workflow
SECURITY.md             Security reporting and operational expectations
CHANGLOG.md             Unreleased change history
LICENSE                 Proprietary use terms
.gitignore              Shared repository ignore rules
```

## 🚀 Local setup

Use Node.js 20.19+ or a compatible supported LTS version and npm. There is no root package.json: run package commands in the relevant application directory.

Install the locked dependencies:

```sh
cd server
npm ci
cd ../client
npm ci
```

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`. Supply your own development credentials.

| Variable | Location | Purpose |
| --- | --- | --- |
| PORT | Server | API port; default 5000 |
| NODE_ENV | Server | development, test, or production |
| FRONTEND_URL | Server | Exact allowed web origin; locally http://localhost:5173 |
| SUPABASE_URL | Server | Supabase project URL |
| SUPABASE_ANON_KEY | Server | Supabase anonymous API key |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Privileged database access; never expose to the browser |
| VITE_API_URL | Client | API URL; locally http://localhost:5000 |

The application requires the existing HireFlow database tables, authentication integration, and status-history functions. A complete database bootstrap/migration bundle is not currently included. Obtain the approved development database setup from the project owner; installing npm packages alone does not provision it.

Run in separate terminals:

```sh
# Terminal 1, from server/
npm run dev
```

```sh
# Terminal 2, from client/
npm run dev
```

Open http://localhost:5173. Keep the hostname consistent with `FRONTEND_URL`; localhost and 127.0.0.1 are different origins. Never place secrets in a `VITE_*` variable: these values are exposed in the client bundle.

## 🧪 Verification

From `server/`:

```sh
npm run typecheck
npm test
npm run build
```

From `client/`:

```sh
npm run typecheck
node --test tests/editor.test.mjs
npm run build
```

`npm run lint` is also available in the client. In constrained environments where Vite’s default configuration bundler cannot read parent directories, use `npm run dev -- --configLoader runner` or `npm run build -- --configLoader runner`.

Automated checks do not replace authenticated browser testing against a configured development backend.

## 🔌 API and behavior

API route groups are `/auth`, `/profiles`, `/jobs`, and `/applications`; health endpoints are `/health`, `/health/db`, and `/health/metrics`. See `server/src/routes/` and `server/src/validators/` for exact methods and schemas.

Access and refresh credentials use HTTP-only cookies. Authorization must be enforced on the server. Public job discovery returns open jobs; private job access is owner-restricted. Application access is restricted to the applicant and job owner. API errors use `{ "error": "message" }`.

The editor stores a limited Markdown-style text format in existing fields: job descriptions allow 5,000 characters and proposals 2,000, including formatting markers. Rendering uses known React elements rather than executing submitted HTML.

## 📦 Production preparation

Before launch, validate HTTPS and cookie behavior, deployment origins, proxy configuration, ownership/privacy enforcement, authentication recovery flows, and mobile accessibility. Establish repeatable migrations, tested backup restoration, private vulnerability reporting, monitoring, and a rollback procedure. Measure API latency before selecting performance fixes.

Build the client into `client/dist` and serve it with history fallback for React Router URLs. Build the API with `npm run build`, then run `npm start` from `server/` with production environment variables. Configure hosting for your approved infrastructure; this repository does not provide a verified production deployment runbook.

## 🤝 Ownership and collaboration

Copyright © 2026 ARQYON Tech. All rights reserved. See [LICENSE](LICENSE). Repository visibility does not grant permission to reuse the software.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes and [SECURITY.md](SECURITY.md) for private vulnerability reporting. Changes are recorded in [CHANGLOG.md](CHANGLOG.md).


# Rickeybl

SamDU uchun Telegram mini-app asosidagi student engagement, coin, badge va reward shop platformasi.

## Stack
- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL
- **Frontend:** React, TypeScript, Vite, Telegram WebApp SDK
- **Structure:** `backend/` and `frontend/`

## Repository layout
```text
backend/
  prisma/
  src/
frontend/
  src/
docker-compose.yml
```

## Backend setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Install dependencies inside `backend/`.
3. Start PostgreSQL with `docker compose up postgres -d`.
4. Run Prisma generate and migrations.
5. Seed sample data with `npm run seed`.
6. Start the API with `npm run start:dev`.

Backend environment values:
- `DATABASE_URL=******localhost:5432/rickeybl?schema=public`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `BOT_TOKEN`
- `ROOT_USERNAME`, `ROOT_PASSWORD`
- `ROOT_EMAIL`
- `PORT`
- `TEST_MODE`

## Frontend setup
1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install dependencies inside `frontend/`.
3. Start Vite with `npm run dev`.
4. Open the app in Telegram Mini-App mode so `initData` is available.

Frontend environment values:
- `VITE_API_URL=http://localhost:3000`
- `VITE_TEST_MODE=true`

## Seeded MVP data
- Root user from `ROOT_USERNAME` / `ROOT_PASSWORD`
- Faculty: `Computer Science Faculty`
- Group: `CS 101`
- Join code: `SAMDU-2026`
- Sample badges and shop items

## Auth flows
- `POST /api/auth/telegram` verifies Telegram WebApp `initData` with strict HMAC validation and 5-minute expiry.
- `POST /api/auth/admin-login` authenticates root by username+password (legacy).
- `POST /api/auth/staff-login` authenticates staff by email+password.
- `POST /api/auth/credential-login` authenticates staff/root by email+password.
- `POST /api/auth/refresh` rotates refresh tokens and issues a new access token.
- `POST /api/auth/logout` and `POST /api/auth/logout-all` revoke session(s).
- `GET /api/auth/me` returns the authenticated user with student profile data.

## Key API domains
- `students`: profile creation, pending approvals, approval/rejection
- `groups`: group listing, creation, join-code rotation
- `coins`: balance, history, manual awards
- `badges`: catalog and manual awards
- `events`: publishing and registration
- `shop`: items, orders, approvals, refunds
- `notifications`: in-app notification center
- `announcements`: student feed + staff/root publish flow
- `admin`: root-only stats, users, audit logs
- `audit`: root global logs + staff-scoped logs

## Docker
`docker-compose.yml` starts PostgreSQL, the backend API, and the frontend web app.

- Frontend is served on `http://localhost:8080`
- Backend API remains available on `http://localhost:3000/api`
- The bundled frontend nginx config proxies `/api/*` to the backend for same-origin deployments
- Health checks are enabled for PostgreSQL, the backend (`/api/health`), and the frontend container

## Security notes
- JWT payload contains only `sub`, `role`, and optional Telegram ID.
- Role checks are enforced server-side with JWT and roles guards.
- Access tokens are short-lived and paired with refresh sessions (rotation + revoke).
- Failed credential logins are tracked; repeated failures trigger temporary lockout.
- Auth endpoints include in-memory request throttling.
- Audit logs are recorded for authentication, approvals, announcements, badge awards, coin actions, and shop order lifecycle changes.
- Test mode banner is controlled by `VITE_TEST_MODE`.

## Internal test and release checklist (MVP)
- Build validation:
  - `cd backend && npx prisma generate && npm run build`
  - `cd frontend && npm run build`
- Pilot/prod deployment checks:
  - set non-placeholder values for `BOT_TOKEN`, `JWT_SECRET`, `ROOT_USERNAME`, `ROOT_EMAIL`, `ROOT_PASSWORD` in production
  - set explicit `CORS_ORIGIN` values in production instead of `*`
  - run seed only with explicit reset flags (`SEED_RESET`, `ALLOW_PROD_RESET`) when needed
- Monitoring baseline:
  - monitor authentication failures (`auth.login_failed`, `auth.login_locked`)
  - monitor HTTP exception audit entries (`http.exception`)
  - monitor excessive auth attempt responses (429)

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
- `POST /api/auth/admin-login` authenticates the root user with bcrypt.
- `GET /api/auth/me` returns the authenticated user with student profile data.

## Key API domains
- `students`: profile creation, pending approvals, approval/rejection
- `groups`: group listing, creation, join-code rotation
- `coins`: balance, history, manual awards
- `badges`: catalog and manual awards
- `events`: publishing and registration
- `shop`: items, orders, approvals, refunds
- `notifications`: in-app notification center
- `admin`: root-only stats, users, audit logs

## Docker
`docker-compose.yml` starts PostgreSQL and the backend service. The backend container expects the NestJS app dependencies to be installed during image build via `backend/Dockerfile`.

## Security notes
- JWT payload contains only `sub`, `role`, and optional Telegram ID.
- Role checks are enforced server-side with JWT and roles guards.
- Audit logs are recorded for authentication, approvals, badge awards, coin actions, and shop order lifecycle changes.
- Test mode banner is controlled by `VITE_TEST_MODE`.

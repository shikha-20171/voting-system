# Kondapi TDP Connect

This project is now split into:

- `frontend/` -> React + Vite UI
- `backend/` -> Express + Prisma + PostgreSQL API

The system follows the same hierarchy you described:

`State -> Zone -> Parliament -> Constituency -> Mandal -> Village -> Booth -> 100 Voter In-charge`

## Included scope

- role-based login by mobile number
- OTP authentication by selected role
- PostgreSQL database with Prisma
- hierarchy-aware organization structure
- voter records with:
  - fake voter flag + reason
  - local / migrated status
  - current migration city
  - vote done tracking
  - caste / sub-caste / profession
- tasks from higher command to lower command
- training videos
- reports / complaints
- dashboard aggregation APIs from bottom to top

## Folder structure

```text
frontend/
  src/
  package.json
  vite.config.ts
  .env.example

backend/
  server/
  prisma/
  package.json
  tsconfig.json
  .env.example
```

## Local setup

### 1. Install dependencies

At project root:

```bash
npm install --cache .npm-cache
```

If workspace install does not work on your machine, run these separately:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Create env files

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 3. Start PostgreSQL

Create a database named:

```text
kondapi_connect
```

Default backend env expects:

```text
postgresql://postgres:postgres@localhost:5432/kondapi_connect?schema=public
```

Change `backend/.env` if your username/password/port is different.

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run migration

```bash
npm run prisma:migrate
```

### 6. Seed demo data

```bash
npm run prisma:seed
```

### 7. Run backend

```bash
npm run dev:backend
```

Backend will run on:

```text
http://localhost:4000
```

### 8. Run frontend

Open another terminal:

```bash
npm run dev:frontend
```

Frontend will run on:

```text
http://localhost:3000
```

## Demo role logins

Choose the matching role card in UI, then enter the registered mobile number:

- `Constituency Incharge` -> `9848022334`
- `Mandal Incharge` -> `9848033345`
- `Village Incharge` -> `9123456789`
- `Booth Incharge` -> `9848022345`
- `100 Voter Incharge` -> `9440261145`

## OTP behavior

Current local OTP flow is role-based and working through backend APIs:

- role card select karo
- registered mobile number dalo
- backend verifies that mobile number belongs to that exact role
- OTP request create hoti hai
- OTP verify hone ke baad JWT token + session issue hota hai

For local development:

- OTP is `123456`
- OTP backend terminal par bhi log hota hai
- JWT expires in 7 days by default (`JWT_EXPIRES_IN` in backend env)

This means:

- wrong role + correct mobile number = login fail
- correct role + wrong mobile number = login fail
- correct role + correct mobile number + correct OTP = login success
- authenticated API calls require `Authorization: Bearer <token>`

If you want real SMS delivery later, we can plug in Twilio / MSG91 / Fast2SMS in backend OTP service.

## Main backend APIs

Public (no auth):

- `GET /api/health`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `GET /api/cms/config`
- `GET /api/cms/parties`

Protected (JWT required):

- `GET /api/auth/session/:userId`
- `GET /api/health`
- `GET /api/hierarchy`
- `GET /api/dashboard/:unitId`
- `GET /api/voters?userId=<userCode>`
- `PATCH /api/voters/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/status`
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/training-videos`
- `GET /api/users`
- `GET /api/cms/config`
- `PUT /api/cms/config`
- `GET /api/cms/parties`
- `PUT /api/cms/parties/:code`
- `GET /api/analytics/summary-by-user/:userId`
- `GET /api/analytics/children/:unitId`
- `GET /api/analytics/live-turnout-by-user/:userId`
- `GET /api/analytics/caste?unitId=<unitId>`
- `GET /api/cadre-network/:unitId`
- `GET /api/live-vote-events?unitId=<unitId>&limit=50`
- `GET /api/training/progress?userId=<userCode>`
- `POST /api/training/progress`
- `PATCH /api/training/progress/:id`

## Hierarchy aggregation flow

- Bottom level updates happen in `Voter` table (`voteStatus`, `voterStatus`, `voterLocationStatus`, etc.)
- Whenever `voteStatus` changes, backend writes `LiveVoteEvent`
- Upper dashboards should read aggregation from `GET /api/dashboard/:unitId` and `GET /api/analytics/summary`
- `unitId` can be any level: `STATE -> ZONE -> PARLIAMENT -> CONSTITUENCY -> MANDAL -> VILLAGE -> BOOTH`
- Analytics are always computed from scoped descendants, not manually entered per level

## CMS configuration scope

- Organisation name, state, hierarchy labels and feature toggles are stored in `CmsConfiguration`
- Party branding is stored in `PoliticalParty`
- Frontend can render the same components with party/theme/config values from CMS endpoints

## Notes

- Frontend currently has the role dashboards already present from the existing project.
- `100 Voter Incharge` dashboard is wired for backend voter fetch/sync with local fallback.
- Higher dashboards still preserve their existing UI and seeded behaviors, while backend hierarchy and auth are now ready.

## Root scripts

From project root you can use:

```bash
npm run dev:backend
npm run dev:frontend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

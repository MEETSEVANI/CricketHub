# CricketHub

CricketHub is a web application for browsing manually maintained cricket player and match records. Registered users can search records, view details, and save favourites. Administrators can manage player and match records, team lineups, match results, and player performances.

## Technology

- React, Vite, and Tailwind CSS
- Node.js and Express
- PostgreSQL
- Jest and Supertest for server tests
- Playwright for browser smoke tests

## Run locally

1. Start PostgreSQL with `docker compose up -d postgres` from the project root.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and a private `JWT_SECRET`.
3. Create the schema and repeatable demo cricket records:

   ```sh
   cd server
   npm install
   npm run db:setup
   npm run dev
   ```

4. In another terminal, start the frontend:

   ```sh
   cd client
   npm install
   npm run dev
   ```

The frontend is available at `http://localhost:5173`; the API is available at `http://localhost:3000`. The Vite development server proxies `/api` requests to the API. Set `VITE_API_PROXY` if the API runs at another local origin.

## Demo accounts

Create accounts through the registration form. New accounts receive the `Registered User` role. To grant an existing local account administrator access, run:

```sh
cd server
npm run db:promote-admin -- user@example.com
```

Sign out and sign in again after changing a role so the session token reflects the new permissions. The database seed creates six demo players, two completed matches, two upcoming matches, sample lineups, and sample performances. It does not create accounts or passwords.

## Testing

Server tests:

```sh
cd server
npm test
```

Browser smoke tests use Playwright and Chromium. Install the browser once, then run the smoke suite from the client directory:

```sh
cd client
npx playwright install chromium
npm run test:e2e
```

Before running the browser tests, start PostgreSQL and initialize the schema and demo data with `npm run db:setup` from `server/`. Playwright starts the API and frontend, but it does not start PostgreSQL or initialize the database. The suite covers registration, login, player and match browsing, favourites, access control, and administrator create, edit, and delete workflows for players and matches, including lineup and performance entry. It creates temporary accounts and records, then removes them. Reports are written to `client/playwright-report` and `client/test-results`.

## Deployment configuration

`render.yaml` defines separate Render services for the Express API and React frontend. It applies the repeatable schema and demo seed before starting the API, checks the PostgreSQL health route, and rewrites frontend routes to React Router. Create a Supabase project and set `DATABASE_URL` in Render to its Session Pooler connection string with `sslmode=require`; Render generates `JWT_SECRET`. The blueprint uses the expected Render service URLs for `CLIENT_URL` and `VITE_API_URL`; update them if Render assigns different URLs. Keep database credentials in the provider dashboard, never in this repository. The blueprint uses Render's free web-service plan, which sleeps after 15 minutes without traffic; Supabase Free may pause a project after a week of low database activity.

## Current feature scope

- Accounts, login, logout, and role-protected routes
- Authenticated player search and player details
- Authenticated match search, upcoming/completed filters, and match details
- Per-user player and match favourites
- Administrator player create, edit, and delete
- Administrator match create, edit, and delete, including team lineups, results, runs, and wickets
- Relational data integrity for matches, lineups, performances, and favourites

Live match updates, third-party cricket data integrations, automated data collection, commentary, and fall-of-wickets breakdowns are outside the first release.

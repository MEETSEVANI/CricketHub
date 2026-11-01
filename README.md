# CricketHub

CricketHub is a web application for browsing manually maintained cricket player and match records. Registered users can search records, view details, and save favourites. Administrators can manage player records. Match administration, team lineup editing, and performance entry are the next planned feature slice.

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

Before running the browser tests, start PostgreSQL and initialize the schema and demo data with `npm run db:setup` from `server/`. Playwright starts the API and frontend, but it does not start PostgreSQL or initialize the database. The suite covers registration, login, player and match browsing, favourites, access control, and administrator player create, edit, and delete. It creates temporary accounts and records, then removes them. Reports are written to `client/playwright-report` and `client/test-results`.

## Deployment configuration

The frontend can call a separately hosted API by setting `VITE_API_URL` to the API origin at build time. `client/.env.example` documents this setting. The API needs `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL` configured in its hosting environment. No cloud deployment has been created for this repository yet.

## Current feature scope

- Accounts, login, logout, and role-protected routes
- Authenticated player search and player details
- Authenticated match search, upcoming/completed filters, and match details
- Per-user player and match favourites
- Administrator player create, edit, and delete
- Relational data integrity for matches, lineups, performances, and favourites

Live match updates, third-party cricket data integrations, automated data collection, commentary, and fall-of-wickets breakdowns are outside the first release.

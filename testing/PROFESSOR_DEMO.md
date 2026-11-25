# Professor demo: test walkthrough

## Before the demo

- Make sure the latest project commit is pushed to GitHub. The GitHub Actions workflow is `.github/workflows/ci.yml`; open the **Actions** tab and show the backend unit, backend API, frontend smoke, and accessibility jobs.
- Render has automatic deploys turned off in `render.yaml`. Deploy the latest `main` commit from the Render dashboard before the demo, and check the API's database health route: `https://crickethub-capstone-api.onrender.com/api/health/database`.
- Have a working registered account ready. Keep its password out of slides, screenshots, Git, and the Postman collection.
- Install Chromium once for local Playwright runs: `cd client && npx playwright install chromium`.

## Suggested live order

### 1. Backend Jest unit tests

```sh
cd server
npm run test:unit
```

These test validation, role middleware, and controller behavior with dependencies isolated. Show the passing Jest summary.

### 2. Backend API integration tests

Start PostgreSQL and seed the database first:

```sh
docker compose up -d postgres
cd server
npm run db:setup
npm run test:api
```

These use Supertest against the Express app and PostgreSQL. They cover registration/login, protected access, player/match flows, favourites, invalid inputs, role denial, and cross-account favourite privacy. They create and clean up test rows. If Docker/PostgreSQL is unavailable, show the GitHub Actions API job instead; this suite needs a database and `DATABASE_URL`/`JWT_SECRET` in `server/.env`.

`npm test` in `server/` runs the backend unit and API suites together. It does **not** run frontend tests.

### 3. Browser smoke tests

Ensure PostgreSQL is running and `server/.env` is configured, then:

```sh
cd server
npm run db:setup
cd ../client
npm run test:smoke
```

This runs the concise database-backed Playwright smoke journey. To show all browser feature tests, including admin workflows and axe accessibility scans, use:

```sh
npm run test:e2e
```

Playwright starts the API and Vite server. It does not start PostgreSQL. Reports appear under `client/playwright-report/`; failures include screenshots/traces under `client/test-results/`.

### 4. Accessibility checks

```sh
cd client
npx playwright test e2e/accessibility.spec.js
npm run test:a11y:lighthouse
```

The axe run scans home/login/register, registered-user and detail pages, and administrator pages. It checks WCAG 2.1 A/AA rules, including text contrast; the test also verifies that match status/result are readable text. Lighthouse scans the live homepage by default and fails below 90/100. Its HTML and JSON evidence are written to `security/reports/accessibility-lighthouse-live.report.html` and `.json`.

### 5. Postman API walkthrough

Import `testing/postman/CricketHub API.postman_collection.json` into Postman. Open the collection's **Variables** and set `email` and `password` locally for a registered account; leave `apiBaseUrl` at the deployed API URL unless you are testing locally. Do not save or export your real password with the collection.

Run the collection in its listed order with **Run** / Collection Runner. It checks API health, confirms player search rejects an anonymous request, logs in and stores the returned token, searches for seeded Aarav Mehta, fetches the player details, filters scheduled matches, reads favourites, and checks the role-protected endpoint. A registered user should get 403 there; an administrator should get 200. Show the green test summary and one request/response pair. The collection is read-only apart from signing in.

If Postman says the service is unavailable, first open the API database health URL above and wait for Render's free service to wake. For local testing, set `apiBaseUrl` to `http://localhost:3000` and start the local API/database.

### 6. Katalon Recorder login/search smoke

The scenario is `testing/katalon/crickethub-login-player-search.side`. Replace its two `REPLACE_WITH_TEST_...` values locally with a demo account, import the `.side` project into Katalon Recorder via its Selenium IDE import, select **Default Suite**, then click **Play**. It signs in, checks the dashboard heading, searches the seeded player Aarav Mehta, and checks the result. Show the run log with all steps passing.

The file format parses as JSON, but it has **not** been imported or played in the browser extension from this workspace. Verify the import and playback on the demo machine before promising that it works. Katalon currently describes Recorder as no longer actively maintained; if the extension fails on the current browser, show the equivalent Playwright player smoke test instead and report the Recorder compatibility issue honestly.

## Remaining release checks

- Confirm all four GitHub Actions jobs pass after pushing the latest commits.
- Deploy the latest code from `main` in Render and verify API/database health plus sign-in on the live site.
- Run Katalon Recorder playback and save a screenshot of its successful run, or use the Playwright fallback if the extension is incompatible.
- Generate Lighthouse HTML/JSON evidence against the deployed URL.
- Rerun the OWASP ZAP baseline against the deployed frontend/API after the security-header changes are live. The existing ZAP reports are from an earlier scan and do not prove the new headers are deployed.

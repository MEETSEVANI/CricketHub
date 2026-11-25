# Katalon Recorder: login and player search

This Selenium IDE `.side` project is intended for import into Katalon Recorder. It checks that a registered user can sign in and find the seeded player **Aarav Mehta** in the player directory. The file has been syntax-checked as JSON but has not been imported or played in the browser extension here; verify it in the demo browser before presenting a passing result.

## Run it

1. Open `crickethub-login-player-search.side` in a text editor and replace `REPLACE_WITH_TEST_EMAIL` and `REPLACE_WITH_TEST_PASSWORD` in the two `type` steps with a registered demo account. Keep real credentials local; do not commit them.
2. In Katalon Recorder, open the Test Explorer menu and choose **Import Selenium IDE**, then select the `.side` file.
3. Select **Default Suite** and click **Play**. The project is pointed at `https://crickethub-capstone-web.onrender.com`.
4. Evidence of a pass: every step completes, the dashboard heading appears after sign-in, and the player results include Aarav Mehta.

The site and API must be available, the account must already exist, and the production database must contain the seeded player. For a local run, change the project URL and `urls` entry to `http://127.0.0.1:5173` and start the app and API first.

Katalon Recorder's Selenium IDE import accepts `.side` projects. Katalon currently says Recorder is no longer actively maintained; this file is included to support the requested Recorder demonstration. Playwright remains the maintained, repeatable browser smoke suite in `client/e2e`.

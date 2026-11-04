import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dotenv = require('../../server/node_modules/dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });
const { Pool } = require('../../server/node_modules/pg');
const bcrypt = require('../../server/node_modules/bcrypt');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const password = 'Playwright@123';
let registeredEmail;
let adminEmail;
let newUserEmail;
let testPlayerName;
let testMatchName;

test.beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  registeredEmail = `pw-user-${suffix}@example.test`;
  adminEmail = `pw-admin-${suffix}@example.test`;
  const passwordHash = await bcrypt.hash(password, 4);
  await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'Registered User'), ($3, $2, 'Administrator')`,
    [registeredEmail, passwordHash, adminEmail]
  );
});

test.afterAll(async () => {
  const emails = [registeredEmail, adminEmail, newUserEmail].filter(Boolean);
  if (testPlayerName) await pool.query('DELETE FROM players WHERE name=$1', [testPlayerName]);
  if (testMatchName) await pool.query('DELETE FROM matches WHERE match_name=$1', [testMatchName]);
  if (emails.length) await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
  await pool.end();
});

async function signIn(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('a new visitor can register, sign in, and sign out', async ({ page }) => {
  newUserEmail = `pw-register-${Date.now()}@example.test`;
  await page.goto('/register');
  await page.getByLabel('Email address').fill(newUserEmail);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email address').fill(newUserEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('registered user can search, view details, save favourites, and browse matches', async ({ page }) => {
  await signIn(page, registeredEmail);

  await page.getByRole('navigation').getByRole('link', { name: 'Players', exact: true }).click();
  await page.getByLabel('Search players by name').fill('aArAv');
  await expect(page.getByRole('link', { name: /Aarav Mehta/ })).toBeVisible();
  await page.getByRole('link', { name: /Aarav Mehta/ }).click();
  await expect(page.getByRole('heading', { name: 'Aarav Mehta' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to favourites' }).click();

  await page.getByRole('navigation').getByRole('link', { name: 'Favourites' }).click();
  await expect(page.getByRole('link', { name: 'Aarav Mehta' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('You haven’t saved anything yet.')).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Matches', exact: true }).click();
  await page.getByLabel('Filter matches by status').selectOption('Scheduled');
  await expect(page.getByText('Autumn Shield: Stars vs Mariners')).toBeVisible();
  await page.getByRole('link', { name: 'Autumn Shield: Stars vs Mariners' }).click();
  await expect(page.getByRole('heading', { name: 'Autumn Shield: Stars vs Mariners' })).toBeVisible();
  await expect(page.getByText('Lineup has not been entered yet.')).toHaveCount(2);
});

test('registered user is blocked from administrator player management', async ({ page }) => {
  await signIn(page, registeredEmail);
  await page.goto('/admin/players');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.goto('/admin/matches');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();
});

test('administrator can create, update, and delete player records', async ({ page }) => {
  const playerName = `Playwright Demo ${Date.now()}`;
  testPlayerName = playerName;
  await signIn(page, adminEmail);
  await page.goto('/admin/players');
  await expect(page.getByRole('heading', { name: 'Manage players' })).toBeVisible();

  await page.getByLabel('Player name').fill(playerName);
  await page.getByLabel('Age').fill('26');
  await page.getByLabel('Country').fill('Canada');
  await page.getByRole('button', { name: 'Create player' }).click();
  await expect(page.getByRole('heading', { name: playerName })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Player created.');

  const playerRow = page.locator('[data-testid^="player-row-"]').filter({ hasText: playerName });
  await playerRow.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Age').fill('27');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('Player updated.');

  page.once('dialog', (dialog) => dialog.accept());
  await playerRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: playerName })).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Player deleted.');
});

test('administrator can create, complete, and delete match records', async ({ page }) => {
  testMatchName = `Playwright Match ${Date.now()}`;
  const future = new Date(Date.now() + 86_400_000);
  const localDateTime = new Date(future.getTime() - future.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  await signIn(page, adminEmail);
  await page.goto('/admin/matches');
  await expect(page.getByRole('heading', { name: 'Manage matches' })).toBeVisible();

  await page.getByLabel('Match name').fill(testMatchName);
  await page.getByLabel('Team A').fill('Northern Comets');
  await page.getByLabel('Team B').fill('Lakeshore Falcons');
  await page.getByLabel('Date and time').fill(localDateTime);
  await page.getByLabel('Venue').fill('Toronto Cricket Ground');
  await page.getByRole('button', { name: 'Create match' }).click();
  await expect(page.getByRole('status')).toContainText('Match created.');

  const matchRow = page.locator('[data-testid^="match-row-"]').filter({ hasText: testMatchName });
  await matchRow.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Status').selectOption('Completed');
  await page.getByLabel('Result').fill('Northern Comets won by 12 runs.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('Match updated.');
  await expect(matchRow).toContainText('Northern Comets won by 12 runs.');

  const matchId = Number((await matchRow.getAttribute('data-testid')).replace('match-row-', ''));
  await matchRow.getByRole('link', { name: 'Manage match data' }).click();
  await expect(page.getByRole('heading', { name: 'Match lineups and performances' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Add Aarav Mehta to Northern Comets lineup' }).check();
  await page.getByRole('checkbox', { name: 'Add Zoya Khan to Lakeshore Falcons lineup' }).check();
  await page.getByRole('button', { name: 'Save lineups' }).click();
  await expect(page.getByRole('status')).toContainText('Lineups saved.');

  await page.getByLabel('Aarav Mehta runs').fill('74');
  await page.getByLabel('Aarav Mehta wickets').fill('1');
  await page.getByLabel('Zoya Khan runs').fill('28');
  await page.getByLabel('Zoya Khan wickets').fill('3');
  await page.getByRole('button', { name: 'Save performances' }).click();
  await expect(page.getByRole('status')).toContainText('Player performances saved.');

  await page.goto(`/matches/${matchId}`);
  await expect(page.getByRole('heading', { name: testMatchName })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aarav Mehta' })).toBeVisible();
  await expect(page.getByText('74 runs · 1 wickets')).toBeVisible();

  await page.goto('/admin/matches');
  const updatedMatchRow = page.locator('[data-testid^="match-row-"]').filter({ hasText: testMatchName });
  page.once('dialog', (dialog) => dialog.accept());
  await updatedMatchRow.getByRole('button', { name: 'Delete' }).click();
  await expect(updatedMatchRow).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Match deleted.');
});

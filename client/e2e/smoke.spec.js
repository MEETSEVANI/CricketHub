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
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('registered user can search, view details, save favourites, and browse matches', async ({ page }) => {
  await signIn(page, registeredEmail);

  await page.getByRole('link', { name: 'Players', exact: true }).click();
  await page.getByLabel('Search players by name').fill('aArAv');
  await expect(page.getByRole('link', { name: /Aarav Mehta/ })).toBeVisible();
  await page.getByRole('link', { name: /Aarav Mehta/ }).click();
  await expect(page.getByRole('heading', { name: 'Aarav Mehta' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to favourites' }).click();

  await page.getByRole('link', { name: 'Favourites' }).click();
  await expect(page.getByRole('link', { name: 'Aarav Mehta' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('You haven’t saved anything yet.')).toBeVisible();

  await page.getByRole('link', { name: 'Matches', exact: true }).click();
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

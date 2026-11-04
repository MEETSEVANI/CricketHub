import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dotenv = require('../../server/node_modules/dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

test('visitor can register, sign in, and sign out; private routes redirect after sign out', async ({ page }) => {
  const registeredEmail = `pw-auth-${Date.now()}@example.test`;
  const password = 'Playwright@123';
  await page.route('**/api/auth/register', (route) => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', message: 'Account created successfully.' }),
  }));
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success', token: 'playwright-test-token',
      user: { id: 10, email: registeredEmail, role: 'Registered User' },
    }),
  }));

  await page.goto('/register');
  await page.getByLabel('Email address').fill(registeredEmail);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email address').fill(registeredEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

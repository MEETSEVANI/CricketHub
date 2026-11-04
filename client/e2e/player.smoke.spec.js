import { test, expect } from '@playwright/test';

test('registered user can find a player, view the profile, and save a favourite', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success', token: 'playwright-test-token',
      user: { id: 10, email: 'player-smoke@example.test', role: 'Registered User' },
    }),
  }));
  const player = { id: 21, name: 'Aarav Mehta', age: 29, country: 'India', role: 'Batsman', total_matches: 84, total_runs: 3120, total_wickets: 2 };
  await page.route('**/api/players/21', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', player }),
  }));
  await page.route('**/api/players*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', players: [player] }),
  }));
  await page.route('**/api/favourites', (route) => route.fulfill({
    status: route.request().method() === 'POST' ? 201 : 200,
    contentType: 'application/json',
    body: JSON.stringify(route.request().method() === 'POST'
      ? { status: 'success', message: 'Added to favourites.', favouriteId: 1 }
      : { status: 'success', favourites: [] }),
  }));

  await page.goto('/login');
  await page.getByLabel('Email address').fill('player-smoke@example.test');
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Players', exact: true }).click();
  await page.getByLabel('Search players by name').fill('aarav');
  await page.getByRole('link', { name: /Aarav Mehta/ }).click();
  await expect(page.getByRole('heading', { name: 'Aarav Mehta' })).toBeVisible();
  await expect(page.getByText('3120')).toBeVisible();
  await page.getByRole('button', { name: 'Add to favourites' }).click();
  await expect(page.getByRole('button', { name: 'Remove from favourites' })).toBeVisible();
});

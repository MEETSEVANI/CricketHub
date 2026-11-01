import { test, expect } from '@playwright/test';

async function signIn(page, role, email) {
  await page.goto('/login');
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      token: 'playwright-test-token',
      user: { id: role === 'Administrator' ? 11 : 12, email, role },
    }),
  }));
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();
}

test('registered users cannot open administrator player management', async ({ page }) => {
  await signIn(page, 'Registered User', 'member-smoke@example.test');
  await page.goto('/admin/players');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();
});

test('administrator can create, update, and delete a player', async ({ page }) => {
  const players = [];
  let nextId = 71;
  await signIn(page, 'Administrator', 'admin-smoke@example.test');
  await page.route(/\/api\/players(?:\/\d+)?$/, async (route) => {
    const method = route.request().method();
    const pathname = new URL(route.request().url()).pathname;
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', players: [...players] }) });
    }

    if (method === 'POST') {
      const player = { id: nextId++, ...route.request().postDataJSON() };
      players.push(player);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: 'success', message: 'Player created.', player }) });
    }

    const id = Number(pathname.split('/').at(-1));
    const index = players.findIndex((player) => player.id === id);
    if (method === 'PUT' && index >= 0) {
      players[index] = { ...players[index], ...route.request().postDataJSON() };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', message: 'Player updated.', player: players[index] }) });
    }
    if (method === 'DELETE' && index >= 0) {
      players.splice(index, 1);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', message: 'Player deleted.' }) });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'Player not found.' }) });
  });

  await page.goto('/admin');
  await page.getByRole('link', { name: 'Open player management' }).click();
  await expect(page.getByRole('heading', { name: 'Manage players' })).toBeVisible();
  const playerName = 'Playwright Admin Player';
  await page.getByLabel('Player name').fill(playerName);
  await page.getByLabel('Age').fill('26');
  await page.getByLabel('Country').fill('Canada');
  await page.getByRole('button', { name: 'Create player' }).click();
  await expect(page.getByRole('status')).toContainText('Player created.');

  const row = page.locator('[data-testid^="player-row-"]').filter({ hasText: playerName });
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Age').fill('27');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('Player updated.');
  await expect(row).toContainText('27');

  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(row).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Player deleted.');
});

import { test, expect } from '@playwright/test';

test('registered user can open a completed match and review its lineups and scorecard', async ({ page }) => {
  const match = {
    id: 31,
    match_name: 'Autumn Shield: Stars vs Mariners',
    team_a: 'Stars',
    team_b: 'Mariners',
    match_datetime: '2026-10-30T14:00:00.000Z',
    venue: 'Maple Oval',
    status: 'Completed',
    result: 'Stars won by 22 runs',
  };
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      token: 'playwright-test-token',
      user: { id: 10, email: 'match-details-smoke@example.test', role: 'Registered User' },
    }),
  }));
  await page.route('**/api/matches/31', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      match,
      lineups: [
        { team_name: 'Stars', player_id: 41, name: 'Aarav Mehta', role: 'Batsman' },
        { team_name: 'Mariners', player_id: 42, name: 'Noah Brooks', role: 'Bowler' },
      ],
      performances: [
        { player_id: 41, name: 'Aarav Mehta', runs: 68, wickets: 0 },
        { player_id: 42, name: 'Noah Brooks', runs: 12, wickets: 2 },
      ],
    }),
  }));
  await page.route('**/api/matches*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', matches: [match] }),
  }));

  await page.goto('/login');
  await page.getByLabel('Email address').fill('match-details-smoke@example.test');
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.getByRole('link', { name: 'Matches' }).click();
  await page.getByRole('link', { name: match.match_name }).click();
  await expect(page.getByRole('heading', { name: match.match_name })).toBeVisible();
  await expect(page.getByText(match.result)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stars lineup' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aarav Mehta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Player performances' })).toBeVisible();
  await expect(page.getByText('68 runs · 0 wickets')).toBeVisible();
});

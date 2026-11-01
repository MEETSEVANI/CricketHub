import { test, expect } from '@playwright/test';

test('registered user can search and filter the match list', async ({ page }) => {
  const scheduledMatch = {
    id: 31,
    match_name: 'Autumn Shield: Stars vs Mariners',
    team_a: 'Stars',
    team_b: 'Mariners',
    match_datetime: '2026-11-14T14:00:00.000Z',
    venue: 'Maple Oval',
    status: 'Scheduled',
    result: null,
  };
  const completedMatch = {
    ...scheduledMatch,
    id: 32,
    match_name: 'Summer Cup: Falcons vs Comets',
    team_a: 'Falcons',
    team_b: 'Comets',
    status: 'Completed',
    result: 'Falcons won by 18 runs',
  };

  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      token: 'playwright-test-token',
      user: { id: 10, email: 'matches-smoke@example.test', role: 'Registered User' },
    }),
  }));
  await page.route('**/api/matches*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const candidates = params.get('status') === 'Scheduled' ? [scheduledMatch] : [scheduledMatch, completedMatch];
    const matches = candidates.filter((match) => !params.get('q') || `${match.match_name} ${match.team_a} ${match.team_b}`.toLowerCase().includes(params.get('q').toLowerCase()));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', matches }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('matches-smoke@example.test');
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.getByRole('link', { name: 'Matches', exact: true }).click();
  await expect(page.getByText(scheduledMatch.match_name)).toBeVisible();
  await expect(page.getByText(completedMatch.match_name)).toBeVisible();
  await page.getByLabel('Filter matches by status').selectOption('Scheduled');
  await expect(page.getByText(scheduledMatch.match_name)).toBeVisible();
  await expect(page.getByText(completedMatch.match_name)).toHaveCount(0);
  await page.getByLabel('Search matches').fill('Mariners');
  await expect(page.getByText(scheduledMatch.match_name)).toBeVisible();
  await expect(page.getByText(completedMatch.match_name)).toHaveCount(0);
});

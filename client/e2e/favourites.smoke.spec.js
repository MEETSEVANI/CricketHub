import { test, expect } from '@playwright/test';

test('registered user can save players and matches, then remove them from favourites', async ({ page }) => {
  const player = { id: 21, name: 'Aarav Mehta', age: 29, country: 'India', role: 'Batsman', total_matches: 84, total_runs: 3120, total_wickets: 2 };
  const match = {
    id: 31,
    match_name: 'Autumn Shield: Stars vs Mariners',
    team_a: 'Stars',
    team_b: 'Mariners',
    match_datetime: '2026-11-14T14:00:00.000Z',
    venue: 'Maple Oval',
    status: 'Scheduled',
    result: null,
  };
  const favourites = [];

  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'success',
      token: 'playwright-test-token',
      user: { id: 10, email: 'favourites-smoke@example.test', role: 'Registered User' },
    }),
  }));
  await page.route('**/api/players*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(route.request().url().includes('/21')
      ? { status: 'success', player }
      : { status: 'success', players: [player] }),
  }));
  await page.route('**/api/matches*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'success', matches: [match] }),
  }));
  await page.route('**/api/favourites/**', async (route) => {
    const [, type, id] = new URL(route.request().url()).pathname.match(/\/api\/favourites\/(player|match)\/(\d+)/) || [];
    const index = favourites.findIndex((item) => item.type === type && String(type === 'player' ? item.player_id : item.match_id) === id);
    if (index >= 0) favourites.splice(index, 1);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', message: 'Removed from favourites.' }) });
  });
  await page.route('**/api/favourites', async (route) => {
    if (route.request().method() === 'POST') {
      const target = route.request().postDataJSON();
      favourites.push(target.type === 'player'
        ? { id: favourites.length + 1, type: 'player', player_id: target.id, player_name: player.name, country: player.country, role: player.role }
        : { id: favourites.length + 1, type: 'match', match_id: target.id, match_name: match.match_name, team_a: match.team_a, team_b: match.team_b, match_status: match.status });
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: 'success', favouriteId: favourites.length }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', favourites: [...favourites] }) });
  });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('favourites-smoke@example.test');
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to CricketHub' })).toBeVisible();

  await page.getByRole('link', { name: 'Players', exact: true }).click();
  await page.getByRole('button', { name: 'Add Aarav Mehta to favourites' }).click();
  await page.getByRole('link', { name: 'Matches', exact: true }).click();
  await page.getByRole('button', { name: 'Add Autumn Shield: Stars vs Mariners to favourites' }).click();
  await page.getByRole('link', { name: 'Favourites' }).click();
  await expect(page.getByRole('link', { name: 'Aarav Mehta' })).toBeVisible();
  await expect(page.getByRole('link', { name: match.match_name })).toBeVisible();

  await page.getByRole('button', { name: `Remove ${match.match_name} from favourites` }).click();
  await expect(page.getByRole('link', { name: match.match_name })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove Aarav Mehta from favourites' }).click();
  await expect(page.getByText('You haven’t saved anything yet.')).toBeVisible();
});

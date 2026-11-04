import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const user = { id: 9001, email: 'axe-user@example.test', role: 'Registered User' };
const admin = { id: 9002, email: 'axe-admin@example.test', role: 'Administrator' };
const player = {
  id: 1,
  name: 'Aarav Mehta',
  age: 27,
  country: 'India',
  role: 'Batsman',
  batting_style: 'Right-hand bat',
  bowling_style: 'Right-arm medium',
};
const match = {
  id: 1,
  match_name: 'Autumn Shield: Stars vs Mariners',
  team_a: 'North Stars',
  team_b: 'Bay Mariners',
  match_datetime: '2026-11-08T10:00:00.000Z',
  venue: 'Harbour Ground',
  status: 'Scheduled',
  result: null,
};
const completedMatch = {
  ...match,
  status: 'Completed',
  result: 'North Stars won by 18 runs.',
};
const favourites = [
  { id: 1, type: 'player', player_id: player.id, player_name: player.name, country: player.country, role: player.role },
  { id: 2, type: 'match', match_id: match.id, match_name: match.match_name, team_a: match.team_a, team_b: match.team_b, match_status: match.status },
];

async function prepareApi(page) {
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname === '/api/favourites'
      ? { status: 'success', favourites }
      : pathname === `/api/players/${player.id}`
        ? { status: 'success', player }
        : pathname === `/api/matches/${match.id}`
          ? {
            status: 'success',
            match: completedMatch,
            lineups: [{ player_id: player.id, name: player.name, role: player.role, team_name: completedMatch.team_a }],
            performances: [],
          }
      : pathname.includes('/players')
        ? { status: 'success', players: [player] }
        : pathname.includes('/matches')
          ? { status: 'success', matches: [completedMatch] }
          : { status: 'success', favourites };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function signInAs(page, account) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('crickethub_token', 'axe-test-token');
    localStorage.setItem('crickethub_user', JSON.stringify(storedUser));
  }, account);
}

async function expectAccessible(page, route, readyText) {
  await page.goto(route);
  if (readyText) await expect(page.getByText(readyText, { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    results.violations,
    results.violations.map(({ id, impact, description, nodes }) =>
      `${impact} ${id}: ${description}\n${nodes.map(({ target, failureSummary }) => `  ${target.join(', ')}: ${failureSummary}`).join('\n')}`
    ).join('\n\n'),
  ).toEqual([]);
}

test('A11Y-01 public home and authentication pages have no WCAG 2.1 A/AA violations', async ({ page }) => {
  for (const route of ['/', '/login', '/register']) {
    await expectAccessible(page, route);
  }
});

test('A11Y-01 registered pages have no WCAG 2.1 A/AA violations and status text does not rely on color alone', async ({ page }) => {
  await prepareApi(page);
  await signInAs(page, user);

  for (const route of ['/dashboard', '/players', '/favourites']) {
    await expectAccessible(page, route);
  }
  await expectAccessible(page, '/matches');
  const matchCard = page.locator('article').filter({ hasText: completedMatch.match_name });
  await expect(matchCard.getByText('Completed', { exact: true })).toBeVisible();
  await expect(matchCard.getByText(completedMatch.result, { exact: true })).toBeVisible();

  await expectAccessible(page, `/players/${player.id}`, player.name);
  await expectAccessible(page, `/matches/${match.id}`, completedMatch.match_name);

  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await expect(page.getByText(completedMatch.result, { exact: true })).toBeVisible();
});

test('A11Y-01 administrator pages have no WCAG 2.1 A/AA violations', async ({ page }) => {
  await prepareApi(page);
  await signInAs(page, admin);

  for (const route of ['/admin', '/admin/players', '/admin/matches']) {
    await expectAccessible(page, route);
  }
});

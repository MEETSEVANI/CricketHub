import { defineConfig, devices } from '@playwright/test';
import { env } from 'node:process';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/auth.smoke.spec.js', '**/player.smoke.spec.js', '**/matches.smoke.spec.js', '**/match-details.smoke.spec.js', '**/favourites.smoke.spec.js', '**/admin-players.smoke.spec.js'],
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../server',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: !env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: '.',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !env.CI,
      timeout: 60_000,
    },
  ],
});

import { mkdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(scriptDirectory, '..');
const lighthouseCli = path.join(clientDirectory, 'node_modules/lighthouse/cli/index.js');
const reportBase = path.resolve(clientDirectory, '../security/reports/accessibility-lighthouse-live');
const targetUrl = process.env.LIGHTHOUSE_TARGET_URL || 'https://crickethub-capstone-web.onrender.com/';
const targetScore = Number(process.env.LIGHTHOUSE_A11Y_TARGET || 90);

await mkdir(path.dirname(reportBase), { recursive: true });

const result = spawnSync(process.execPath, [
  lighthouseCli,
  targetUrl,
  '--only-categories=accessibility',
  '--output=html',
  '--output=json',
  `--output-path=${reportBase}`,
  '--chrome-flags=--headless --no-sandbox',
  '--quiet',
], {
  cwd: clientDirectory,
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const report = JSON.parse(await readFile(`${reportBase}.report.json`, 'utf8'));
const score = Math.round(report.categories.accessibility.score * 100);
console.log(`Lighthouse accessibility score: ${score}/100 (target: ${targetScore}/100)`);
console.log(`HTML report: ${reportBase}.report.html`);
console.log(`JSON report: ${reportBase}.report.json`);

if (score < targetScore) {
  console.error('The Lighthouse accessibility score did not meet the configured target.');
  process.exitCode = 1;
}

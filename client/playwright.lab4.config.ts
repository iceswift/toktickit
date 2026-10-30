import { defineConfig } from '@playwright/test';

// Explicit opt-in: this suite mutates synthetic fixtures and must never reuse a
// working app server, database or authenticated browser session.
const database = process.env.LAB4_UI_DATABASE_URL;
const parsed = database ? new URL(database) : null;
if (process.env.LAB4_UI_TEST !== '1' || !parsed || parsed.hostname !== '127.0.0.1' ||
    parsed.port !== '55484' || !/^\/lab4_p[4567]_ui_[a-z0-9_]+$/.test(parsed.pathname)) {
  throw new Error('Opt in with LAB4_UI_TEST=1 and a fresh loopback:55484/lab4_p[4567]_ui_* database.');
}
process.env.DATABASE_URL = database;
export default defineConfig({
  testDir: './e2e/lab-04', timeout: 60_000, workers: 1, fullyParallel: false,
  reporter: 'list', outputDir: './test-results/lab4',
  use: { baseURL: 'http://127.0.0.1:55486', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm.cmd run dev', cwd: '../server', url: 'http://127.0.0.1:55485/api/health',
      reuseExistingServer: false, timeout: 30_000,
      env: { DATABASE_URL: database!, PORT: '55485', CLIENT_ORIGIN: 'http://127.0.0.1:55486' } },
    { command: 'npm.cmd run dev -- --host 127.0.0.1 --port 55486 --strictPort', cwd: '.',
      url: 'http://127.0.0.1:55486', reuseExistingServer: false, timeout: 30_000,
      env: { VITE_API_URL: 'http://127.0.0.1:55485' } },
  ],
});

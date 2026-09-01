import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5173", screenshot: "only-on-failure" },
  webServer: [
    { command: "npm.cmd run dev", cwd: "../server", url: "http://127.0.0.1:3000/api/health", reuseExistingServer: true, timeout: 30_000 },
    { command: "npm.cmd run dev -- --host 127.0.0.1", cwd: ".", url: "http://127.0.0.1:5173", reuseExistingServer: true, timeout: 30_000 },
  ],
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ../scripts/test-server.js",
    url: "http://127.0.0.1:4173/api/v1/healthcheck",
    reuseExistingServer: false,
    timeout: 90000,
  },
  reporter: "list",
});

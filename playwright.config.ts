import { defineConfig, devices } from "@playwright/test";

// CI runners start with a cold .next, so `next dev` compiles every route on its
// first request and the suite spends its time waiting on the compiler. Building
// once and serving the production output is both faster there and closer to what
// actually ships. Local runs keep `next dev` for fast iteration.
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3117",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], channel: "chrome" }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: isCI
      ? "npm run build && npx next start --hostname 127.0.0.1 --port 3117"
      : "npm run dev -- --hostname 127.0.0.1 --port 3117",
    url: "http://127.0.0.1:3117",
    reuseExistingServer: false,
    timeout: isCI ? 300_000 : 120_000,
  },
});

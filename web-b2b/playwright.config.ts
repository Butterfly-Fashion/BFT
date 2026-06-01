import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  webServer: {
    command: "npx next dev --hostname 0.0.0.0 --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      SMTP_HOST: process.env.SMTP_HOST ?? "smtp.gmail.com",
      SMTP_PORT: process.env.SMTP_PORT ?? "587",
      SMTP_USER: process.env.SMTP_USER ?? "",
      SMTP_PASS: process.env.SMTP_PASS ?? "",
      STORE_NAME: process.env.STORE_NAME ?? "World Fan Gear",
      EMAIL_FROM: process.env.EMAIL_FROM ?? "",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "",
    },
  },
});

import { defineConfig } from '@playwright/test';

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: 4,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm build && pnpm preview --port 3320 --strictPort',
      url: 'http://localhost:3320',
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
    {
      // 用 env 而不是 shell 内联变量，Windows 上同样可用。
      command: 'pnpm exec vite build --outDir dist-subpath && pnpm exec vite preview --outDir dist-subpath --port 3321 --strictPort',
      env: { VITE_BASE_PATH: '/pilot-admin/' },
      url: 'http://localhost:3321/pilot-admin/',
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'root', testIgnore: 'subpath.spec.ts', use: { baseURL: 'http://localhost:3320' } },
    { name: 'subpath', testMatch: 'subpath.spec.ts', use: { baseURL: 'http://localhost:3321/pilot-admin/' } },
  ],
});

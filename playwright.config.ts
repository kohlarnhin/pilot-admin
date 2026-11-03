import { defineConfig } from '@playwright/test';

const ci = Boolean(process.env.CI);
// 端口可覆盖，多个工作树并行运行 E2E 时互不复用对方的预览服务。
const rootPort = Number(process.env.E2E_PORT || 3320);
const subpathPort = Number(process.env.E2E_SUBPATH_PORT || 3321);

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
      command: `pnpm build && pnpm preview --port ${rootPort} --strictPort`,
      url: `http://localhost:${rootPort}`,
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
    {
      // 用 env 而不是 shell 内联变量，Windows 上同样可用。
      command: `pnpm exec vite build --outDir dist-subpath && pnpm exec vite preview --outDir dist-subpath --port ${subpathPort} --strictPort`,
      env: { VITE_BASE_PATH: '/pilot-admin/' },
      url: `http://localhost:${subpathPort}/pilot-admin/`,
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: 'root', testIgnore: 'subpath.spec.ts', use: { baseURL: `http://localhost:${rootPort}` } },
    { name: 'subpath', testMatch: 'subpath.spec.ts', use: { baseURL: `http://localhost:${subpathPort}/pilot-admin/` } },
  ],
});

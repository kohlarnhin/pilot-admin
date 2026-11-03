import { test, expect, zh, logout, signIn } from './fixtures';

test('prefixed cold deep link, login, navigation, assets and logout', async ({ page, baseURL }) => {
  // baseURL 已含 /pilot-admin/ 前缀，端口由 E2E_SUBPATH_PORT 决定。
  const at = (route: string) => new URL(route, baseURL).href;
  const assets: { url: string; status: number }[] = [];
  page.on('response', (response) => {
    if (['script', 'stylesheet', 'font', 'image'].includes(response.request().resourceType())) {
      assets.push({ url: response.url(), status: response.status() });
    }
  });
  await page.goto('system/users');
  await expect(page).toHaveURL(at('login'));
  const fontPreloads = page.locator('link[rel="preload"][as="font"]');
  await expect(fontPreloads).toHaveCount(2);
  for (const href of await fontPreloads.evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href))) {
    expect(href.startsWith(new URL('assets/', baseURL).href)).toBe(true);
    expect(href).toMatch(/\/(open-sans-latin-wght|jetbrains-mono-latin-400)-normal-[^/]+\.woff2$/);
  }
  await signIn(page, 'admin');
  await page.getByRole('dialog', { name: zh.agentEntry.title }).getByRole('button', { name: zh.agentEntry.console, exact: true }).click();
  await expect(page).toHaveURL(at('dashboard'));
  await page.getByRole('link', { name: zh.menu.users, exact: true }).click();
  await expect(page).toHaveURL(at('system/users'));
  await expect(page.getByRole('heading', { name: zh.menu.users, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: zh.button.userCreate, exact: true })).toBeVisible();
  await expect.poll(() => assets.filter((asset) => asset.url.endsWith('.js')).length).toBeGreaterThan(0);
  await expect.poll(() => assets.filter((asset) => asset.url.endsWith('.css')).length).toBeGreaterThan(0);
  expect(assets.every((asset) => new URL(asset.url).pathname.startsWith('/pilot-admin/') && asset.status === 200)).toBe(true);
  await logout(page);
  await expect(page).toHaveURL(at('login'));
});

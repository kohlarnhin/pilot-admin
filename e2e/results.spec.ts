import { test, expect, zh } from './fixtures';

test('result gallery includes all nine variants with usable actions', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/results');
  await expect(page.getByRole('heading', { name: zh.exampleResults.title, exact: true })).toBeVisible();
  for (const status of ['success', 'error', 'info', 'warning', '403', '404', '500', 'network', 'maintenance']) {
    await expect(page.locator(`[data-result-status="${status}"]`)).toHaveCount(1);
    await expect(page.locator(`[data-result-status="${status}"]`).getByRole('heading', { level: 3 })).toHaveCount(1);
  }
  await page.locator('[data-result-status="network"]').getByRole('button', { name: zh.exampleResults.retry, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.exampleResults.retry, exact: true }).first()).toBeFocused();
  await page.locator('[data-result-status="info"]').getByRole('link').click();
  await expect(page).toHaveURL(/\/examples\/forms\/sections$/);
});

test('network retry demo calls the mock service and can be restarted with the keyboard', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('examples/results');
  const demo = page.getByRole('region', { name: zh.exampleResults.title, exact: true }).locator('section').first();
  const retry = demo.getByRole('button', { name: zh.exampleResults.retry, exact: true });
  await retry.focus();
  await retry.press('Enter');
  await expect(demo.getByRole('heading', { name: zh.exampleResults.connected, exact: true })).toBeVisible();
  await demo.getByRole('button', { name: zh.exampleResults.restart, exact: true }).press('Space');
  await expect(demo.getByRole('heading', { name: zh.exampleResults.variants.network.title, exact: true })).toBeVisible();
  await retry.press('Enter');
  await expect(demo.getByRole('heading', { name: zh.exampleResults.connected, exact: true })).toBeVisible();
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))).toEqual({ x: 0, y: 0 });
});

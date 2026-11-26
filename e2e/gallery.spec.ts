import { test, expect, zh } from './fixtures';

const copy = zh.gallery;

test('gallery toc jumps without sweeping and new controls work by keyboard', async ({ page, loginAs }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAs('admin');
  await page.goto('examples/components');
  const toc = page.getByRole('navigation', { name: copy.toc.title });
  await page.locator('[data-slot="gallery-scroll"]').evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(toc.locator('[aria-current="location"]')).toHaveText(copy.skeletons.title);

  await toc.getByRole('button', { name: copy.inputs.title, exact: true }).click();
  for (let index = 0; index < 6; index += 1) {
    await expect(toc.locator('[aria-current="location"]')).toHaveText(copy.inputs.title);
    await page.waitForTimeout(60);
  }

  const view = page.getByRole('radiogroup', { name: copy.radio.viewLabel });
  await view.getByRole('radio', { name: copy.radio.viewList }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(view.getByRole('radio', { name: copy.radio.viewBoard })).toHaveAttribute('aria-checked', 'true');
  await expect(view.getByRole('radio', { name: copy.radio.viewBoard })).toBeFocused();

  await page.getByRole('button', { name: new RegExp(`^${copy.date.basicLabel}`) }).click();
  const calendar = page.getByRole('dialog', { name: zh.ui.chooseDate });
  await expect(calendar.locator('button[tabindex="0"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const target = await calendar.locator('button[tabindex="0"]').getAttribute('data-date');
  await page.keyboard.press('Enter');
  await expect(calendar).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: target ?? '' })).toBeVisible();

  await page.getByRole('button', { name: new RegExp(`^${copy.date.rangedLabel}`) }).click();
  await expect(page.getByRole('button', { name: zh.ui.prevMonth })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: zh.ui.chooseDate })).toBeHidden();
});

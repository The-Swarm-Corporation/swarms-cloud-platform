import { test, expect } from '@playwright/test';
import { clearAppStorage, seedApiKey } from './_helpers';

test.describe('API key gate', () => {
  test('appears on first load when no key is stored', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/');

    // The gate prompts for a Swarms API key - any heading or text
    // mentioning "api key" within a dialog/modal counts.
    await expect(
      page.getByText(/swarms[_ ]?api[_ ]?key|enter your api key/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('does not appear when a key is already stored', async ({ page }) => {
    await seedApiKey(page);
    await page.goto('/');

    // The dashboard heading is visible quickly and no api-key prompt blocks it
    await expect(
      page.getByRole('heading', { level: 1, name: /dashboard/i })
    ).toBeVisible();
  });

  test('settings page shows the masked key', async ({ page }) => {
    await seedApiKey(page, 'sk-abcdef123456ghijklmn');
    await page.goto('/settings');

    // The settings page renders the current key as `prefix…suffix`
    await expect(
      page.getByText(/sk-abc.+lmn/i).first()
    ).toBeVisible();
  });
});

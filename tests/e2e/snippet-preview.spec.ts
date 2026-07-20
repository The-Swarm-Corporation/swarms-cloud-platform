import { test, expect } from '@playwright/test';
import { seedApiKey } from './_helpers';

/**
 * The playground renders a SnippetPreview tied to the live payload. We
 * confirm the request preview shows up with the swarm endpoint and that
 * switching language tabs replaces the code body.
 */
test.describe('Playground snippet preview', () => {
  test.beforeEach(async ({ page }) => {
    await seedApiKey(page);
    await page.goto('/playground');
  });

  test('shows the swarm completions endpoint and switches language tabs', async ({
    page,
  }) => {
    const preview = page.getByRole('region', { name: /request preview/i }).or(
      page.locator('text=/Request preview/i').locator('xpath=ancestor::div[1]')
    );

    // Endpoint label appears somewhere in the preview header
    await expect(
      page.getByText('/v1/swarm/completions').first()
    ).toBeVisible();

    // cURL is the default tab - code includes a curl command
    await expect(page.locator('pre code').first()).toContainText('curl');

    // Switch to TypeScript; code body should switch to fetch
    await page.getByRole('tab', { name: 'TypeScript' }).click();
    await expect(page.locator('pre code').first()).toContainText('fetch');

    // Switch to Python; code body should switch to import requests
    await page.getByRole('tab', { name: 'Python' }).click();
    await expect(page.locator('pre code').first()).toContainText(
      'import requests'
    );

    // JSON tab should show pure JSON (no curl/requests/fetch keyword)
    await page.getByRole('tab', { name: 'JSON' }).click();
    const json = (await page.locator('pre code').first().textContent()) ?? '';
    expect(json.trim().startsWith('{')).toBe(true);
  });
});

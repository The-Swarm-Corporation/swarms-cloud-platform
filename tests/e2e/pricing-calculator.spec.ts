import { test, expect, type Page, type Locator } from '@playwright/test';
import { seedApiKey } from './_helpers';

/**
 * Pricing-calculator fields aren't programmatically labeled - the <label>
 * is a sibling of the <input>, not for=-linked. Walk from the label text
 * to the next sibling input directly.
 */
function fieldInput(page: Page, labelText: string | RegExp): Locator {
  return page
    .locator('label', { hasText: labelText })
    .locator('xpath=following-sibling::input[1]');
}

function fieldSelect(page: Page, labelText: string | RegExp): Locator {
  return page
    .locator('label', { hasText: labelText })
    .locator('xpath=following-sibling::select[1]');
}

function fieldToggle(page: Page, labelText: string | RegExp): Locator {
  // Toggles are <label><input type=checkbox/>…label text…</label>
  return page
    .locator('label', { hasText: labelText })
    .getByRole('checkbox');
}

test.describe('Pricing calculator', () => {
  test.beforeEach(async ({ page }) => {
    await seedApiKey(page);
    await page.goto('/pricing');
  });

  test('recomputes the total when token counts change', async ({ page }) => {
    await fieldInput(page, /input tokens \/ request/i).fill('1000000');
    await fieldInput(page, /output tokens \/ request/i).fill('1000000');

    // Default endpoint = Swarm Completions (agent cost applies),
    // 1 agent default, 1 request default:
    //   tokens = (1M/1M)*6.5 + (1M/1M)*18.5 = 25.00
    //   agentCost = 0.01
    //   total = 25.01
    const total = page.getByText(/\$25\.\d{2}/).first();
    await expect(total).toBeVisible();
  });

  test('Frenzy Mode zeros out the total', async ({ page }) => {
    await fieldInput(page, /input tokens \/ request/i).fill('1000000');
    await fieldToggle(page, /frenzy mode/i).check();

    // The headline total card shows $0.00 when Frenzy is on
    await expect(page.getByText('$0.00').first()).toBeVisible();
  });

  test('night discount checkbox is disabled for non-swarm endpoints', async ({
    page,
  }) => {
    await fieldSelect(page, /endpoint/i).selectOption('agent');
    await expect(fieldToggle(page, /night-time discount/i)).toBeDisabled();
  });
});

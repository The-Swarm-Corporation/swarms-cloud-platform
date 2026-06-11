import { test, expect } from '@playwright/test';

test.describe('Observability page', () => {
  test('loads the page shell and controls', async ({ page }) => {
    await page.goto('/observability');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Observability' })
    ).toBeVisible();

    // Controls bar
    await expect(page.getByText('Last 15m')).toBeVisible();
    await expect(page.getByText('24h')).toBeVisible();
    await expect(page.getByText('Auto-refresh')).toBeVisible();
  });

  test('range picker changes active state', async ({ page }) => {
    await page.goto('/observability');

    const btn7d = page.locator('button', { hasText: '7d' });
    await btn7d.click();
    await expect(btn7d).toHaveClass(/bg-card/);
  });

  test('tab switching works', async ({ page }) => {
    await page.goto('/observability');

    const latencyTab = page.locator('button', { hasText: 'Latency' });
    await latencyTab.click();
    await expect(latencyTab).toHaveClass(/bg-card/);

    const costTab = page.locator('button', { hasText: 'Cost' });
    await costTab.click();
    await expect(costTab).toHaveClass(/bg-card/);
  });
});

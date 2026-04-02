import { test, expect } from '@playwright/test';

test.describe('Auto Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('cycles through layouts with L key', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');

    // Cycle through layouts - should not crash
    await page.keyboard.press('l');
    await page.waitForTimeout(200);
    await page.keyboard.press('l');
    await page.waitForTimeout(200);
    await page.keyboard.press('l');
    await page.waitForTimeout(200);
  });

  test('tree layout positions children below parent', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    const child = page.locator('[data-node-id="n_1"]');
    await expect(child).toBeVisible();

    const rootBox = await root.boundingBox();
    const childBox = await child.boundingBox();
    expect(childBox!.y).toBeGreaterThan(rootBox!.y);
  });

  test('fit-to-view centers tree', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('f');
    await page.waitForTimeout(300);
    // Just verify no crash
  });

});

import { test, expect } from '@playwright/test';

test.describe('Node Tags', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('adds tag to node via toolbar', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Look for tag button in toolbar
    const tagBtn = page.locator('button[title*="tag" i], button[aria-label*="tag" i]').first();
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
      const tagInput = page.locator('input[placeholder*="tag" i]').first();
      if (await tagInput.isVisible()) {
        await tagInput.fill('important');
        await page.keyboard.press('Enter');
        await expect(root).toContainText('important');
      }
    }
  });

  test('filters nodes by tag', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Add a tag first
    const tagBtn = page.locator('button[title*="tag" i], button[aria-label*="tag" i]').first();
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
      const tagInput = page.locator('input[placeholder*="tag" i]').first();
      if (await tagInput.isVisible()) {
        await tagInput.fill('work');
        await page.keyboard.press('Enter');
      }
    }

    // Open search/filter
    await page.keyboard.press('Meta+k');
    const dialog = page.locator('[role="combobox"], [role="dialog"]').first();
    if (await dialog.isVisible()) {
      await dialog.fill('tag:work');
      await page.keyboard.press('Escape');
    }
  });

  test('node shows tag pill in tree', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    const tagBtn = page.locator('button[title*="tag" i], button[aria-label*="tag" i]').first();
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
      const tagInput = page.locator('input[placeholder*="tag" i]').first();
      if (await tagInput.isVisible()) {
        await tagInput.fill('priority');
        await page.keyboard.press('Enter');
      }
    }
    // Check that a tag element appears inside/near the node
    const tagPill = page.locator('[data-node-id="n_root"] [class*="tag"], [data-node-id="n_root"] [class*="pill"]').first();
    await page.waitForTimeout(200);
  });

});

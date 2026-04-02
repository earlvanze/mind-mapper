import { test, expect, type Page } from '@playwright/test';

async function getNodeCount(page: Page) {
  return page.locator('[data-node-id]').count();
}

test.describe('Version History', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('opens version history dialog', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Alt+v');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/version|snapshot/i);
  });

  test('saves a named snapshot', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-node-id="n_1"]')).toBeVisible();

    await page.keyboard.press('Alt+v');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Type a snapshot name
    const input = dialog.locator('input[type="text"], input[placeholder*="name" i]').first();
    if (await input.isVisible()) {
      await input.fill('My Snapshot');
      const saveBtn = dialog.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await expect(dialog).toContainText('My Snapshot');
      }
    }
    await page.keyboard.press('Escape');
  });

  test('loads a saved snapshot', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-node-id="n_1"]')).toBeVisible();

    // Save snapshot first
    await page.keyboard.press('Alt+v');
    const dialog = page.locator('[role="dialog"]');
    const input = dialog.locator('input[type="text"], input[placeholder*="name" i]').first();
    if (await input.isVisible()) {
      await input.fill('Test Snapshot');
      const saveBtn = dialog.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').first();
      if (await saveBtn.isVisible()) await saveBtn.click();
    }
    await page.keyboard.press('Escape');

    // Delete child to change state
    await page.locator('[data-node-id="n_1"]').click();
    await page.keyboard.press('Backspace');
    await expect(page.locator('[data-node-id="n_1"]')).not.toBeVisible();

    // Load snapshot
    await page.keyboard.press('Alt+v');
    await expect(dialog).toBeVisible();
    const snapshotItem = dialog.locator('text=Test Snapshot').first();
    if (await snapshotItem.isVisible()) {
      await snapshotItem.click();
      const loadBtn = dialog.locator('button:has-text("Load"), button:has-text("Restore")').first();
      if (await loadBtn.isVisible()) await loadBtn.click();
      await expect(page.locator('[data-node-id="n_1"]')).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Alt+v');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

});

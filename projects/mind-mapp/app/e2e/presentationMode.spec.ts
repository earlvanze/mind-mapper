import { test, expect, type Page } from '@playwright/test';

test.describe('Presentation Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Build a small tree: root > child1, child2
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    const n1 = page.locator('[data-node-id="n_1"]');
    await n1.click();
    await page.keyboard.press('Tab');
    const n2 = page.locator('[data-node-id="n_2"]');
    await n2.click();
  });

  test('opens presentation mode with P key', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('p');
    const presentation = page.locator('[data-presentation]');
    await expect(presentation).toBeVisible();
  });

  test('exits presentation mode with Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('p');
    const presentation = page.locator('[data-presentation]');
    await expect(presentation).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(presentation).not.toBeVisible();
  });

  test('navigates forward with ArrowRight', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('p');
    const presentation = page.locator('[data-presentation]');
    await expect(presentation).toBeVisible();
    await page.keyboard.press('ArrowRight');
    // Should advance without error
  });

  test('navigates backward with ArrowLeft', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('p');
    const presentation = page.locator('[data-presentation]');
    await expect(presentation).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    // Should go back without error
  });

});

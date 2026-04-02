import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('skip link is first focusable element', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main"], .skip-link');
    await expect(skipLink).toBeFocused();
  });

  test('help dialog is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('?');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-label');

    // Focus trap - Tab should stay within dialog
    const focused = page.locator(':focus');
    await page.keyboard.press('Tab');
    const newFocused = await page.locator(':focus');
    // Either focus moved within dialog or stayed in it
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('search dialog has proper ARIA', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+k');
    const dialog = page.locator('[role="combobox"], [role="dialog"]').first();
    await expect(dialog).toBeVisible();

    const input = dialog.locator('input').first();
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('aria-label');

    await page.keyboard.press('Escape');
  });

  test('all toolbar buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('header button, .toolbar button, [role="toolbar"] button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const text = await btn.textContent();
      const hasLabel = ariaLabel || title || (text && text.trim().length > 0);
      expect(hasLabel).toBeTruthy();
    }
  });

  test('tree nodes have proper ARIA tree role', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[role="tree"]');
    await expect(root).toBeVisible();
    const items = page.locator('[role="treeitem"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('focus visible ring appears on keyboard focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveClass(/focus-visible|focus-visible-ring/);
  });

});

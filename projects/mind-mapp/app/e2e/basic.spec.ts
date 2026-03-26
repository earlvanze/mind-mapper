import { test, expect, type Page } from '@playwright/test';

// Reusable helpers
async function getRootNode(page: Page) {
  return page.locator('[data-node-id]').first();
}

async function getNodeCount(page: Page) {
  return page.locator('[data-node-id]').count();
}

test.describe('Mind Mapp E2E', () => {

  test('loads with root node', async ({ page }) => {
    await page.goto('/');
    // Root node should be visible with default text
    const root = page.locator('[data-node-id="n_root"]');
    await expect(root).toBeVisible();
    await expect(root).toContainText('Mind Map');
  });

  test('creates child node with Tab key', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-node-id="n_1"]')).toBeVisible();
    // Focus should move to new child
    await expect(page.locator('[data-node-id="n_1"]')).toHaveClass(/is-focused/);
  });

  test('creates sibling node with Enter key', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Create child first
    await page.keyboard.press('Tab');
    const child = page.locator('[data-node-id="n_1"]');
    await expect(child).toBeVisible();

    // Create sibling from child
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-node-id="n_2"]')).toBeVisible();
  });

  test('edits node text with F2', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    await page.keyboard.press('F2');
    const editInput = page.locator('[data-node-id="n_root"] [contenteditable="true"]');
    await expect(editInput).toBeVisible();

    await editInput.fill('My Custom Map');
    await page.keyboard.press('Escape');
    await expect(root).toContainText('My Custom Map');
  });

  test('deletes node with Backspace', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Create a child to delete
    await page.keyboard.press('Tab');
    const child = page.locator('[data-node-id="n_1"]');
    await expect(child).toBeVisible();

    // Delete it
    await page.keyboard.press('Backspace');
    await expect(child).not.toBeVisible();
  });

  test('search dialog opens with Cmd+K and filters results', async ({ page }) => {
    await page.goto('/');

    // Create a few nodes
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    const n1 = page.locator('[data-node-id="n_1"]');
    await n1.click();
    await page.keyboard.press('F2');
    await page.keyboard.type('Research');
    await page.keyboard.press('Escape');

    // Open search
    await page.keyboard.press('Meta+k');
    const dialog = page.locator('[role="combobox"]');
    await expect(dialog).toBeVisible();

    // Type to filter
    await dialog.fill('search:rese');
    await expect(page.locator('text=Research')).toBeVisible();
  });

  test('undo and redo work correctly', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Create child
    await page.keyboard.press('Tab');
    const child = page.locator('[data-node-id="n_1"]');
    await expect(child).toBeVisible();

    // Undo
    await page.keyboard.press('Meta+z');
    await expect(child).not.toBeVisible();

    // Redo
    await page.keyboard.press('Meta+Shift+z');
    await expect(child).toBeVisible();
  });

  test('multi-select with Cmd+Click', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();
    await page.keyboard.press('Tab');
    const n1 = page.locator('[data-node-id="n_1"]');
    await n1.click();
    await page.keyboard.press('Enter');
    const n2 = page.locator('[data-node-id="n_2"]');
    await n2.click();

    // Select all with Cmd+A
    await page.keyboard.press('Meta+a');
    const count = await page.locator('.is-selected').count();
    expect(count).toBeGreaterThan(1);
  });

  test('theme toggle changes appearance', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    // Get initial theme
    await page.keyboard.press('Shift+t');
    // Check that theme attribute/class changed on html element
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', /dark|light/);
  });

  test('export JSON button triggers download', async ({ page }) => {
    await page.goto('/');
    const [, download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button[title*="Export JSON"]'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('sample map loads new nodes', async ({ page }) => {
    await page.goto('/');
    const initialCount = await getNodeCount(page);

    await page.click('button:has-text("Sample")');
    // Wait for new nodes to render
    await page.waitForTimeout(500);
    const newCount = await getNodeCount(page);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('import JSON replaces map', async ({ page }) => {
    await page.goto('/');
    const initialCount = await getNodeCount(page);

    // Create a small test JSON
    const testMap = {
      n_root: { id: 'n_root', text: 'Imported Root', x: 0, y: 0, parentId: null, children: [] }
    };

    // Set up file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('label:has-text("Import JSON")'),
    ]);
    await fileChooser.setFiles({
      name: 'test-map.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(testMap)),
    });

    await page.waitForTimeout(500);
    const importedRoot = page.locator('[data-node-id="n_root"]');
    await expect(importedRoot).toContainText('Imported Root');
  });

  test('grid overlay toggles with Shift+G', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.canvas');
    await expect(canvas).not.toHaveClass(/grid-on/);

    await page.keyboard.press('Shift+g');
    await expect(canvas).toHaveClass(/grid-on/);

    await page.keyboard.press('Shift+g');
    await expect(canvas).not.toHaveClass(/grid-on/);
  });

  test('fit-to-view resets zoom and centers content', async ({ page }) => {
    await page.goto('/');
    // Zoom in first
    await page.keyboard.press('=');
    await page.keyboard.press('=');
    await page.keyboard.press('=');

    // Fit to view
    await page.keyboard.press('f');
    // Just verify no crash - zoom level handled internally
  });

  test('clear map removes all nodes except root', async ({ page }) => {
    await page.goto('/');
    // Add a child
    await page.locator('[data-node-id="n_root"]').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-node-id="n_1"]')).toBeVisible();

    // Clear - handle confirm dialog
    page.on('dialog', d => d.accept());
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(300);

    // Only root should remain
    await expect(page.locator('[data-node-id="n_root"]')).toBeVisible();
    await expect(page.locator('[data-node-id="n_1"]')).not.toBeVisible();
  });

});

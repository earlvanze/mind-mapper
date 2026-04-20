const { test, expect } = require('@playwright/test');

test.describe('Mind Mapp', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`file://${process.cwd()}/index.html`);
    });

    test('loads without errors', async ({ page }) => {
        await expect(page.locator('#toolbar')).toBeVisible();
        await expect(page.locator('#addNode')).toBeVisible();
    });

    test('can add a node', async ({ page }) => {
        await page.click('#addNode');
        await expect(page.locator('.node')).toBeVisible();
        await expect(page.locator('#node-editor')).toBeVisible();
    });

    test('can edit node text', async ({ page }) => {
        await page.click('#addNode');
        await page.fill('#node-text', 'Test Node');
        await page.click('#save-text');
        const node = page.locator('.node');
        await expect(node).toHaveText('Test Node');
    });

    test('can add child node', async ({ page }) => {
        await page.click('#addNode');
        await page.fill('#node-text', 'Parent');
        await page.click('#save-text');
        await page.click('.node');
        await page.click('#addChild');
        await expect(page.locator('.node')).toHaveCount(2);
    });

    test('zoom controls work', async ({ page }) => {
        // Initial state is 100%
        await expect(page.locator('#zoom-level')).toHaveText('100%');
        
        // Zoom in should increase
        await page.click('#zoomIn');
        const zoomInText = await page.locator('#zoom-level').textContent();
        expect(parseInt(zoomInText)).toBeGreaterThan(100);
        
        // Zoom out should decrease
        await page.click('#zoomOut');
        const zoomOutText = await page.locator('#zoom-level').textContent();
        expect(parseInt(zoomOutText)).toBeLessThan(parseInt(zoomInText));
    });

    test('reset view works', async ({ page }) => {
        await page.click('#zoomIn');
        await page.click('#zoomIn');
        await page.click('#zoomReset');
        await expect(page.locator('#zoom-level')).toHaveText('100%');
    });
});

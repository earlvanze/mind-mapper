const { test, expect } = require('@playwright/test');

test.describe('Mind Mapp', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`file://${process.cwd()}/index.html`);
    });

    test('loads without errors', async ({ page }) => {
        await expect(page.locator('#toolbar')).toBeVisible();
        await expect(page.locator('#addNode')).toBeVisible();
        await expect(page.locator('#style-toolbar')).toBeVisible();
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
        await expect(page.locator('#zoom-level')).toHaveText('100%');
        
        await page.click('#zoomIn');
        const zoomInText = await page.locator('#zoom-level').textContent();
        expect(parseInt(zoomInText)).toBeGreaterThan(100);
        
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

    test('can apply color to node', async ({ page }) => {
        await page.click('#addNode');
        await page.click('#save-text');
        await page.click('.node');
        
        // Click green color preset
        await page.click('.color-preset[data-color="#5cb85c"]');
        
        // Verify node has green class
        await expect(page.locator('.node.color-green')).toBeVisible();
    });

    test('can apply style to node', async ({ page }) => {
        await page.click('#addNode');
        await page.click('#save-text');
        await page.click('.node');
        
        // Click outline style button
        await page.click('.style-btn[data-style="outline"]');
        
        // Verify node has outline style
        await expect(page.locator('.node.style-outline')).toBeVisible();
    });

    test('colors persist on save/load', async ({ page }) => {
        await page.click('#addNode');
        await page.click('#save-text');
        await page.click('.node');
        await page.click('.color-preset[data-color="#ff6b6b"]');
        
        // Save and reload
        await page.click('#save');
        await page.click('#load');
        
        // Node should still be red
        await expect(page.locator('.node.color-red')).toBeVisible();
    });

    test('export PNG button exists', async ({ page }) => {
        await expect(page.locator('#exportPNG')).toBeVisible();
        await expect(page.locator('#exportPNG')).toHaveText('PNG');
    });

    test('export JSON button exists', async ({ page }) => {
        await expect(page.locator('#exportJSON')).toBeVisible();
        await expect(page.locator('#exportJSON')).toHaveText('JSON');
    });

    test('export JSON shows alert when no nodes', async ({ page }) => {
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Nothing to export');
            await dialog.accept();
        });
        await page.click('#exportJSON');
    });

    test('export PNG shows alert when no nodes', async ({ page }) => {
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Nothing to export');
            await dialog.accept();
        });
        await page.click('#exportPNG');
    });
});

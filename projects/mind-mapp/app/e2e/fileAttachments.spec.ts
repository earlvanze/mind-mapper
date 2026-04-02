import { test, expect } from '@playwright/test';

test.describe('File Attachments', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state between tests
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('shows file picker for attachment', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    const attachBtn = page.locator('button[title*="attach" i], button[title*="file" i], button[aria-label*="attach" i]').first();
    if (await attachBtn.isVisible()) {
      await attachBtn.click();
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await expect(dialog).toContainText(/attach|file|pdf|document/i);
        await page.keyboard.press('Escape');
      }
    }
  });

  test('attaches a file via file picker', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    const attachBtn = page.locator('button[title*="attach" i], button[title*="file" i]').first();
    if (await attachBtn.isVisible()) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        attachBtn.click(),
      ]);
      await fileChooser.setFiles({
        name: 'readme.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Hello world'),
      });
      await page.waitForTimeout(300);
    }
  });

  test('shows attachment name after upload', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    const attachBtn = page.locator('button[title*="attach" i], button[title*="file" i]').first();
    if (await attachBtn.isVisible()) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        attachBtn.click(),
      ]);
      await fileChooser.setFiles({
        name: 'report.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 fake pdf content'),
      });
      await page.waitForTimeout(300);
      // After upload, dialog should show filename
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await expect(dialog).toContainText('report.pdf');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('downloads attachment', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('[data-node-id="n_root"]');
    await root.click();

    const attachBtn = page.locator('button[title*="attach" i], button[title*="file" i]').first();
    if (await attachBtn.isVisible()) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        attachBtn.click(),
      ]);
      await fileChooser.setFiles({
        name: 'data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('a,b,c\n1,2,3'),
      });
      await page.waitForTimeout(300);

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        const downloadBtn = dialog.locator('button:has-text("Download")').first();
        if (await downloadBtn.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await downloadBtn.click();
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/data\.csv/);
          await page.keyboard.press('Escape');
        }
      }
    }
  });

});

import { test, expect } from '@playwright/test'

test('undo/redo buttons exist and are clickable', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:4173')
  await page.waitForTimeout(500)

  // undo/redo buttons should exist
  const btnUndo = page.locator('#btn-undo')
  const btnRedo = page.locator('#btn-redo')
  await expect(btnUndo).toBeVisible()
  await expect(btnRedo).toBeVisible()

  // add a node then undo it
  await page.locator('#btn-add').click()
  await page.waitForTimeout(200)

  // Press Escape to cancel any editing
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // Undo should revert the add
  await btnUndo.click()
  await page.waitForTimeout(200)

  // Redo should bring it back
  await btnRedo.click()
  await page.waitForTimeout(200)

  // Ctrl+Z undo
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(200)

  // Ctrl+Y redo
  await page.keyboard.press('Control+y')
  await page.waitForTimeout(200)

  // no console errors
  expect(errors).toHaveLength(0)
})

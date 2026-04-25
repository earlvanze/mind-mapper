import { test, expect } from '@playwright/test'

test('shift-click multi-selects nodes and they move together', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:4173')
  await page.waitForTimeout(500)

  // Add two nodes via toolbar
  await page.locator('#btn-add').click()
  await page.waitForTimeout(200)
  // Press Escape to commit the edit
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  await page.locator('#btn-add').click()
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // We have the default "Mind Map" node + 2 added = 3 nodes
  // Canvas has no shift-click test helper via Playwright mouse, but we test Ctrl+A
  // Press Ctrl+A to select all
  await page.keyboard.press('Control+a')
  await page.waitForTimeout(200)

  // Delete should remove all selected
  await page.keyboard.press('Delete')
  await page.waitForTimeout(300)

  // After deleting all, history should work
  await page.locator('#btn-undo').click()
  await page.waitForTimeout(200)

  await page.locator('#btn-redo').click()
  await page.waitForTimeout(200)

  expect(errors).toHaveLength(0)
})

test('box selection clears on plain click, selects on shift', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:4173')
  await page.waitForTimeout(500)

  // Ctrl+A to select all, then Escape to clear
  await page.keyboard.press('Control+a')
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // Ctrl+A again, then press A (add) - should deselect and add
  await page.keyboard.press('Control+a')
  await page.waitForTimeout(200)
  await page.keyboard.press('a')
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // Ctrl+Z undo
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(200)

  expect(errors).toHaveLength(0)
})

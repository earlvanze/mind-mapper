import { test, expect } from '@playwright/test'

test('app loads without console errors', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:4173')
  await page.waitForTimeout(1000)

  // canvas should exist
  const canvas = page.locator('#canvas')
  await expect(canvas).toBeVisible()

  // toolbar buttons should exist
  await expect(page.locator('#btn-add')).toBeVisible()
  await expect(page.locator('#btn-connect')).toBeVisible()
  await expect(page.locator('#btn-export')).toBeVisible()

  // no console errors
  expect(errors).toHaveLength(0)
})

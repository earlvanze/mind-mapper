import { test, expect } from '@playwright/test'

test('app loads without console errors', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/')
  await page.waitForTimeout(1000)

  // canvas should exist
  const canvas = page.locator('#canvas')
  await expect(canvas).toBeVisible()

  // toolbar buttons should exist
  await expect(page.locator('#btn-add')).toBeVisible()
  await expect(page.locator('#btn-connect')).toBeVisible()
  await expect(page.locator('#btn-export')).toBeVisible()
  await expect(page.locator('#btn-fit')).toBeVisible()

  // no console errors
  expect(errors).toHaveLength(0)
})


test('canvas redraws after browser resize', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(100)

  await page.setViewportSize({ width: 900, height: 650 })
  await page.waitForTimeout(100)

  const paintedPixels = await page.locator('#canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d')
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let count = 0
    for (let i = 3; i < image.length; i += 4) {
      if (image[i] !== 0) count++
    }
    return count
  })

  expect(paintedPixels).toBeGreaterThan(100)
})

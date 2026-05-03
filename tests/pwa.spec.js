import { test, expect } from '@playwright/test'

test('app exposes installable PWA metadata and offline shell worker', async ({ page, baseURL }) => {
  await page.goto('/')

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestHref).toBe('./manifest.webmanifest')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#aa3bff')

  const manifest = await page.request.get(`${baseURL}/manifest.webmanifest`).then(res => res.json())
  expect(manifest.name).toBe('Mind Mapp')
  expect(manifest.display).toBe('standalone')
  expect(manifest.start_url).toBe('./')
  expect(manifest.icons[0].purpose).toContain('maskable')

  const sw = await page.request.get(`${baseURL}/sw.js`)
  expect(sw.ok()).toBeTruthy()
  await page.evaluate(() => navigator.serviceWorker.register(new URL('sw.js', window.location.href)))
  await expect.poll(async () => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()))).toBeTruthy()
})

test('repeated wheel zoom remains finite and clamped for tablet trackpads', async ({ page }) => {
  await page.goto('/')
  await page.locator('#canvas').evaluate(canvas => {
    for (let i = 0; i < 120; i++) {
      canvas.dispatchEvent(new WheelEvent('wheel', {
        clientX: 500,
        clientY: 400,
        deltaY: -400,
        bubbles: true,
        cancelable: true,
      }))
    }
    for (let i = 0; i < 140; i++) {
      canvas.dispatchEvent(new WheelEvent('wheel', {
        clientX: 500,
        clientY: 400,
        deltaY: 600,
        bubbles: true,
        cancelable: true,
      }))
    }
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(Number.isFinite(saved.view.x)).toBeTruthy()
  expect(Number.isFinite(saved.view.y)).toBeTruthy()
  expect(saved.view.scale).toBeGreaterThanOrEqual(0.1)
  expect(saved.view.scale).toBeLessThanOrEqual(5)
})


test('mobile PWA toolbar stays compact and leaves room for the canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toolbarBox = await page.locator('.toolbar').boundingBox()
  const canvasBox = await page.locator('#canvas').boundingBox()
  expect(toolbarBox.height).toBeLessThanOrEqual(72)
  expect(canvasBox.height).toBeGreaterThan(700)
})

import { test, expect } from '@playwright/test'

const farNodeMap = {
  nodes: [{ id: 1, x: 1000, y: 500, text: 'Far node', width: 80, height: 40 }],
  edges: [],
  lastId: 1,
  lastEdgeId: 0,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(map => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify(map))
  }, farNodeMap)
})

test('minimap renders far-away content inside its overview', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(100)

  const nonBackgroundPixels = await page.locator('#minimap').evaluate(canvas => {
    const ctx = canvas.getContext('2d')
    const image = ctx.getImageData(40, 30, 100, 60).data
    let count = 0
    for (let i = 0; i < image.length; i += 4) {
      const [r, g, b] = [image[i], image[i + 1], image[i + 2]]
      if (r !== 248 || g !== 247 || b !== 244) count++
    }
    return count
  })

  expect(nonBackgroundPixels).toBeGreaterThan(500)
})

test('clicking a minimap node recenters the main canvas on that node', async ({ page }) => {
  await page.goto('/')
  await page.locator('#minimap').click({ position: { x: 90, y: 60 } })

  const canvas = page.locator('#canvas')
  const box = await canvas.boundingBox()
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await page.keyboard.press('Delete')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes).toHaveLength(0)
})

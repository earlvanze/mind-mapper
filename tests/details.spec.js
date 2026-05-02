import { test, expect } from '@playwright/test'

test('clicking a node opens details where text and drawing persist', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 120, y: 120, text: 'Topic', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })
  await page.goto('/')

  await expect(page.locator('#details-panel')).toHaveClass(/hidden/)
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await expect(page.locator('#details-panel')).not.toHaveClass(/hidden/)
  await expect(page.locator('#details-title')).toHaveText('Topic')

  await page.locator('#details-text').fill('Important context for this node')
  await page.locator('#details-text').blur()

  const drawing = page.locator('#details-drawing')
  const box = await drawing.boundingBox()
  await page.mouse.move(box.x + 30, box.y + 30)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 90, { steps: 5 })
  await page.mouse.up()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes[0].details.text).toBe('Important context for this node')
  expect(saved.nodes[0].details.drawing).toMatch(/^data:image\/png;base64,/)
})

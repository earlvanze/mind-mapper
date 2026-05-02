import { test, expect } from '@playwright/test'

test('node description persists while typing without requiring blur', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 120, y: 120, text: 'Topic', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })
  await page.reload()
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await page.locator('#details-text').fill('Autosaved description')

  await expect.poll(async () => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.nodes[0].details?.text
  })).toBe('Autosaved description')

  await page.reload()
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await expect(page.locator('#details-text')).toHaveValue('Autosaved description')
})

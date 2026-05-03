import { test, expect } from '@playwright/test'

function seedLinkedNotebook(page) {
  return page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      version: 2,
      notebook: {
        activePageId: 1,
        lastPageId: 2,
        pages: [
          {
            id: 1,
            title: 'Page 1',
            nodes: [{ id: 1, x: 120, y: 120, text: 'Portal Node', width: 120, height: 44, details: { text: '', drawing: null, strokes: [] } }],
            edges: [],
            lastId: 1,
            lastEdgeId: 0,
            edgeLabels: {},
            view: { x: 0, y: 0, scale: 1 },
          },
          {
            id: 2,
            title: 'Page 2',
            nodes: [{ id: 1, x: 180, y: 160, text: 'Target Page', width: 120, height: 44, details: { text: '', drawing: null, strokes: [] } }],
            edges: [],
            lastId: 1,
            lastEdgeId: 0,
            edgeLabels: {},
            view: { x: 20, y: 30, scale: 1.1 },
          },
        ],
      },
    }))
  })
}

test('nodes can link to another notebook page and open it with zoom navigation', async ({ page }) => {
  await seedLinkedNotebook(page)
  await page.goto('/')
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await expect(page.locator('#details-panel')).toBeVisible()
  await page.locator('#details-page-link').selectOption({ label: 'Page 2' })

  const savedLink = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    const page1 = saved.notebook.pages.find(p => p.title === 'Page 1')
    return page1.nodes[0].details.linkedPageId
  })
  expect(savedLink).toBe(2)

  await page.locator('#btn-open-linked-page').click()
  await expect(page.locator('#page-select')).toHaveValue('2', { timeout: 2500 })
})

test('linked nodes persist page link metadata', async ({ page }) => {
  await seedLinkedNotebook(page)
  await page.goto('/')
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await page.locator('#details-page-link').selectOption({ label: 'Page 2' })

  const hasLinkedNode = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.some(p => p.nodes.some(n => n.details?.linkedPageId === 2))
  })
  expect(hasLinkedNode).toBe(true)
})

import { test, expect } from '@playwright/test'

async function seedLaunchPlan(page) {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Launch Plan', width: 150, height: 44, details: { text: '', drawing: null, strokes: [] } },
        { id: 2, x: 300, y: 80, text: 'Build onboarding flow', width: 190, height: 44, details: { text: 'active product implementation', drawing: null, strokes: [] } },
        { id: 3, x: 300, y: 150, text: 'Blocked payment setup', width: 190, height: 44, details: { text: 'waiting on finance account approval', drawing: null, strokes: [] } },
        { id: 4, x: 300, y: 220, text: 'Marketing copy done', width: 180, height: 44, details: { text: 'completed product copy', drawing: null, strokes: [] } },
      ],
      edges: [{ id: 1, from: 1, to: 2 }, { id: 2, from: 1, to: 3 }, { id: 3, from: 1, to: 4 }],
      lastId: 4,
      lastEdgeId: 3,
      edgeLabels: {},
    }))
  })
}

test('Colorful applies intelligent concept coloring without restructuring the current map', async ({ page }) => {
  await seedLaunchPlan(page)
  await page.route('**/api/organize-mind-map', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'Colored: Launch Plan',
      provider: 'sage-router:test',
      nodes: [
        { sourceId: 1, concept: 'product', order: 0 },
        { sourceId: 2, concept: 'product', status: 'active', order: 1 },
        { sourceId: 3, concept: 'finance', status: 'blocked', order: 2 },
        { sourceId: 4, concept: 'product', status: 'done', order: 3 },
      ],
    }),
  }))
  await page.goto('/')
  await page.locator('#btn-colorful').click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.map(n => n.text)).toEqual(['Launch Plan', 'Build onboarding flow', 'Blocked payment setup', 'Marketing copy done'])
  expect(saved.edges.length).toBe(3)
  expect(saved.nodes.find(n => n.id === 3).organizedConcept).toBe('finance')
})

test('Organize can restructure an arbitrary map into a new radial mind-map page', async ({ page }) => {
  await seedLaunchPlan(page)
  await page.route('**/api/organize-mind-map', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'Organized: Launch Plan',
      provider: 'sage-router:test',
      nodes: [
        { id: 'root', sourceId: 1, title: 'Launch Plan', parentId: null, concept: 'product', order: 0 },
        { id: 'product', sourceId: 2, title: 'Product Work', parentId: 'root', concept: 'product', order: 1 },
        { id: 'finance', sourceId: 3, title: 'Finance Blockers', parentId: 'root', concept: 'finance', status: 'blocked', order: 2 },
      ],
    }),
  }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('Organized: Launch Plan')
  const organized = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Organized: Launch Plan')
  })
  expect(organized.organizedMindMapMode).toBe('restructure-layout-and-structure')
  expect(organized.nodes.map(n => n.text)).toEqual(expect.arrayContaining(['Launch Plan', 'Product Work', 'Finance Blockers']))
  expect(organized.edges.length).toBe(2)
})

test('Organize falls back locally when API is unavailable', async ({ page }) => {
  await seedLaunchPlan(page)
  await page.route('**/api/organize-mind-map', route => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('Organized: Launch Plan')
  const organized = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Organized: Launch Plan')
  })
  expect(organized.nodes.length).toBe(4)
  expect(organized.edges.length).toBe(3)
})

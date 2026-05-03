import { test, expect } from '@playwright/test'

test('Organize creates a concept-colored mind map locally when API is unavailable', async ({ page }) => {
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
  await page.route('**/api/organize-mind-map', route => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('Organized: Launch Plan')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const organized = saved.notebook.pages.find(p => p.title === 'Organized: Launch Plan')
  expect(organized).toBeTruthy()
  expect(organized.organizedMindMapVersion).toBe(2)
  expect(organized.organizedMindMapMode).toBe('preserve-layout-and-structure')
  const nodeTexts = organized.nodes.map(n => n.text)
  expect(nodeTexts).toEqual(['Launch Plan', 'Build onboarding flow', 'Blocked payment setup', 'Marketing copy done'])
  expect(organized.edges.length).toBe(3)
  const fills = new Set(organized.nodes.map(n => n.style?.fill).filter(Boolean))
  expect(fills.size).toBeGreaterThan(1)
})

test('Organize consumes deterministic OpenAI-compatible mind-map structure responses', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 100, y: 100, text: 'Messy Ideas', width: 150, height: 44, details: { text: '', drawing: null, strokes: [] } }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })
  await page.route('**/api/organize-mind-map', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'Organized: Messy Ideas',
      provider: 'sage-router:test',
      nodes: [
        { sourceId: 1, concept: 'infra', status: 'active', order: 0 },
        { sourceId: 999, concept: 'hallucinated', order: 1 },
      ],
    }),
  }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  const organized = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Organized: Messy Ideas')
  })
  expect(organized.organizedMindMapProvider).toBe('sage-router:test')
  expect(organized.nodes.map(n => n.text)).toEqual(['Messy Ideas'])
  expect(organized.nodes[0].organizedConcept).toBe('infra')
  expect(organized.edges.length).toBe(0)
})

import { test, expect } from '@playwright/test'

test('AI Kanban organizes arbitrary mind map nodes into status columns locally when API is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Launch Plan', width: 150, height: 44, details: { text: '', drawing: null, strokes: [] } },
        { id: 2, x: 300, y: 80, text: 'Build onboarding flow', width: 190, height: 44, details: { text: 'active implementation', drawing: null, strokes: [] } },
        { id: 3, x: 300, y: 150, text: 'Blocked payment setup', width: 190, height: 44, details: { text: 'waiting on account approval', drawing: null, strokes: [] } },
        { id: 4, x: 300, y: 220, text: 'Marketing copy done', width: 180, height: 44, details: { text: 'completed', drawing: null, strokes: [] } },
      ],
      edges: [{ id: 1, from: 1, to: 2 }, { id: 2, from: 1, to: 3 }, { id: 3, from: 1, to: 4 }],
      lastId: 4,
      lastEdgeId: 3,
      edgeLabels: {},
    }))
  })
  await page.route('**/api/organize-kanban', route => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('AI Kanban: Launch Plan')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const pageTitles = saved.notebook.pages.map(p => p.title)
  expect(pageTitles).toContain('AI Kanban: Launch Plan')
  const aiPage = saved.notebook.pages.find(p => p.title === 'AI Kanban: Launch Plan')
  const nodeTexts = aiPage.nodes.map(n => n.text)
  expect(nodeTexts).toContain('In Progress')
  expect(nodeTexts).toContain('Blocked / Risk')
  expect(nodeTexts).toContain('Done')
})

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

test('Organize uses deterministic local structure by default', async ({ page }) => {
  await seedLaunchPlan(page)
  let apiCalls = 0
  await page.route('**/api/organize-mind-map', route => {
    apiCalls += 1
    return route.fulfill({ status: 500, body: 'should not be called for default organize' })
  })
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('Organized: Launch Plan')
  const organized = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Organized: Launch Plan')
  })
  expect(apiCalls).toBe(0)
  expect(organized.organizedMindMapProvider).toBe('local heuristic')
  expect(organized.organizedMindMapMode).toBe('restructure-layout-and-structure')
  expect(organized.nodes.map(n => n.text)).toEqual(expect.arrayContaining([
    'Launch Plan',
    'Build onboarding flow',
    'Blocked payment setup',
    'Marketing copy done',
  ]))
  expect(organized.edges.length).toBe(3)
  const root = organized.nodes.find(n => n.text === 'Launch Plan')
  const childCenters = organized.nodes.filter(n => n.organizedDepth === 1).map(n => ({
    x: n.x + n.width / 2,
    y: n.y + n.height / 2,
  }))
  expect(childCenters.some(center => center.y < root.y)).toBe(true)
  expect(childCenters.some(center => center.y > root.y + root.height)).toBe(true)
  expect(childCenters.some(center => center.x < root.x)).toBe(true)
})

test('Organize stays local when API is unavailable', async ({ page }) => {
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

test('Templates can generate AI-driven layout pages such as knowledge graphs', async ({ page }) => {
  await seedLaunchPlan(page)
  let requestBody = null
  await page.route('**/api/organize-mind-map', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Knowledge Graph: Launch Plan',
        provider: 'sage-router:test',
        nodes: [
          { id: 'root', sourceId: 1, title: 'Launch Plan', parentId: null, concept: 'knowledge', order: 0 },
          { id: 'entity', sourceId: 2, title: 'Onboarding Entity', parentId: 'root', concept: 'entity', order: 1 },
        ],
      }),
    })
  })
  await page.goto('/')
  await page.locator('#btn-templates').click()
  await page.locator('[data-layout-template-id="knowledge-graph"]').click()
  await page.locator('#btn-template-apply-layout').click()
  await expect(page.locator('#page-select')).toContainText('Knowledge Graph: Launch Plan')
  expect(requestBody.mode).toBe('organize')
  expect(requestBody.template.id).toBe('knowledge-graph')
})

test('Template-generated layouts place dense AI trees without overlapping nodes', async ({ page }) => {
  await seedLaunchPlan(page)
  await page.route('**/api/organize-mind-map', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'Organized: Dense Plan',
      provider: 'sage-router:test',
      nodes: [
        { id: 'root', title: 'Dense Plan', parentId: null, concept: 'project', order: 0 },
        ...Array.from({ length: 18 }, (_, index) => ({
          id: `child-${index}`,
          title: `Readable Branch ${index + 1}`,
          parentId: 'root',
          concept: index % 2 ? 'concept' : 'kanban',
          order: index + 1,
        })),
      ],
    }),
  }))
  await page.goto('/')
  await page.locator('#btn-templates').click()
  await page.locator('[data-layout-template-id="knowledge-graph"]').click()
  await page.locator('#btn-template-apply-layout').click()
  await expect.poll(async () => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return Boolean(saved.notebook.pages.find(p => p.title === 'Organized: Dense Plan')?.nodes?.length)
  })).toBeTruthy()
  const nodes = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Organized: Dense Plan').nodes
  })
  const pad = 12
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]
      const b = nodes[j]
      const overlaps = a.x - pad < b.x + b.width && a.x + a.width + pad > b.x && a.y - pad < b.y + b.height && a.y + a.height + pad > b.y
      expect(overlaps, `${a.text} overlaps ${b.text}`).toBe(false)
    }
  }
})

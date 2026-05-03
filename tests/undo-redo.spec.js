import { test, expect } from '@playwright/test'

test('undo/redo buttons exist and are clickable', async ({ page }) => {
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/')
  await page.waitForTimeout(500)

  // undo/redo buttons should exist
  const btnUndo = page.locator('#btn-undo')
  const btnRedo = page.locator('#btn-redo')
  await expect(btnUndo).toBeVisible()
  await expect(btnRedo).toBeVisible()

  // add a node then undo it
  await page.locator('#btn-add').click()
  await page.waitForTimeout(200)

  // Press Escape to cancel any editing
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // Undo should revert the add
  await btnUndo.click()
  await page.waitForTimeout(200)

  // Redo should bring it back
  await btnRedo.click()
  await page.waitForTimeout(200)

  // Ctrl+Z undo
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(200)

  // Ctrl+Y redo
  await page.keyboard.press('Control+y')
  await page.waitForTimeout(200)

  // no console errors
  expect(errors).toHaveLength(0)
})

test('undo and redo include AI colorful changes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Product root', width: 150, height: 44, style: { fill: '#ffffff', stroke: '#111111', text: '#111111', accent: '#111111', shadow: '#111111' }, details: { text: '', drawing: null, strokes: [] } },
        { id: 2, x: 300, y: 100, text: 'Finance task', width: 150, height: 44, style: { fill: '#ffffff', stroke: '#111111', text: '#111111', accent: '#111111', shadow: '#111111' }, details: { text: '', drawing: null, strokes: [] } },
      ],
      edges: [{ id: 1, from: 1, to: 2 }],
      lastId: 2,
      lastEdgeId: 1,
      edgeLabels: {},
    }))
  })
  await page.route('**/api/organize-mind-map', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ nodes: [{ sourceId: 1, concept: 'product' }, { sourceId: 2, concept: 'finance' }] }),
  }))
  await page.goto('/')
  await page.locator('#btn-colorful').click()
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')).nodes[1].style.fill)).toBe('#bbf7d0')

  await page.locator('#btn-undo').click()
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')).nodes[1].style.fill)).toBe('#ffffff')

  await page.locator('#btn-redo').click()
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')).nodes[1].style.fill)).toBe('#bbf7d0')
})

test('undo and redo include organize page creation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 100, y: 100, text: 'Messy root', width: 150, height: 44, details: { text: '', drawing: null, strokes: [] } }],
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
      title: 'Organized: Messy root',
      provider: 'sage-router:test',
      nodes: [
        { id: 'root', sourceId: 1, title: 'Messy root', parentId: null, concept: 'product', order: 0 },
        { id: 'child', title: 'Clean branch', parentId: 'root', concept: 'infra', order: 1 },
      ],
    }),
  }))
  await page.goto('/')
  await page.locator('#btn-ai-kanban').click()
  await expect(page.locator('#page-select')).toContainText('Organized: Messy root')

  await page.locator('#btn-undo').click()
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')).notebook.pages.length)).toBe(1)
  await expect(page.locator('#page-select')).not.toContainText('Organized: Messy root')

  await page.locator('#btn-redo').click()
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')).notebook.pages.length)).toBe(2)
  await expect(page.locator('#page-select')).toContainText('Organized: Messy root')
})

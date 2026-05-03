import { test, expect } from '@playwright/test'

test('recognize button appends recognized handwriting to description', async ({ page }) => {
  await page.addInitScript(() => {
    window.mindMappRecognizeHandwriting = async strokes => {
      if (!strokes.length || !strokes[0].length) throw new Error('no strokes')
      return 'recognized ink'
    }
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 120, y: 120, text: 'Topic', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })

  await page.goto('/')
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })

  const drawing = page.locator('#details-drawing')
  const box = await drawing.boundingBox()
  await page.mouse.move(box.x + 20, box.y + 30)
  await page.mouse.down()
  await page.mouse.move(box.x + 130, box.y + 70, { steps: 5 })
  await page.mouse.up()

  await page.locator('#btn-recognize-handwriting').click()
  await expect(page.locator('#details-text')).toHaveValue('recognized ink')
  await expect(page.locator('#recognition-status')).toContainText('Recognized')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes[0].details.text).toBe('recognized ink')
  expect(saved.nodes[0].details.strokes.length).toBe(1)
})

test('recognition explains when no strokes exist', async ({ page }) => {
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
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  await page.locator('#btn-recognize-handwriting').click()
  await expect(page.locator('#recognition-status')).toContainText('Draw something first')
})

test('recognition uses the Mind Mapp API when browser handwriting is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    delete navigator.createHandwritingRecognizer
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 120, y: 120, text: 'Topic', width: 80, height: 40, details: { text: '', drawing: null, strokes: [] } }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })
  await page.route('**/api/recognize-handwriting', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ text: 'api recognized note', provider: 'sage-router' }),
  }))

  await page.goto('/')
  await page.locator('#canvas').click({ position: { x: 160, y: 140 } })
  const drawing = page.locator('#details-drawing')
  const box = await drawing.boundingBox()
  await page.mouse.move(box.x + 30, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 145, box.y + 80, { steps: 5 })
  await page.mouse.up()

  await page.locator('#btn-recognize-handwriting').click()
  await expect(page.locator('#details-text')).toHaveValue('api recognized note')
  await expect(page.locator('#recognition-status')).toContainText('Recognized')
})

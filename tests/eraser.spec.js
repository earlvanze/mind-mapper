import { test, expect } from '@playwright/test'

test('delete button removes selected nodes and incident edges', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'A', width: 80, height: 40 },
        { id: 2, x: 260, y: 100, text: 'B', width: 80, height: 40 },
      ],
      edges: [{ id: 1, from: 1, to: 2 }],
      lastId: 2,
      lastEdgeId: 1,
      edgeLabels: { 1: 'edge' },
    }))
  })

  await page.goto('/')
  await page.locator('#canvas').click({ position: { x: 140, y: 120 } })
  await page.locator('#btn-delete').click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.map(node => node.id)).toEqual([2])
  expect(saved.edges).toEqual([])
  expect(saved.edgeLabels).toEqual({})
})

test('canvas eraser mode deletes nodes by clicking them', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 100, y: 100, text: 'A', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })

  await page.goto('/')
  await page.locator('#btn-eraser').click()
  await expect(page.locator('#btn-eraser')).toHaveClass(/active/)
  await page.locator('#canvas').click({ position: { x: 140, y: 120 } })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes).toEqual([])
})

test('drawing eraser removes ink from the details canvas', async ({ page }) => {
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
  const drawing = page.locator('#details-drawing')
  const box = await drawing.boundingBox()

  await page.mouse.move(box.x + 30, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 220, box.y + 50, { steps: 5 })
  await page.mouse.up()

  const before = await drawing.evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++
    return transparent
  })

  await page.locator('#btn-draw-eraser').click()
  await page.mouse.move(box.x + 110, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 150, box.y + 50, { steps: 4 })
  await page.mouse.up()

  const after = await drawing.evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    let transparent = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++
    return transparent
  })
  expect(after).toBeGreaterThan(before)
})

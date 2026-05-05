import { test, expect } from '@playwright/test'

test('committing node edits removes the textarea editor', async ({ page }) => {
  await page.goto('/')

  await page.locator('#btn-add').click()
  const editor = page.locator('.node-edit-input')
  await expect(editor).toBeVisible()

  await editor.fill('Committed node')
  await page.keyboard.press('Enter')

  await expect(page.locator('.node-edit-input')).toHaveCount(0)
})

test('dragging nodes remains stable after panning the canvas', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 100, y: 100, text: 'Node', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
    }))
  })
  await page.goto('/')
  const canvas = page.locator('#canvas')

  // Pan the canvas 100px to the right.
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 700, y: 500 },
    targetPosition: { x: 800, y: 500 },
  })

  // The node is now visually shifted right by the pan. Drag it 50px more.
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 240, y: 120 },
    targetPosition: { x: 290, y: 120 },
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes[0].x).toBeGreaterThan(145)
  expect(saved.nodes[0].x).toBeLessThan(155)
})


test('delete key removes selected node even when an edge shares its id', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Node 1', width: 80, height: 40 },
        { id: 2, x: 300, y: 100, text: 'Node 2', width: 80, height: 40 },
      ],
      edges: [{ id: 1, from: 1, to: 2 }],
      edgeLabels: { 1: 'same id' },
      lastId: 2,
      lastEdgeId: 1,
    }))
  })
  await page.goto('/')

  await page.locator('#canvas').click({ position: { x: 140, y: 120 } })
  await page.keyboard.press('Delete')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.map(node => node.id)).toEqual([2])
  expect(saved.edges).toEqual([])
  expect(saved.edgeLabels).toEqual({})
})

test('routed edge vertices stay attached when connected nodes move', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Root', width: 100, height: 50, treeSide: 'east' },
        { id: 2, x: 400, y: 100, text: 'Child', width: 100, height: 50, treeSide: 'east' },
      ],
      edges: [{
        id: 1,
        from: 1,
        to: 2,
        route: 'polyline',
        side: 'east',
        points: [{ x: 200, y: 125 }, { x: 300, y: 125 }, { x: 300, y: 125 }, { x: 400, y: 125 }],
      }],
      edgeLabels: {},
      lastId: 2,
      lastEdgeId: 1,
      view: { x: 0, y: 0, scale: 1 },
    }))
  })
  await page.goto('/')

  const canvas = page.locator('#canvas')
  await canvas.dragTo(canvas, {
    sourcePosition: { x: 450, y: 125 },
    targetPosition: { x: 450, y: 245 },
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const child = saved.nodes.find(node => node.id === 2)
  const edge = saved.edges[0]
  const last = edge.points.at(-1)
  expect(child.y).toBeGreaterThan(215)
  expect(last.x).toBeCloseTo(child.x, 1)
  expect(last.y).toBeCloseTo(child.y + child.height / 2, 1)
})


test('double-clicking a parent collapses its subtree and double-clicking again zooms back in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Root', width: 100, height: 50 },
        { id: 2, x: 340, y: 100, text: 'Child', width: 100, height: 50 },
        { id: 3, x: 580, y: 100, text: 'Grandchild', width: 120, height: 50 },
      ],
      edges: [{ id: 1, from: 1, to: 2 }, { id: 2, from: 2, to: 3 }],
      edgeLabels: {},
      lastId: 3,
      lastEdgeId: 2,
      view: { x: 0, y: 0, scale: 1 },
    }))
  })
  await page.goto('/')
  const canvas = page.locator('#canvas')

  await canvas.dblclick({ position: { x: 150, y: 125 } })
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.find(node => node.id === 1).collapsed).toBe(true)

  const childScreen = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    const child = saved.nodes.find(node => node.id === 2)
    return {
      x: child.x * saved.view.scale + saved.view.x + child.width * saved.view.scale / 2,
      y: child.y * saved.view.scale + saved.view.y + child.height * saved.view.scale / 2,
    }
  })
  await canvas.click({ position: childScreen })
  await page.keyboard.press('Delete')
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.map(node => node.id).sort()).toEqual([1, 2, 3])

  const rootScreen = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    const root = saved.nodes.find(node => node.id === 1)
    return {
      x: root.x * saved.view.scale + saved.view.x + root.width * saved.view.scale / 2,
      y: root.y * saved.view.scale + saved.view.y + root.height * saved.view.scale / 2,
    }
  })
  await canvas.dblclick({ position: rootScreen })
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes.find(node => node.id === 1).collapsed).toBe(false)
  expect(saved.view.scale).toBeGreaterThan(1)
})

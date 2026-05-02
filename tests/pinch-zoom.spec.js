import { test, expect } from '@playwright/test'

test('two pointer pinch zooms the canvas around the gesture center', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 450, y: 330, text: 'Mind Map', width: 100, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })
  await page.goto('/')

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))

  await page.locator('#canvas').evaluate(canvas => {
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, pointerType: 'touch', clientX: 450, clientY: 350, button: 0, bubbles: true,
    }))
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 2, pointerType: 'touch', clientX: 550, clientY: 350, button: 0, bubbles: true,
    }))
  })

  await page.locator('#canvas').evaluate(canvas => {
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, pointerType: 'touch', clientX: 400, clientY: 350, button: 0, bubbles: true,
    }))
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 2, pointerType: 'touch', clientX: 600, clientY: 350, button: 0, bubbles: true,
    }))
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, pointerType: 'touch', clientX: 400, clientY: 350, button: 0, bubbles: true,
    }))
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 2, pointerType: 'touch', clientX: 600, clientY: 350, button: 0, bubbles: true,
    }))
  })

  // The map data is unchanged by viewport gestures.
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(after.nodes).toEqual(before.nodes)

  // Verify zoom visibly changed by checking the default node grew on canvas.
  const nodePixelWidth = await page.locator('#canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d')
    const y = Math.floor(canvas.height / 2)
    const data = ctx.getImageData(0, y, canvas.width, 1).data
    let first = -1
    let last = -1
    for (let x = 0; x < canvas.width; x++) {
      const i = x * 4
      if (data[i + 3] !== 0 && !(data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255)) {
        if (first === -1) first = x
        last = x
      }
    }
    return last - first
  })
  expect(nodePixelWidth).toBeGreaterThan(160)
})

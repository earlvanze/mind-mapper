import { test, expect } from '@playwright/test'

test('exports current page as Trello-compatible JSON', async ({ page }) => {
  await page.goto('/')
  await page.locator('#btn-project-kanban').click()
  const downloadPromise = page.waitForEvent('download')
  await page.locator('#btn-export-trello').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/trello\.json$/)
  const content = await download.createReadStream().then(stream => new Promise((resolve, reject) => {
    let data = ''
    stream.setEncoding('utf8')
    stream.on('data', chunk => data += chunk)
    stream.on('end', () => resolve(data))
    stream.on('error', reject)
  }))
  const board = JSON.parse(content)
  expect(board.name).toBe('Mind Mapp Project Kanban')
  expect(board.lists.length).toBeGreaterThan(2)
  expect(board.cards.length).toBeGreaterThan(10)
  expect(board.cards[0]).toHaveProperty('idList')
})

test('exports current page as Obsidian-compatible Kanban markdown', async ({ page }) => {
  await page.goto('/')
  await page.locator('#btn-project-kanban').click()
  const downloadPromise = page.waitForEvent('download')
  await page.locator('#btn-export-obsidian').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/obsidian-kanban\.md$/)
  const content = await download.createReadStream().then(stream => new Promise((resolve, reject) => {
    let data = ''
    stream.setEncoding('utf8')
    stream.on('data', chunk => data += chunk)
    stream.on('end', () => resolve(data))
    stream.on('error', reject)
  }))
  expect(content).toContain('# Mind Mapp Project Kanban')
  expect(content).toContain('## Done')
  expect(content).toContain('- [ ] Initialize Vite + vanilla JS project')
})

test('PNG export follows current viewport size and panned view', async ({ page }) => {
  await page.addInitScript(() => {
    window.__lastSetTransform = null
    window.__exportTransformAtDataUrl = null
    window.__exportSizeAtDataUrl = null
    const originalSetTransform = CanvasRenderingContext2D.prototype.setTransform
    CanvasRenderingContext2D.prototype.setTransform = function(...args) {
      window.__lastSetTransform = args
      return originalSetTransform.apply(this, args)
    }
    HTMLCanvasElement.prototype.toDataURL = function() {
      window.__exportTransformAtDataUrl = window.__lastSetTransform
      window.__exportSizeAtDataUrl = { width: this.width, height: this.height }
      return 'data:image/png;base64,iVBORw0KGgo='
    }
  })
  await page.setViewportSize({ width: 900, height: 620 })
  await page.goto('/')
  const box = await page.locator('#canvas').boundingBox()
  await page.mouse.move(box.x + 40, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 210, box.y + 125)
  await page.mouse.up()

  await page.locator('#btn-export').click()
  const exportData = await page.evaluate(() => ({ transform: window.__exportTransformAtDataUrl, size: window.__exportSizeAtDataUrl }))
  expect(exportData.size.width).toBe(Math.floor(box.width))
  expect(exportData.size.height).toBe(Math.floor(box.height))
  expect(exportData.transform[4]).not.toBe(0)
  expect(exportData.transform[5]).not.toBe(0)
})

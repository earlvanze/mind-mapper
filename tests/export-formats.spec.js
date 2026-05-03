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

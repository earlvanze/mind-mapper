import { test, expect } from '@playwright/test'

const trelloBoard = {
  id: 'board1',
  name: 'Launch Plan',
  desc: 'Ship the thing',
  url: 'https://trello.com/b/board1/launch-plan',
  lists: [
    { id: 'todo', name: 'To Do', pos: 1, closed: false },
    { id: 'doing', name: 'Doing', pos: 2, closed: false },
    { id: 'archived', name: 'Archived', pos: 3, closed: true },
  ],
  cards: [
    { id: 'c1', idList: 'todo', name: 'Write launch copy', desc: 'Landing page and email', labels: [{ name: 'Marketing' }], shortUrl: 'https://trello.com/c/c1', pos: 1, closed: false },
    { id: 'c2', idList: 'doing', name: 'Finalize import flow', desc: '', due: '2026-05-03T12:00:00.000Z', labels: [], url: 'https://trello.com/c/c2/finalize', pos: 1, closed: false },
    { id: 'c3', idList: 'todo', name: 'Closed card', pos: 2, closed: true },
  ],
  checklists: [
    { idCard: 'c1', checkItems: [{ name: 'Draft', state: 'complete' }, { name: 'Review', state: 'incomplete' }] },
  ],
}

test('imports a Trello board JSON export as a new mind-map page', async ({ page }) => {
  await page.goto('/')
  await page.locator('#trello-file-input').setInputFiles({
    name: 'trello-board.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(trelloBoard)),
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const imported = saved.notebook.pages.find(p => p.title === 'Launch Plan')
  expect(imported).toBeTruthy()
  expect(imported.trelloImportVersion).toBe(2)
  expect(imported.nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Launch Plan',
    'Write launch copy',
    'Finalize import flow',
  ]))
  expect(imported.nodes.map(node => node.text)).not.toContain('To Do')
  expect(imported.nodes.map(node => node.text)).not.toContain('Doing')
  expect(imported.nodes.map(node => node.text)).not.toContain('Closed card')
  expect(imported.nodes.map(node => node.text)).not.toContain('Archived')
  expect(imported.edges.length).toBe(imported.nodes.length - 1)

  const root = imported.nodes.find(node => node.text === 'Launch Plan')
  const projectCenters = imported.nodes.filter(node => node.organizedDepth === 1).map(node => ({
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }))
  expect(projectCenters.some(center => center.y < root.y)).toBe(true)
  expect(projectCenters.some(center => center.y > root.y + root.height)).toBe(true)
  const card = imported.nodes.find(node => node.text === 'Write launch copy')
  expect(card.details.text).toContain('Kanban list: To Do')
  expect(card.details.text).toContain('Trello URL: https://trello.com/c/c1')
  expect(card.details.text).toContain('Labels: Marketing')
  expect(card.details.text).toContain('☑ Draft')
  expect(card.details.text).toContain('☐ Review')
  expect(card.details.text).not.toContain('Git commit:')
  expect(card.details.text).not.toContain('Commit URL:')
  expect(saved.notebook.activePageId).toBe(imported.id)
})

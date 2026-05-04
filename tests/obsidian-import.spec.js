import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const sample = `# Operations Kanban

## Now / Active Execution

| Project | Status | Owner agent(s) | Notes / next control point |
|---|---:|---|---|
| Mind Mapp | Active | tech-mvp | Product build in \`Dropbox/Projects/mind-mapp\`; continue UX/app implementation. |
| EARLCoin | Active | earlcoin-vp-eng | Tokenized real-estate / portfolio product. |

## Parking Lot / Discovery Needed
- Periodically mine sessions for newly-created project names.
- Convert recurring Monitoring rows into explicit quests.
`

test('imports an Obsidian Kanban markdown file as a new mind-map page', async ({ page }) => {
  await page.goto('/')
  await page.locator('#obsidian-file-input').setInputFiles({
    name: 'Kanban.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(sample),
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const imported = saved.notebook.pages.find(p => p.title === 'Operations Kanban')
  expect(imported).toBeTruthy()
  expect(imported.obsidianKanbanImportVersion).toBe(3)
  expect(imported.nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Operations Kanban',
    'Mind Mapp',
    'EARLCoin',
    'Product build in Dropbox/Projects/mind-mapp',
    'Periodically mine sessions for newly-created project names.',
  ]))
  expect(imported.nodes.map(node => node.text)).not.toContain('Now / Active Execution')
  expect(imported.nodes.map(node => node.text)).not.toContain('Parking Lot / Discovery Needed')
  expect(imported.edges.length).toBe(imported.nodes.length - 1)
  expect(Object.keys(imported.edgeLabels || {})).toHaveLength(0)
  const root = imported.nodes.find(node => node.text === 'Operations Kanban')
  const projectCenters = imported.nodes.filter(node => node.organizedDepth === 1).map(node => ({
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }))
  expect(projectCenters.some(center => center.y < root.y)).toBe(true)
  expect(projectCenters.some(center => center.x < root.x)).toBe(true)
  expect(projectCenters.some(center => center.x > root.x + root.width)).toBe(true)
  const mindMapp = imported.nodes.find(node => node.text === 'Mind Mapp')
  expect(mindMapp.details.text).toContain('Kanban section: Now / Active Execution')
  expect(mindMapp.details.text).toContain('Status: Active')
  expect(mindMapp.details.text).toContain('Owner agent(s): tech-mvp')
  expect(mindMapp.details.text).toContain('Dropbox/Projects/mind-mapp')
  expect(mindMapp.organizedDepth).toBe(1)
  const mindMappTask = imported.nodes.find(node => node.text === 'Product build in Dropbox/Projects/mind-mapp')
  expect(mindMappTask.organizedDepth).toBe(2)
  expect(imported.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: mindMapp.id, to: mindMappTask.id })]))
  expect(mindMapp.details.text).not.toContain('Git commit:')
  expect(mindMapp.details.text).not.toContain('Commit URL:')
  expect(saved.notebook.activePageId).toBe(imported.id)
})

test('imports the real Operations/Kanban.md fixture when available', async ({ page }) => {
  const path = '/home/digit/Dropbox/Obsidian/Operations/Kanban.md'
  const markdown = readFileSync(path, 'utf8')
  await page.goto('/')
  await page.locator('#obsidian-file-input').setInputFiles({
    name: 'Kanban.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(markdown),
  })

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  const imported = saved.notebook.pages.find(p => p.title === 'Operations Kanban')
  expect(imported).toBeTruthy()
  expect(imported.nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Mind Mapp',
    'OpenClaw infrastructure',
    'Morning briefing',
  ]))
})

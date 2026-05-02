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
  expect(imported.obsidianKanbanImportVersion).toBe(1)
  expect(imported.nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Operations Kanban',
    'Now / Active Execution',
    'Parking Lot / Discovery Needed',
    'Mind Mapp',
    'EARLCoin',
    'Periodically mine sessions for newly-created project names.',
  ]))
  expect(imported.edges.length).toBe(imported.nodes.length - 1)
  const mindMapp = imported.nodes.find(node => node.text === 'Mind Mapp')
  expect(mindMapp.details.text).toContain('Status: Active')
  expect(mindMapp.details.text).toContain('Owner agent(s): tech-mvp')
  expect(mindMapp.details.text).toContain('Dropbox/Projects/mind-mapp')
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

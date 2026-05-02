import { test, expect } from '@playwright/test'

test('project kanban button puts the full kanban on page 1 and preserves old page 1', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      version: 2,
      notebook: {
        pages: [{
          id: 1,
          title: 'Original Page',
          nodes: [{ id: 1, x: 100, y: 100, text: 'Keep me', width: 80, height: 40 }],
          edges: [],
          lastId: 1,
          lastEdgeId: 0,
          edgeLabels: {},
          view: { x: 0, y: 0, scale: 1 },
        }],
        activePageId: 1,
        lastPageId: 1,
      },
    }))
  })
  page.on('dialog', dialog => dialog.accept())

  await page.goto('/')
  await page.locator('#btn-project-kanban').click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.notebook.pages[0].title).toBe('Project Kanban')
  expect(saved.notebook.pages[0].kanbanSeedVersion).toBe(1)
  expect(saved.notebook.pages[0].nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Mind Mapp Project Kanban',
    'Done',
    'In Progress',
    'Blocked / Risk',
    'Next',
    'Notebook pages with isolated maps',
    'Dual-brain deployment: app currently served from Cyber WSL, canonical host should be Umbrel',
  ]))
  expect(saved.notebook.pages[0].edges.length).toBe(saved.notebook.pages[0].nodes.length - 1)
  expect(Object.values(saved.notebook.pages[0].edgeLabels)).toEqual(expect.arrayContaining(['Done', 'Next']))
  expect(saved.notebook.pages[1].title).toBe('Original Page (saved)')
  expect(saved.notebook.pages[1].nodes[0].text).toBe('Keep me')
  expect(saved.notebook.activePageId).toBe(saved.notebook.pages[0].id)
})

test('current page can be deleted but the notebook keeps at least one page', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      version: 2,
      notebook: {
        pages: [
          { id: 1, title: 'Page 1', nodes: [], edges: [], lastId: 0, lastEdgeId: 0, edgeLabels: {}, view: { x: 0, y: 0, scale: 1 } },
          { id: 2, title: 'Page 2', nodes: [{ id: 1, x: 100, y: 100, text: 'Delete me', width: 80, height: 40 }], edges: [], lastId: 1, lastEdgeId: 0, edgeLabels: {}, view: { x: 0, y: 0, scale: 1 } },
        ],
        activePageId: 2,
        lastPageId: 2,
      },
    }))
  })

  let confirmCount = 0
  let alertCount = 0
  page.on('dialog', dialog => {
    if (dialog.type() === 'confirm') {
      confirmCount += 1
      dialog.accept()
    } else {
      alertCount += 1
      dialog.accept()
    }
  })

  await page.goto('/')
  await expect(page.locator('#page-select')).toHaveValue('2')
  await page.locator('#btn-delete-page').click()

  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(confirmCount).toBe(1)
  expect(saved.notebook.pages).toHaveLength(1)
  expect(saved.notebook.pages[0].title).toBe('Page 1')
  expect(saved.notebook.activePageId).toBe(1)

  await page.locator('#btn-delete-page').click()
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(alertCount).toBe(1)
  expect(saved.notebook.pages).toHaveLength(1)
})

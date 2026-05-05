import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

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
  expect(imported.trelloImportVersion).toBe(4)
  expect(imported.nodes.map(node => node.text)).toEqual(expect.arrayContaining([
    'Launch Plan',
    'Write launch copy',
    'Finalize import flow',
    '☑ Draft',
    '☐ Review',
  ]))
  expect(imported.nodes.map(node => node.text)).not.toContain('To Do')
  expect(imported.nodes.map(node => node.text)).not.toContain('Doing')
  expect(imported.nodes.map(node => node.text)).not.toContain('Closed card')
  expect(imported.nodes.map(node => node.text)).not.toContain('Archived')
  expect(imported.edges.length).toBe(imported.nodes.length - 1)
  expect(Object.keys(imported.edgeLabels || {})).toHaveLength(0)

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
  expect(card.organizedDepth).toBe(1)
  const draft = imported.nodes.find(node => node.text === '☑ Draft')
  const review = imported.nodes.find(node => node.text === '☐ Review')
  expect(draft.organizedDepth).toBe(2)
  expect(review.organizedDepth).toBe(2)
  expect(imported.edges).toEqual(expect.arrayContaining([
    expect.objectContaining({ from: card.id, to: draft.id }),
    expect.objectContaining({ from: card.id, to: review.id }),
  ]))
  expect(card.details.text).not.toContain('Git commit:')
  expect(card.details.text).not.toContain('Commit URL:')
  expect(saved.notebook.activePageId).toBe(imported.id)
})


test('imports dense Trello boards as readable multi-ring radial mind maps', async ({ page }) => {
  const denseBoard = {
    ...trelloBoard,
    cards: Array.from({ length: 30 }, (_, index) => ({
      id: 'dense-' + (index + 1),
      idList: index % 2 ? 'todo' : 'doing',
      name: 'Project ' + (index + 1),
      desc: 'Project notes ' + (index + 1),
      pos: index + 1,
      closed: false,
    })),
    checklists: [],
  }
  await page.goto('/')
  await page.locator('#trello-file-input').setInputFiles({
    name: 'dense-trello-board.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(denseBoard)),
  })

  const imported = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === 'Launch Plan')
  })
  const root = imported.nodes.find(node => node.text === 'Launch Plan')
  const rootCenter = { x: root.x + root.width / 2, y: root.y + root.height / 2 }
  const projectRadii = imported.nodes
    .filter(node => node.organizedDepth === 1)
    .map(node => Math.round(Math.hypot(node.x + node.width / 2 - rootCenter.x, node.y + node.height / 2 - rootCenter.y) / 100) * 100)
  expect(new Set(projectRadii).size).toBeGreaterThan(1)

  const pad = 56
  for (let i = 0; i < imported.nodes.length; i += 1) {
    for (let j = i + 1; j < imported.nodes.length; j += 1) {
      const a = imported.nodes[i]
      const b = imported.nodes[j]
      const overlap = a.x - pad < b.x + b.width + pad && a.x + a.width + pad > b.x - pad && a.y - pad < b.y + b.height + pad && a.y + a.height + pad > b.y - pad
      expect(overlap, a.text + ' overlaps ' + b.text).toBe(false)
    }
  }
})


test('imports the real Trello mindmap JSON as consolidated project groups', async ({ page }) => {
  const trello = readFileSync('/home/umbrel/Dropbox/Obsidian/Operations/earls-life-mindmap-with-operations-kanban.trello.json', 'utf8')
  await page.goto('/')
  await page.locator('#trello-file-input').setInputFiles({
    name: 'earls-life-mindmap-with-operations-kanban.trello.json',
    mimeType: 'application/json',
    buffer: Buffer.from(trello),
  })

  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1') || 'null')
    return saved?.notebook?.pages?.some(p => p.title === "Earl's Life Mindmap")
  })
  const imported = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return saved.notebook.pages.find(p => p.title === "Earl's Life Mindmap")
  })
  expect(imported).toBeTruthy()
  expect(imported.trelloImportVersion).toBe(4)
  const texts = imported.nodes.map(node => node.text.replace(/\n/g, ' '))
  expect(texts).toEqual(expect.arrayContaining([
    "Earl's Life Mindmap",
    'Ideas Backlog',
    'Ops: Now / Active Execution',
    'Mind Mapp',
    'OpenClaw infrastructure',
  ]))
  expect(Object.keys(imported.edgeLabels || {})).toHaveLength(0)
  expect(imported.nodes.filter(node => node.organizedDepth === 1).length).toBeGreaterThan(15)
  expect(imported.nodes.filter(node => node.organizedDepth === 2).length).toBeGreaterThan(80)
  const opsGroup = imported.nodes.find(node => node.text === 'Ops: Now / Active Execution')
  const mindMapp = imported.nodes.find(node => node.text === 'Mind Mapp')
  expect(opsGroup.organizedDepth).toBe(1)
  expect(mindMapp.organizedDepth).toBe(2)
  expect(imported.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: opsGroup.id, to: mindMapp.id })]))
  expect(imported.importCompassTreeLayout).toBe(true)

  const bounds = imported.nodes.reduce((acc, node) => ({
    minX: Math.min(acc.minX, node.x),
    minY: Math.min(acc.minY, node.y),
    maxX: Math.max(acc.maxX, node.x + node.width),
    maxY: Math.max(acc.maxY, node.y + node.height),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  expect(width).toBeLessThan(8000)
  expect(height).toBeLessThan(8000)
  expect(Math.max(width, height) / Math.min(width, height)).toBeLessThan(2.25)
  const root = imported.nodes.find(node => node.organizedDepth === 0)
  expect(imported.nodes.some(node => node.x + node.width / 2 < root.x)).toBe(true)
  expect(imported.nodes.some(node => node.x > root.x + root.width)).toBe(true)
  expect(imported.nodes.some(node => node.y + node.height / 2 < root.y)).toBe(true)
  expect(imported.nodes.some(node => node.y > root.y + root.height)).toBe(true)
  expect(new Set(imported.nodes.filter(node => node.organizedDepth === 1).map(node => node.treeSide)).size).toBeGreaterThanOrEqual(8)

  const pad = 24
  for (let i = 0; i < imported.nodes.length; i += 1) {
    for (let j = i + 1; j < imported.nodes.length; j += 1) {
      const a = imported.nodes[i]
      const b = imported.nodes[j]
      const overlap = a.x - pad < b.x + b.width + pad && a.x + a.width + pad > b.x - pad && a.y - pad < b.y + b.height + pad && a.y + a.height + pad > b.y - pad
      expect(overlap, a.text + ' overlaps ' + b.text).toBe(false)
    }
  }

  expect(imported.edges.every(edge => Array.isArray(edge.points) && edge.points.length >= 2)).toBe(true)
  for (const edge of imported.edges) {
    const from = imported.nodes.find(node => node.id === edge.from)
    const to = imported.nodes.find(node => node.id === edge.to)
    const first = edge.points[0]
    const last = edge.points[edge.points.length - 1]
    const touchesFrom = Math.abs(first.x - from.x) < 0.01 || Math.abs(first.x - (from.x + from.width)) < 0.01 || Math.abs(first.y - from.y) < 0.01 || Math.abs(first.y - (from.y + from.height)) < 0.01
    const touchesTo = Math.abs(last.x - to.x) < 0.01 || Math.abs(last.x - (to.x + to.width)) < 0.01 || Math.abs(last.y - to.y) < 0.01 || Math.abs(last.y - (to.y + to.height)) < 0.01
    expect(touchesFrom, `edge from ${from.text} starts on node boundary`).toBe(true)
    expect(touchesTo, `edge to ${to.text} ends on node boundary`).toBe(true)

    for (let i = 1; i < edge.points.length; i += 1) {
      const previous = edge.points[i - 1]
      const current = edge.points[i]
      const axisAligned = Math.abs(previous.x - current.x) < 0.01 || Math.abs(previous.y - current.y) < 0.01
      expect(axisAligned, `edge from ${from.text} to ${to.text} has orthogonal segment`).toBe(true)
    }
  }

  const nodeById = new Map(imported.nodes.map(node => [node.id, node]))
  const parentById = new Map(imported.edges.map(edge => [edge.to, edge.from]))
  function projectRootId(nodeId) {
    let current = nodeId
    let previous = nodeId
    while (parentById.has(current)) {
      previous = current
      current = parentById.get(current)
      if (nodeById.get(current)?.organizedDepth === 0) return previous
    }
    return previous
  }
  const projectByNodeId = new Map(imported.nodes.map(node => [node.id, node.organizedDepth === 1 ? node.id : projectRootId(node.id)]))
  function segmentHitsNode(x1, y1, x2, y2, node, clear = 10) {
    const left = node.x - clear
    const right = node.x + node.width + clear
    const top = node.y - clear
    const bottom = node.y + node.height + clear
    const steps = Math.max(8, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 24))
    for (let step = 1; step < steps; step += 1) {
      const ratio = step / steps
      const x = x1 + (x2 - x1) * ratio
      const y = y1 + (y2 - y1) * ratio
      if (x >= left && x <= right && y >= top && y <= bottom) return true
    }
    return false
  }
  for (const edge of imported.edges) {
    const from = nodeById.get(edge.from)
    if (from?.organizedDepth === 0) continue
    const edgeProjectId = projectByNodeId.get(edge.to)
    const segments = edge.points.slice(1).map((point, index) => [edge.points[index], point])
    for (const node of imported.nodes) {
      if (node.id === edge.from || node.id === edge.to || projectByNodeId.get(node.id) === edgeProjectId) continue
      const crossesSeparateProject = segments.some(([a, b]) => segmentHitsNode(a.x, a.y, b.x, b.y, node))
      expect(crossesSeparateProject, `${from.text} -> ${nodeById.get(edge.to).text} crosses ${node.text}`).toBe(false)
    }
  }

  expect(imported.view.scale).toBeGreaterThanOrEqual(0.3)
})

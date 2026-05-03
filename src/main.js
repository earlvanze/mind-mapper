import './style.css'

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  nodes: [],
  edges: [],
  selected: null,
  selectedType: null,
  connecting: null,
  dragging: null,
  panning: false,
  panStart: { x: 0, y: 0 },
  view: { x: 0, y: 0, scale: 1 },
  editing: null,
  editText: '',
  hoveredNode: null,
  hoveredEdge: null,
  lastId: 0,
  lastEdgeId: 0,
  edgeLabels: {},
  eraserMode: false,
  notebook: { pages: [], activePageId: null, lastPageId: 0 },
  zoomTrail: [],
}

const STORAGE_KEY = 'mind-mapp-v1'

const PROJECT_KANBAN_VERSION = 2
const COMMIT_BASE_URL = ''
const KANBAN_COMMITS = {
  root: ['db7630c', 'Current Kanban page behavior'],
  Done: ['eacec40', 'Project Kanban generator'],
  'In Progress': ['5d4cef4', 'Ollama handwriting/API workstream'],
  'Blocked / Risk': ['e8b06f2', 'Dual-brain deployment blocker'],
  Next: ['db7630c', 'Current page creation workflow'],
  'Initialize Vite + vanilla JS project': ['758a393', 'Initial project scaffold'],
  'Canvas pan/zoom and resize redraw': ['27daa89', 'Canvas resize redraw reliability'],
  'Node create, edit, drag, delete': ['7636a8e', 'Canvas dragging reliability'],
  'Edge create, label, select, delete': ['eb9dcb7', 'Edge labels and connection editing'],
  'localStorage persistence and legacy migration': ['f882754', 'Notebook migration and persistence'],
  'PNG export, minimap, fit view': ['f68c865', 'Minimap transform reliability'],
  'Keyboard shortcuts and undo/redo': ['bb4c202', 'Undo/redo and keyboard history'],
  'Notebook pages with isolated maps': ['f882754', 'Notebook pages'],
  'Node details panel: description + drawing': ['01f4b2b', 'Node details panel'],
  'Autosave node descriptions while typing': ['471a2a8', 'Description autosave'],
  'Map delete button and eraser mode': ['9bb560b', 'Deletion and eraser tools'],
  'Drawing pen/eraser tools': ['9bb560b', 'Drawing eraser tools'],
  'Ollama handwriting API wiring': ['5d4cef4', 'Ollama handwriting endpoint'],
  'Tune handwriting recognition quality on qwen2.5vl': ['5d4cef4', 'Vision model handwriting API'],
  'Validate live Cloudflare/Tailscale route from canonical host': ['6739911', 'ollama-cyber provider endpoint'],
  'Dual-brain deployment: app currently served from Cyber WSL, canonical host should be Umbrel': ['e8b06f2', 'Dual-brain deployment blocker'],
  'Keep Ollama on Cyber CUDA only, do not expose Ollama directly to public internet': ['6739911', 'Cyber Ollama endpoint routing'],
  'Move Mind Mapp serving to Umbrel': ['e8b06f2', 'Canonical host blocker'],
  'Route Umbrel app/API to Cyber Ollama over tailnet provider URL': ['6739911', 'ollama-cyber provider endpoint'],
  'Add durable service config for Mind Mapp server/tunnel': ['5d4cef4', 'Node server entrypoint'],
  'Add provider fallback or stronger OCR if Ollama handwriting is weak': ['bc39aa2', 'Handwriting recognition fallback wiring'],
}
const PROJECT_KANBAN_COLUMNS = [
  {
    title: 'Done',
    items: [
      'Initialize Vite + vanilla JS project',
      'Canvas pan/zoom and resize redraw',
      'Node create, edit, drag, delete',
      'Edge create, label, select, delete',
      'localStorage persistence and legacy migration',
      'PNG export, minimap, fit view',
      'Keyboard shortcuts and undo/redo',
      'Notebook pages with isolated maps',
      'Node details panel: description + drawing',
      'Autosave node descriptions while typing',
      'Map delete button and eraser mode',
      'Drawing pen/eraser tools',
      'Ollama handwriting API wiring',
    ],
  },
  {
    title: 'In Progress',
    items: [
      'Tune handwriting recognition quality on qwen2.5vl',
      'Validate live Cloudflare/Tailscale route from canonical host',
    ],
  },
  {
    title: 'Blocked / Risk',
    items: [
      'Dual-brain deployment: app currently served from Cyber WSL, canonical host should be Umbrel',
      'Keep Ollama on Cyber CUDA only, do not expose Ollama directly to public internet',
    ],
  },
  {
    title: 'Next',
    items: [
      'Move Mind Mapp serving to Umbrel',
      'Route Umbrel app/API to Cyber Ollama over tailnet provider URL',
      'Add durable service config for Mind Mapp server/tunnel',
      'Add provider fallback or stronger OCR if Ollama handwriting is weak',
    ],
  },
]


const TEMPLATE_STORAGE_KEY = 'mind-mapp-v1-style-templates'
const COLORFUL_PALETTE = [
  { fill: '#fff7ad', stroke: '#f59e0b', text: '#422006', accent: '#f97316' },
  { fill: '#bbf7d0', stroke: '#22c55e', text: '#052e16', accent: '#16a34a' },
  { fill: '#bfdbfe', stroke: '#3b82f6', text: '#0f172a', accent: '#2563eb' },
  { fill: '#fbcfe8', stroke: '#ec4899', text: '#500724', accent: '#db2777' },
  { fill: '#ddd6fe', stroke: '#8b5cf6', text: '#2e1065', accent: '#7c3aed' },
  { fill: '#fed7aa', stroke: '#f97316', text: '#431407', accent: '#ea580c' },
  { fill: '#a7f3d0', stroke: '#14b8a6', text: '#042f2e', accent: '#0d9488' },
  { fill: '#fecaca', stroke: '#ef4444', text: '#450a0a', accent: '#dc2626' },
]

const CONCEPT_COLOR_RULES = [
  { name: 'done', words: ['done', 'complete', 'completed', 'shipped', 'closed'], style: { fill: '#dcfce7', stroke: '#22c55e', text: '#052e16', accent: '#16a34a', shadow: '#22c55e' } },
  { name: 'active', words: ['active', 'now', 'doing', 'progress', 'execution', 'current'], style: { fill: '#dbeafe', stroke: '#3b82f6', text: '#0f172a', accent: '#2563eb', shadow: '#3b82f6' } },
  { name: 'blocked', words: ['blocked', 'risk', 'issue', 'bug', 'fix', 'failure', 'timeout'], style: { fill: '#fee2e2', stroke: '#ef4444', text: '#450a0a', accent: '#dc2626', shadow: '#ef4444' } },
  { name: 'next', words: ['next', 'todo', 'backlog', 'later', 'planned', 'roadmap'], style: { fill: '#fef3c7', stroke: '#f59e0b', text: '#422006', accent: '#d97706', shadow: '#f59e0b' } },
  { name: 'property', words: ['property', 'real estate', 'guest', 'booking', 'baselane', 'lofty', 'dao', 'pm ', 'rent', 'owner'], style: { fill: '#ccfbf1', stroke: '#14b8a6', text: '#042f2e', accent: '#0d9488', shadow: '#14b8a6' } },
  { name: 'finance', words: ['finance', 'financial', 'ledger', 'statement', 'stripe', 'payment', 'valuation', 'token', 'coin'], style: { fill: '#bbf7d0', stroke: '#16a34a', text: '#052e16', accent: '#15803d', shadow: '#22c55e' } },
  { name: 'infra', words: ['infrastructure', 'infra', 'openclaw', 'gateway', 'cloudflare', 'hostinger', 'deploy', 'sync', 'backup', 'server', 'api', 'ollama', 'cyber', 'umbrel'], style: { fill: '#e0e7ff', stroke: '#6366f1', text: '#1e1b4b', accent: '#4f46e5', shadow: '#6366f1' } },
  { name: 'product', words: ['mind mapp', 'app', 'product', 'feature', 'ux', 'template', 'kanban', 'trello', 'obsidian'], style: { fill: '#fbcfe8', stroke: '#ec4899', text: '#500724', accent: '#db2777', shadow: '#ec4899' } },
  { name: 'automation', words: ['automation', 'cron', 'agent', 'workflow', 'skill', 'script', 'briefing', 'summary'], style: { fill: '#ede9fe', stroke: '#8b5cf6', text: '#2e1065', accent: '#7c3aed', shadow: '#8b5cf6' } },
]

const DEFAULT_STYLE_TEMPLATES = [
  { id: 'tpl-neon-pop', name: 'Neon Pop', fill: '#f0abfc', stroke: '#c026d3', text: '#3b0764', accent: '#e879f9', shadow: '#d946ef' },
  { id: 'tpl-sunrise', name: 'Sunrise', fill: '#fde68a', stroke: '#f97316', text: '#431407', accent: '#fb7185', shadow: '#f59e0b' },
  { id: 'tpl-ocean', name: 'Ocean', fill: '#bae6fd', stroke: '#0284c7', text: '#082f49', accent: '#06b6d4', shadow: '#0ea5e9' },
  { id: 'tpl-forest', name: 'Forest', fill: '#bbf7d0', stroke: '#16a34a', text: '#052e16', accent: '#84cc16', shadow: '#22c55e' },
  { id: 'tpl-grape', name: 'Grape', fill: '#ddd6fe', stroke: '#7c3aed', text: '#2e1065', accent: '#a855f7', shadow: '#8b5cf6' },
  { id: 'tpl-candy', name: 'Candy', fill: '#fbcfe8', stroke: '#ec4899', text: '#500724', accent: '#fb7185', shadow: '#f472b6' },
  { id: 'tpl-mint', name: 'Mint', fill: '#ccfbf1', stroke: '#0d9488', text: '#042f2e', accent: '#2dd4bf', shadow: '#14b8a6' },
]

function cloneStyle(style = {}) {
  return {
    fill: style.fill || '#ffffff',
    stroke: style.stroke || '#e5e4e7',
    text: style.text || '#08060d',
    accent: style.accent || style.stroke || '#aa3bff',
    shadow: style.shadow || style.accent || style.stroke || '#aa3bff',
  }
}

function templateToStyle(template) {
  return cloneStyle(template)
}

function colorForIndex(index) {
  return cloneStyle(COLORFUL_PALETTE[index % COLORFUL_PALETTE.length])
}

function styleNode(node, style) {
  node.style = cloneStyle(style)
  return node
}

function loadCustomTemplates() {
  try {
    const raw = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter(t => t && t.name).map(t => ({ ...cloneStyle(t), id: t.id || `custom-${Date.now()}`, name: String(t.name) })) : []
  } catch (_) {
    return []
  }
}

function saveCustomTemplates(templates) {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
}

function allStyleTemplates() {
  return [...DEFAULT_STYLE_TEMPLATES, ...loadCustomTemplates()]
}

function selectedNodesForTemplate() {
  if (state.selectedType === 'node' && state.selected !== null) {
    const node = state.nodes.find(n => n.id === state.selected)
    return node ? [node] : []
  }
  return []
}

function applyTemplateToNodes(template, nodes) {
  const targetNodes = nodes?.length ? nodes : []
  if (!template || !targetNodes.length) return false
  const style = templateToStyle(template)
  targetNodes.forEach(node => styleNode(node, style))
  historyCommit()
  save()
  render()
  return true
}

function normalizeConceptText(value) {
  return compactText(value).toLowerCase()
}

function conceptStyleForText(text, fallbackIndex = 0) {
  const normalized = normalizeConceptText(text)
  const rule = CONCEPT_COLOR_RULES.find(candidate => candidate.words.some(word => normalized.includes(word)))
  return rule ? cloneStyle(rule.style) : colorForIndex(fallbackIndex)
}

function primaryConceptStyleForNode(node, parentStyle, fallbackIndex = 0) {
  const ownText = `${node?.text || ''} ${node?.details?.text || ''}`
  const ownStyle = conceptStyleForText(ownText, fallbackIndex)
  const matchedOwn = CONCEPT_COLOR_RULES.some(rule => rule.words.some(word => normalizeConceptText(ownText).includes(word)))
  return matchedOwn || !parentStyle ? ownStyle : cloneStyle(parentStyle)
}

function applyConceptColorsToNodeTree(nodes, edges) {
  const incoming = new Set(edges.map(edge => toId(edge)))
  const childIds = new Map(nodes.map(node => [node.id, []]))
  for (const edge of edges) {
    const from = fromId(edge)
    const to = toId(edge)
    if (childIds.has(from)) childIds.get(from).push(to)
  }
  const roots = nodes.filter(node => !incoming.has(node.id)).sort((a, b) => a.y - b.y || a.x - b.x)
  const visited = new Set()

  function visit(node, parentStyle, siblingIndex) {
    if (!node || visited.has(node.id)) return
    visited.add(node.id)
    const style = primaryConceptStyleForNode(node, parentStyle, siblingIndex)
    styleNode(node, style)
    const children = (childIds.get(node.id) || [])
      .map(id => nodes.find(candidate => candidate.id === id))
      .filter(Boolean)
      .sort((a, b) => a.y - b.y || a.x - b.x)
    children.forEach((child, index) => visit(child, style, index))
  }

  roots.forEach((root, index) => visit(root, null, index))
  nodes.forEach((node, index) => {
    if (!visited.has(node.id)) styleNode(node, conceptStyleForText(`${node.text || ''} ${node.details?.text || ''}`, index))
  })
  edges.forEach((edge, index) => {
    const from = nodes.find(node => node.id === fromId(edge))
    edge.color = from?.style?.accent || COLORFUL_PALETTE[index % COLORFUL_PALETTE.length].accent
  })
}

function makeMapColorful() {
  applyConceptColorsToNodeTree(state.nodes, state.edges)
  historyCommit()
  save()
  render()
}

function colorizePage(page) {
  applyConceptColorsToNodeTree(page.nodes, page.edges)
}

// ─── Notebook pages ──────────────────────────────────────────────────────────
function createPage(title = null) {
  const id = ++state.notebook.lastPageId
  return { id, title: title || `Page ${id}`, nodes: [], edges: [], lastId: 0, lastEdgeId: 0, edgeLabels: {}, view: { x: 0, y: 0, scale: 1 } }
}


function commitDetailsFor(text) {
  const [hash, label] = KANBAN_COMMITS[text] || KANBAN_COMMITS.root
  const url = COMMIT_BASE_URL ? `${COMMIT_BASE_URL}/${hash}` : 'local repo, no remote URL configured'
  return `Git commit: ${hash} (${label})\nCommit URL: ${url}`
}

function makeNodeForPage(page, x, y, text, detailsText = '', options = {}) {
  const previousLastId = state.lastId
  state.lastId = page.lastId || 0
  const node = newNode(x, y, text)
  const details = [detailsText]
  if (options.includeGitDetails) details.push(commitDetailsFor(text))
  node.details.text = details.filter(Boolean).join('\n\n')
  page.lastId = state.lastId
  state.lastId = previousLastId
  return node
}

function pageHasContent(page) {
  return Boolean(page?.nodes?.length || page?.edges?.length || Object.keys(page?.edgeLabels || {}).length)
}

function addPageEdge(page, from, to, label = '') {
  const edge = { id: ++page.lastEdgeId, from: from.id, to: to.id }
  page.edges.push(edge)
  if (label) page.edgeLabels[edge.id] = label
  return edge
}

function branchPoint(centerX, centerY, angle, radius) {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  }
}

function buildProjectKanbanPage(page) {
  page.nodes = []
  page.edges = []
  page.edgeLabels = {}
  page.lastId = 0
  page.lastEdgeId = 0
  page.title = 'Project Kanban'
  page.kanbanSeedVersion = PROJECT_KANBAN_VERSION
  page.view = { x: 330, y: 220, scale: 0.4 }

  const centerX = 760
  const centerY = 560
  const root = makeNodeForPage(
    page,
    centerX,
    centerY,
    'Mind Mapp Project Kanban',
    'Central project map. Branches show status, each leaf is a card.',
    { includeGitDetails: true },
  )
  root.width = Math.max(root.width, 270)
  root.height = Math.max(root.height, 58)
  page.nodes.push(root)

  const angles = [-Math.PI * 0.78, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.78]
  const headerRadius = 430
  const cardRadiusBase = 270
  const cardRadiusStep = 115
  const fanStep = Math.PI / 16

  PROJECT_KANBAN_COLUMNS.forEach((column, columnIndex) => {
    const angle = angles[columnIndex] ?? (-Math.PI + columnIndex * (Math.PI * 2 / PROJECT_KANBAN_COLUMNS.length))
    const headerPos = branchPoint(centerX, centerY, angle, headerRadius)
    const header = makeNodeForPage(page, headerPos.x, headerPos.y, column.title, `${column.items.length} cards`, { includeGitDetails: true })
    header.width = Math.max(header.width, 190)
    header.height = Math.max(header.height, 52)
    page.nodes.push(header)
    addPageEdge(page, root, header, column.title)

    column.items.forEach((item, itemIndex) => {
      const sideOffset = (itemIndex - (column.items.length - 1) / 2) * fanStep
      const radius = headerRadius + cardRadiusBase + (itemIndex % 3) * cardRadiusStep
      const cardPos = branchPoint(centerX, centerY, angle + sideOffset, radius)
      const card = makeNodeForPage(page, cardPos.x, cardPos.y, item, `Kanban branch: ${column.title}`, { includeGitDetails: true })
      card.width = Math.max(card.width, 235)
      card.height = Math.max(card.height, 52)
      page.nodes.push(card)
      addPageEdge(page, header, card)
    })
  })
  colorizePage(page)
}

function applyProjectKanbanToNewPage() {
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()

  const page = createPage('Project Kanban')
  buildProjectKanbanPage(page)
  state.notebook.pages.push(page)
  state.notebook.activePageId = page.id
  loadPageIntoState(page)
  hideDetails()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  resize()
  return true
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function trelloCardDetails(card, board) {
  const labels = (card.labels || []).map(label => label.name || label.color).filter(Boolean)
  const checkItems = (board.checklists || [])
    .filter(checklist => checklist.idCard === card.id)
    .flatMap(checklist => (checklist.checkItems || []).map(item => `${item.state === 'complete' ? '☑' : '☐'} ${item.name}`))
  return [
    card.desc ? `Description:\n${card.desc}` : '',
    card.url || card.shortUrl ? `Trello URL: ${card.url || card.shortUrl}` : '',
    labels.length ? `Labels: ${labels.join(', ')}` : '',
    card.due ? `Due: ${card.due}` : '',
    checkItems.length ? `Checklist:\n${checkItems.join('\n')}` : '',
  ].filter(Boolean).join('\n\n')
}

function buildTrelloBoardPage(page, board) {
  if (!board || !Array.isArray(board.lists) || !Array.isArray(board.cards)) {
    throw new Error('Expected a Trello board JSON export with lists and cards.')
  }

  page.nodes = []
  page.edges = []
  page.edgeLabels = {}
  page.lastId = 0
  page.lastEdgeId = 0
  page.title = compactText(board.name) || 'Trello Board'
  page.trelloImportVersion = 1
  page.trelloBoardId = board.id || null
  page.view = { x: 330, y: 220, scale: 0.42 }

  const openLists = board.lists.filter(list => !list.closed)
  const cardsByList = new Map()
  for (const card of board.cards.filter(card => !card.closed)) {
    if (!cardsByList.has(card.idList)) cardsByList.set(card.idList, [])
    cardsByList.get(card.idList).push(card)
  }
  for (const cards of cardsByList.values()) cards.sort((a, b) => (a.pos || 0) - (b.pos || 0))

  const centerX = 760
  const centerY = 560
  const root = makeNodeForPage(
    page,
    centerX,
    centerY,
    page.title,
    [
      'Imported from Trello board JSON.',
      board.url ? `Trello URL: ${board.url}` : '',
      board.desc ? `Description:\n${board.desc}` : '',
    ].filter(Boolean).join('\n\n'),
  )
  root.width = Math.max(root.width, 260)
  root.height = Math.max(root.height, 58)
  page.nodes.push(root)

  const branchCount = Math.max(1, openLists.length)
  const headerRadius = 430
  const cardRadiusBase = 285
  const cardRadiusStep = 120
  const fanStep = Math.PI / Math.max(18, branchCount * 5)

  openLists.forEach((list, listIndex) => {
    const angle = -Math.PI / 2 + listIndex * (Math.PI * 2 / branchCount)
    const headerPos = branchPoint(centerX, centerY, angle, headerRadius)
    const cards = cardsByList.get(list.id) || []
    const header = makeNodeForPage(page, headerPos.x, headerPos.y, list.name, `${cards.length} Trello cards`)
    header.width = Math.max(header.width, 190)
    header.height = Math.max(header.height, 52)
    page.nodes.push(header)
    addPageEdge(page, root, header, list.name)

    cards.forEach((card, cardIndex) => {
      const sideOffset = (cardIndex - (cards.length - 1) / 2) * fanStep
      const radius = headerRadius + cardRadiusBase + (cardIndex % 4) * cardRadiusStep
      const cardPos = branchPoint(centerX, centerY, angle + sideOffset, radius)
      const title = compactText(card.name) || 'Untitled Trello card'
      const node = makeNodeForPage(page, cardPos.x, cardPos.y, title, trelloCardDetails(card, board))
      node.width = Math.max(node.width, 235)
      node.height = Math.max(node.height, 52)
      node.trelloCardId = card.id || null
      page.nodes.push(node)
      addPageEdge(page, header, node)
    })
  })
  colorizePage(page)
}

function importTrelloBoard(board) {
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()

  const page = createPage(compactText(board?.name) || 'Trello Board')
  buildTrelloBoardPage(page, board)
  state.notebook.pages.push(page)
  state.notebook.activePageId = page.id
  loadPageIntoState(page)
  hideDetails()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  resize()
  return true
}

async function importTrelloFile(file) {
  if (!file) return false
  try {
    const text = await file.text()
    importTrelloBoard(JSON.parse(text))
    return true
  } catch (error) {
    window.alert(`Could not import Trello board: ${error.message}`)
    return false
  } finally {
    if (trelloFileInput) trelloFileInput.value = ''
  }
}

function splitMarkdownTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())
}

function isMarkdownTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function cleanMarkdownInline(text) {
  return compactText(String(text || '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1'))
}

function parseObsidianKanbanMarkdown(markdown, fileName = 'Obsidian Kanban.md') {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const titleLine = lines.find(line => /^#\s+/.test(line))
  const title = cleanMarkdownInline(titleLine?.replace(/^#\s+/, '') || fileName.replace(/\.[^.]+$/, '') || 'Obsidian Kanban')
  const columns = []
  const columnByTitle = new Map()
  let currentSection = 'Cards'

  function getColumn(name) {
    const title = cleanMarkdownInline(name || 'Cards') || 'Cards'
    if (!columnByTitle.has(title)) {
      const column = { title, items: [] }
      columnByTitle.set(title, column)
      columns.push(column)
    }
    return columnByTitle.get(title)
  }

  function addItem(section, title, details = '') {
    const cleanTitle = cleanMarkdownInline(title)
    if (!cleanTitle) return
    getColumn(section).items.push({ title: cleanTitle, details })
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const heading = line.match(/^(#{2,6})\s+(.+)$/)
    if (heading) {
      currentSection = cleanMarkdownInline(heading[2]) || currentSection
      continue
    }

    if (line.includes('|') && lines[i + 1] && isMarkdownTableSeparator(lines[i + 1])) {
      const headers = splitMarkdownTableRow(line).map(cleanMarkdownInline)
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const cells = splitMarkdownTableRow(lines[i])
        const row = Object.fromEntries(headers.map((header, index) => [header || `Column ${index + 1}`, cleanMarkdownInline(cells[index] || '')]))
        const titleKey = ['Project', 'Task', 'Card', 'Name', 'Item', 'Title'].find(key => row[key]) || headers.find(header => row[header])
        const itemTitle = row[titleKey]
        const details = headers
          .filter(header => header && header !== titleKey && row[header])
          .map(header => `${header}: ${row[header]}`)
          .join('\n')
        addItem(currentSection, itemTitle, details)
        i += 1
      }
      i -= 1
      continue
    }

    const bullet = line.match(/^\s*[-*+]\s+(?:\[[ xX-]\]\s*)?(.+)$/)
    if (bullet && !bullet[1].startsWith('|')) {
      addItem(currentSection, bullet[1])
    }
  }

  return { title, columns: columns.filter(column => column.items.length) }
}

function buildObsidianKanbanPage(page, parsed) {
  if (!parsed?.columns?.length) throw new Error('No markdown tables or task bullets found.')

  page.nodes = []
  page.edges = []
  page.edgeLabels = {}
  page.lastId = 0
  page.lastEdgeId = 0
  page.title = parsed.title || 'Obsidian Kanban'
  page.obsidianKanbanImportVersion = 1
  page.view = { x: 330, y: 220, scale: 0.38 }

  const centerX = 760
  const centerY = 560
  const root = makeNodeForPage(page, centerX, centerY, page.title, 'Imported from Obsidian Markdown/Kanban file.')
  root.width = Math.max(root.width, 270)
  root.height = Math.max(root.height, 58)
  page.nodes.push(root)

  const branchCount = Math.max(1, parsed.columns.length)
  const headerRadius = 455
  const cardRadiusBase = 300
  const cardRadiusStep = 125
  const fanStep = Math.PI / Math.max(20, branchCount * 5)

  parsed.columns.forEach((column, columnIndex) => {
    const angle = -Math.PI / 2 + columnIndex * (Math.PI * 2 / branchCount)
    const headerPos = branchPoint(centerX, centerY, angle, headerRadius)
    const header = makeNodeForPage(page, headerPos.x, headerPos.y, column.title, `${column.items.length} Obsidian items`)
    header.width = Math.max(header.width, 205)
    header.height = Math.max(header.height, 52)
    page.nodes.push(header)
    addPageEdge(page, root, header, column.title)

    column.items.forEach((item, itemIndex) => {
      const sideOffset = (itemIndex - (column.items.length - 1) / 2) * fanStep
      const radius = headerRadius + cardRadiusBase + (itemIndex % 4) * cardRadiusStep
      const cardPos = branchPoint(centerX, centerY, angle + sideOffset, radius)
      const node = makeNodeForPage(page, cardPos.x, cardPos.y, item.title, item.details)
      node.width = Math.max(node.width, 245)
      node.height = Math.max(node.height, 52)
      page.nodes.push(node)
      addPageEdge(page, header, node)
    })
  })
  colorizePage(page)
}

function importObsidianKanbanMarkdown(markdown, fileName) {
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()

  const parsed = parseObsidianKanbanMarkdown(markdown, fileName)
  const page = createPage(parsed.title || 'Obsidian Kanban')
  buildObsidianKanbanPage(page, parsed)
  state.notebook.pages.push(page)
  state.notebook.activePageId = page.id
  loadPageIntoState(page)
  hideDetails()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  resize()
  return true
}

async function importObsidianKanbanFile(file) {
  if (!file) return false
  try {
    importObsidianKanbanMarkdown(await file.text(), file.name)
    return true
  } catch (error) {
    window.alert(`Could not import Obsidian Kanban: ${error.message}`)
    return false
  } finally {
    if (obsidianFileInput) obsidianFileInput.value = ''
  }
}

function activePage() {
  return state.notebook.pages.find(page => page.id === state.notebook.activePageId) || null
}

function syncCurrentPage() {
  const page = activePage()
  if (!page) return
  page.nodes = state.nodes
  page.edges = state.edges
  page.lastId = state.lastId
  page.lastEdgeId = state.lastEdgeId
  page.edgeLabels = state.edgeLabels
  page.view = { ...state.view }
}

function loadPageIntoState(page) {
  state.nodes = page.nodes || []
  state.edges = page.edges || []
  state.lastId = page.lastId || 0
  state.lastEdgeId = page.lastEdgeId || 0
  state.edgeLabels = page.edgeLabels || {}
  state.view = page.view ? { ...page.view } : { x: 0, y: 0, scale: 1 }
  state.selected = null
  state.selectedType = null
  state.connecting = null
  state.dragging = null
  state.panning = false
  state.editing = null
  if (typeof btnConnect !== 'undefined') btnConnect.classList.remove('active')
}

function resetHistoryForCurrentPage() {
  history.stack = []
  history.index = -1
  historyPush()
}

function renderPageTabs() {
  if (typeof pageSelect === 'undefined') return
  pageSelect.innerHTML = ''
  for (const page of state.notebook.pages) {
    const option = document.createElement('option')
    option.value = String(page.id)
    option.textContent = page.title
    pageSelect.appendChild(option)
  }
  pageSelect.value = String(state.notebook.activePageId)
  renderDetailsPageLinkOptions()
  updateZoomBackButton()
}

function switchPage(pageId, options = {}) {
  if (pageId === state.notebook.activePageId) return
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()
  const page = state.notebook.pages.find(p => p.id === pageId)
  if (!page) return
  state.notebook.activePageId = page.id
  loadPageIntoState(page)
  refreshDetailsPanel()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  if (options.skipResize) render()
  else resize()
}

function addNotebookPage() {
  btnNewPage?.blur()
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()
  const page = createPage(`Page ${state.notebook.pages.length + 1}`)
  state.notebook.pages.push(page)
  state.notebook.activePageId = page.id
  loadPageIntoState(page)
  const center = screenToWorld(canvas.width / 2, canvas.height / 2)
  state.nodes.push(newNode(center.x, center.y, page.title))
  syncCurrentPage()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  render()
}

function deleteCurrentPage() {
  btnDeletePage?.blur()
  if (state.notebook.pages.length <= 1) {
    window.alert('A notebook needs at least one page.')
    return false
  }
  const page = activePage()
  if (!page) return false
  const confirmed = window.confirm(`Delete “${page.title}”? This cannot be undone.`)
  if (!confirmed) return false

  const index = state.notebook.pages.findIndex(p => p.id === page.id)
  state.notebook.pages.splice(index, 1)
  const nextPage = state.notebook.pages[Math.max(0, index - 1)] || state.notebook.pages[0]
  state.notebook.activePageId = nextPage.id
  loadPageIntoState(nextPage)
  hideDetails()
  resetHistoryForCurrentPage()
  save()
  renderPageTabs()
  resize()
  return true
}


// ─── Color templates ─────────────────────────────────────────────────────────
let activeTemplateId = DEFAULT_STYLE_TEMPLATES[0].id

function activeTemplate() {
  return allStyleTemplates().find(template => template.id === activeTemplateId) || allStyleTemplates()[0]
}

function setTemplateStatus(message) {
  if (templateStatus) templateStatus.textContent = message || ''
}

function renderTemplateGrid() {
  if (!templateGrid) return
  templateGrid.innerHTML = ''
  for (const template of allStyleTemplates()) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `template-swatch${template.id === activeTemplateId ? ' active' : ''}`
    button.dataset.templateId = template.id
    button.innerHTML = `
      <span class="template-preview" style="background:${template.fill};border-color:${template.stroke};color:${template.text};box-shadow:0 8px 20px ${template.shadow || template.accent}55">Aa</span>
      <span class="template-name">${template.name}</span>
    `
    button.addEventListener('click', () => {
      activeTemplateId = template.id
      renderTemplateGrid()
      setTemplateStatus(`${template.name} selected.`)
    })
    templateGrid.appendChild(button)
  }
}

function openTemplateModal() {
  renderTemplateGrid()
  setTemplateStatus(selectedNodesForTemplate().length ? 'Pick a template, then apply it to the selected node or the whole map.' : 'No node selected. Pick a template and apply it to all, or select a node first.')
  templateModal?.classList.remove('hidden')
}

function closeTemplateModal() {
  templateModal?.classList.add('hidden')
}

function saveSelectedNodeAsTemplate() {
  const node = selectedNodesForTemplate()[0]
  if (!node) {
    setTemplateStatus('Select a styled node first, then save it as a template.')
    return false
  }
  const name = window.prompt('Template name?', node.text ? `${node.text} Style` : 'My Template')
  if (!name?.trim()) return false
  const templates = loadCustomTemplates()
  const template = { id: `custom-${Date.now()}`, name: name.trim(), ...cloneStyle(node.style || colorForIndex(templates.length)) }
  templates.push(template)
  saveCustomTemplates(templates)
  activeTemplateId = template.id
  renderTemplateGrid()
  setTemplateStatus(`Saved “${template.name}”.`)
  return true
}

function exportTemplates() {
  const custom = loadCustomTemplates()
  const blob = new Blob([JSON.stringify({ version: 1, templates: custom }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mindmapp-color-templates.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  setTemplateStatus(custom.length ? `Exported ${custom.length} custom template${custom.length === 1 ? '' : 's'}.` : 'Exported an empty custom template set.')
}

async function importTemplateFile(file) {
  if (!file) return false
  try {
    const parsed = JSON.parse(await file.text())
    const incoming = Array.isArray(parsed) ? parsed : parsed.templates
    if (!Array.isArray(incoming)) throw new Error('Expected a templates array or { templates: [...] }.')
    const existing = loadCustomTemplates()
    const names = new Set(existing.map(t => t.name.toLowerCase()))
    let imported = 0
    for (const raw of incoming) {
      if (!raw?.name || names.has(String(raw.name).toLowerCase())) continue
      existing.push({ id: `custom-${Date.now()}-${imported}`, name: String(raw.name), ...cloneStyle(raw) })
      names.add(String(raw.name).toLowerCase())
      imported += 1
    }
    saveCustomTemplates(existing)
    renderTemplateGrid()
    setTemplateStatus(`Imported ${imported} template${imported === 1 ? '' : 's'}.`)
    return true
  } catch (error) {
    setTemplateStatus(`Could not import templates: ${error.message}`)
    return false
  } finally {
    if (templateFileInput) templateFileInput.value = ''
  }
}

// ─── History (undo/redo) ─────────────────────────────────────────────────────
const MAX_HISTORY = 50
const history = { stack: [], index: -1 }

function historySnapshot() {
  return JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
    edgeLabels: state.edgeLabels,
    view: state.view,
  })
}

function historyPush() {
  // trim forward history
  history.stack = history.stack.slice(0, history.index + 1)
  history.stack.push(historySnapshot())
  if (history.stack.length > MAX_HISTORY) history.stack.shift()
  history.index = history.stack.length - 1
}

function historyUndo() {
  if (history.index <= 0) return
  history.index--
  applySnapshot(history.stack[history.index])
}

function historyRedo() {
  if (history.index >= history.stack.length - 1) return
  history.index++
  applySnapshot(history.stack[history.index])
}

function applySnapshot(snap) {
  try {
    const data = JSON.parse(snap)
    state.nodes = data.nodes
    state.edges = data.edges
    state.lastId = data.lastId
    state.lastEdgeId = data.lastEdgeId
    state.edgeLabels = data.edgeLabels || {}
    state.view = data.view ? { ...data.view } : state.view
    syncCurrentPage()
    state.selected = null
    state.selectedType = null
    state.connecting = null
    state.editing = null
    save()
    refreshDetailsPanel()
    render()
  } catch (e) { /* ignore */ }
}

function historyCommit() {
  historyPush()
}

// ─── DOM ─────────────────────────────────────────────────────────────────────
const app = document.getElementById('app')
app.innerHTML = `
<div class="toolbar">
  <span class="notebook-controls">
    <strong>Notebook</strong>
    <select id="page-select" title="Current page"></select>
    <button id="btn-new-page" title="New notebook page">+ Page</button>
    <button id="btn-delete-page" title="Delete current notebook page">Delete Page</button>
    <button id="btn-zoom-back" title="Zoom back out to the previous linked page" disabled>↩ Zoom Out</button>
    <button id="btn-project-kanban" title="Create a project kanban page">Kanban</button>
    <button id="btn-import-trello" title="Import a Trello board JSON export">Import Trello</button>
    <input id="trello-file-input" type="file" accept="application/json,.json" hidden>
    <button id="btn-import-obsidian" title="Import an Obsidian Kanban Markdown file">Import Obsidian</button>
    <input id="obsidian-file-input" type="file" accept="text/markdown,text/plain,.md,.markdown" hidden>
    <button id="btn-templates" title="Apply, save, import, or export colorful node templates">📋 Templates</button>
    <button id="btn-colorful" title="Apply a bright color palette to this map">🌈 Colorful</button>
    <button id="btn-ai-kanban" title="Use Sage Router when available, otherwise local intelligence, to turn this mind map into a Kanban page">🤖 AI Kanban</button>
  </span>
  <button id="btn-add" title="Add node (A)">+ Node</button>
  <button id="btn-connect" title="Connect mode (C)">⬌ Connect</button>
  <button id="btn-delete" title="Delete selected node or edge (Delete)">🗑 Delete</button>
  <button id="btn-eraser" title="Eraser mode: click nodes or edges to delete">⌫ Eraser</button>
  <button id="btn-export" title="Export PNG (E)">📷 Export</button>
  <button id="btn-export-trello" title="Export current page as Trello-compatible JSON">Export Trello JSON</button>
  <button id="btn-export-obsidian" title="Export current page as Obsidian Kanban Markdown">Export Obsidian MD</button>
  <button id="btn-fit" title="Fit view (F)">⛶ Fit</button>
  <span id="undo-redo-btns">
    <button id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
    <button id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
  </span>
  <span class="toolbar-hint">Double-click canvas to add node. Double-click node to edit. Drag to move.</span>
  <div id="minimap-container"><canvas id="minimap"></canvas></div>
</div>
<div id="template-modal" class="template-modal hidden" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
  <div class="template-card">
    <div class="template-header">
      <div>
        <h2 id="template-modal-title">Color Templates</h2>
        <p>Apply bright node styles, save a selected node as a reusable template, or move templates between browsers.</p>
      </div>
      <button id="btn-close-templates" title="Close templates">×</button>
    </div>
    <div id="template-grid" class="template-grid"></div>
    <div class="template-actions">
      <button id="btn-template-apply-selected">Apply to Selected</button>
      <button id="btn-template-apply-all">Apply to All</button>
      <button id="btn-template-save-selected">Save Selected as Template</button>
      <button id="btn-template-export">Export Templates</button>
      <button id="btn-template-import">Import Templates</button>
      <input id="template-file-input" type="file" accept="application/json,.json" hidden>
    </div>
    <p id="template-status" class="template-status" aria-live="polite"></p>
  </div>
</div>
<div class="workspace">
  <canvas id="canvas"></canvas>
  <aside id="details-panel" class="details-panel hidden">
    <div class="details-header">
      <div>
        <strong id="details-title">Node details</strong>
        <span id="details-subtitle">Write notes or sketch ideas</span>
      </div>
      <button id="btn-close-details" title="Close details">×</button>
    </div>
    <label class="details-label" for="details-text">Description</label>
    <textarea id="details-text" placeholder="Add context, requirements, links, acceptance notes..."></textarea>
    <div class="details-link-row">
      <label class="details-label" for="details-page-link">Page link</label>
      <div class="details-link-controls">
        <select id="details-page-link" title="Linked notebook page"></select>
        <button id="btn-open-linked-page" title="Zoom into this node and open its linked page">Open Link</button>
      </div>
      <span class="details-link-help">Double-click a linked node to zoom into the linked page.</span>
    </div>
    <div class="details-draw-header">
      <span class="details-label">Drawing</span>
      <span class="details-draw-actions">
        <button id="btn-draw-pen" class="active" title="Draw with pen">Pen</button>
        <button id="btn-draw-eraser" title="Erase drawing strokes">Eraser</button>
        <button id="btn-recognize-handwriting" title="Recognize handwriting from drawing">Recognize</button>
        <button id="btn-clear-drawing" title="Clear drawing">Clear</button>
      </span>
    </div>
    <canvas id="details-drawing" width="320" height="220"></canvas>
    <div id="recognition-status" class="recognition-status" aria-live="polite"></div>
  </aside>
</div>
`

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const minimapCanvas = document.getElementById('minimap')
const mctx = minimapCanvas.getContext('2d')
const pageSelect = document.getElementById('page-select')
const btnNewPage = document.getElementById('btn-new-page')
const btnDeletePage = document.getElementById('btn-delete-page')
const btnZoomBack = document.getElementById('btn-zoom-back')
const btnProjectKanban = document.getElementById('btn-project-kanban')
const btnImportTrello = document.getElementById('btn-import-trello')
const trelloFileInput = document.getElementById('trello-file-input')
const btnImportObsidian = document.getElementById('btn-import-obsidian')
const obsidianFileInput = document.getElementById('obsidian-file-input')
const btnTemplates = document.getElementById('btn-templates')
const btnColorful = document.getElementById('btn-colorful')
const btnAiKanban = document.getElementById('btn-ai-kanban')
const templateModal = document.getElementById('template-modal')
const templateGrid = document.getElementById('template-grid')
const templateStatus = document.getElementById('template-status')
const btnCloseTemplates = document.getElementById('btn-close-templates')
const btnTemplateApplySelected = document.getElementById('btn-template-apply-selected')
const btnTemplateApplyAll = document.getElementById('btn-template-apply-all')
const btnTemplateSaveSelected = document.getElementById('btn-template-save-selected')
const btnTemplateExport = document.getElementById('btn-template-export')
const btnTemplateImport = document.getElementById('btn-template-import')
const templateFileInput = document.getElementById('template-file-input')
const btnAdd = document.getElementById('btn-add')
const btnConnect = document.getElementById('btn-connect')
const btnDelete = document.getElementById('btn-delete')
const btnEraser = document.getElementById('btn-eraser')
const btnExport = document.getElementById('btn-export')
const btnExportTrello = document.getElementById('btn-export-trello')
const btnExportObsidian = document.getElementById('btn-export-obsidian')
const btnFit = document.getElementById('btn-fit')
const btnUndo = document.getElementById('btn-undo')
const btnRedo = document.getElementById('btn-redo')
const detailsPanel = document.getElementById('details-panel')
const detailsTitle = document.getElementById('details-title')
const detailsText = document.getElementById('details-text')
const detailsDrawing = document.getElementById('details-drawing')
const detailsPageLink = document.getElementById('details-page-link')
const btnOpenLinkedPage = document.getElementById('btn-open-linked-page')
const detailsCtx = detailsDrawing.getContext('2d')
const btnCloseDetails = document.getElementById('btn-close-details')
const btnClearDrawing = document.getElementById('btn-clear-drawing')
const btnDrawPen = document.getElementById('btn-draw-pen')
const btnDrawEraser = document.getElementById('btn-draw-eraser')
const btnRecognizeHandwriting = document.getElementById('btn-recognize-handwriting')
const recognitionStatus = document.getElementById('recognition-status')


// ─── Sizing ───────────────────────────────────────────────────────────────────
function resize() {
  const rect = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.floor(rect.width || window.innerWidth))
  canvas.height = Math.max(1, Math.floor(rect.height || window.innerHeight))
  render()
}
window.addEventListener('resize', resize)
resize()

// ─── Helpers ─────────────────────────────────────────────────────────────────
function nodeAt(mx, my) {
  const world = screenToWorld(mx, my)
  for (let i = state.nodes.length - 1; i >= 0; i--) {
    const n = state.nodes[i]
    if (world.x >= n.x && world.x <= n.x + n.width &&
        world.y >= n.y && world.y <= n.y + n.height) return n
  }
  return null
}

function edgeAt(mx, my) {
  const world = screenToWorld(mx, my)
  for (const e of state.edges) {
    const from = state.nodes.find(n => n.id === fromId(e))
    const to = state.nodes.find(n => n.id === toId(e))
    if (!from || !to) continue
    const [ax, ay, bx, by] = endpoints(from, to)
    const d = distPointToSegment(world.x, world.y, ax, ay, bx, by)
    if (d < 8) return e
  }
  return null
}

function fromId(e) { return Array.isArray(e) ? e[0] : e.from }
function toId(e) { return Array.isArray(e) ? e[1] : e.to }

function endpoints(a, b) {
  const ax = a.x + a.width / 2, ay = a.y + a.height / 2
  const bx = b.x + b.width / 2, by = b.y + b.height / 2
  return [ax, ay, bx, by]
}


function setEraserMode(active) {
  state.eraserMode = active
  btnEraser?.classList.toggle('active', active)
  canvas?.classList.toggle('eraser-mode', active)
  if (active) {
    state.connecting = null
    btnConnect?.classList.remove('active')
  }
}

function deleteSelected() {
  if (state.selected === null) return false
  const selectedId = state.selected
  if (state.selectedType === 'edge') {
    delete state.edgeLabels[selectedId]
    state.edges = state.edges.filter(e => e.id !== selectedId)
  } else if (state.selectedType === 'node') {
    for (const edge of state.edges) {
      if (fromId(edge) === selectedId || toId(edge) === selectedId) delete state.edgeLabels[edge.id]
    }
    state.nodes = state.nodes.filter(n => n.id !== selectedId)
    state.edges = state.edges.filter(e => fromId(e) !== selectedId && toId(e) !== selectedId)
  } else {
    return false
  }
  state.selected = null
  state.selectedType = null
  hideDetails()
  historyCommit()
  save()
  render()
  return true
}

function eraseAt(mx, my) {
  const node = nodeAt(mx, my)
  if (node) {
    state.selected = node.id
    state.selectedType = 'node'
    return deleteSelected()
  }
  const edge = edgeAt(mx, my)
  if (edge) {
    state.selected = edge.id
    state.selectedType = 'edge'
    return deleteSelected()
  }
  return false
}

function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - state.view.x) / state.view.scale,
    y: (sy - state.view.y) / state.view.scale,
  }
}

function worldToScreen(wx, wy) {
  return {
    x: wx * state.view.scale + state.view.x,
    y: wy * state.view.scale + state.view.y,
  }
}

function measureText(text, fontSize = 16) {
  ctx.font = `${fontSize}px system-ui, sans-serif`
  const lines = text.split('\n')
  let maxWidth = 0
  for (const line of lines) {
    maxWidth = Math.max(maxWidth, ctx.measureText(line).width)
  }
  return {
    width: maxWidth + 24,
    height: lines.length * (fontSize * 1.4) + 12,
  }
}

function newNode(x, y, text = 'New Node') {
  const id = ++state.lastId
  const size = measureText(text)
  return {
    id,
    x: x - size.width / 2,
    y: y - size.height / 2,
    text,
    width: size.width,
    height: size.height,
    details: { text: '', drawing: null, strokes: [] },
  }
}

function save() {
  syncCurrentPage()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 2,
    notebook: state.notebook,
    zoomTrail: state.zoomTrail,
    // Active-page mirror keeps older tests/tools and simple exports readable.
    nodes: state.nodes,
    edges: state.edges,
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
    edgeLabels: state.edgeLabels,
    view: state.view,
  }))
}

function load() {
  let migrated = false
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (data?.notebook?.pages?.length) {
      state.notebook = {
        pages: data.notebook.pages,
        activePageId: data.notebook.activePageId || data.notebook.pages[0].id,
        lastPageId: data.notebook.lastPageId || Math.max(...data.notebook.pages.map(page => page.id)),
      }
      state.zoomTrail = Array.isArray(data.zoomTrail) ? data.zoomTrail : []
    } else if (data) {
      const page = createPage('Page 1')
      page.nodes = data.nodes || []
      page.edges = data.edges || []
      page.lastId = data.lastId || 0
      page.lastEdgeId = data.lastEdgeId || 0
      page.edgeLabels = data.edgeLabels || {}
      page.view = data.view || { x: 0, y: 0, scale: 1 }
      state.notebook = { pages: [page], activePageId: page.id, lastPageId: page.id }
      migrated = true
    }
  } catch (e) { /* ignore */ }

  if (state.notebook.pages.length === 0) {
    const page = createPage('Page 1')
    state.notebook.pages.push(page)
    state.notebook.activePageId = page.id
  }

  loadPageIntoState(activePage())
  if (migrated) save()
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
function renderScene(ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.setTransform(state.view.scale, 0, 0, state.view.scale, state.view.x, state.view.y)

  drawGrid(ctx)

  for (const e of state.edges) {
    drawEdge(ctx, e)
  }

  if (state.connecting) {
    const from = state.nodes.find(n => n.id === state.connecting)
    if (from) {
      const sx = lastMouse.x, sy = lastMouse.y
      const world = screenToWorld(sx, sy)
      const [ax, ay] = [from.x + from.width / 2, from.y + from.height / 2]
      drawEdgeLine(ctx, ax, ay, world.x, world.y, '#aa3bff', true)
    }
  }

  for (const n of state.nodes) {
    drawNode(ctx, n)
  }

  ctx.restore()
}

function draw() {
  renderScene(ctx)
  drawMinimap()
}

function drawGrid(ctx) {
  const gridSize = 40
  const world = screenToWorld(0, 0)
  const worldEnd = screenToWorld(canvas.width, canvas.height)
  const startX = Math.floor(world.x / gridSize) * gridSize
  const startY = Math.floor(world.y / gridSize) * gridSize
  ctx.strokeStyle = '#e5e4e7'
  ctx.lineWidth = 1 / state.view.scale
  ctx.beginPath()
  for (let x = startX; x <= worldEnd.x; x += gridSize) {
    ctx.moveTo(x, world.y)
    ctx.lineTo(x, worldEnd.y)
  }
  for (let y = startY; y <= worldEnd.y; y += gridSize) {
    ctx.moveTo(world.x, y)
    ctx.lineTo(worldEnd.x, y)
  }
  ctx.stroke()
}

function drawEdge(ctx, e) {
  const from = state.nodes.find(n => n.id === fromId(e))
  const to = state.nodes.find(n => n.id === toId(e))
  if (!from || !to) return
  const [ax, ay, bx, by] = endpoints(from, to)
  const isHovered = state.hoveredEdge === e.id
  const label = state.edgeLabels[e.id] || null
  drawEdgeLine(ctx, ax, ay, bx, by, isHovered ? '#aa3bff' : (e.color || from.style?.accent || '#6b6375'), false, isHovered, label)
}

function drawEdgeLine(ctx, ax, ay, bx, by, color, dashed, highlighted = false, label = null) {
  ctx.strokeStyle = color
  ctx.lineWidth = (highlighted ? 3 : 2) / state.view.scale
  ctx.setLineDash(dashed ? [6 / state.view.scale, 4 / state.view.scale] : [])
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.stroke()
  ctx.setLineDash([])

  const angle = Math.atan2(by - ay, bx - ax)
  const headLen = 10 / state.view.scale
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - headLen * Math.cos(angle - Math.PI / 6), by - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(bx - headLen * Math.cos(angle + Math.PI / 6), by - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()

  if (label) {
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    const fontSize = 12 / state.view.scale
    ctx.font = `${fontSize}px system-ui, sans-serif`
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = color
    ctx.lineWidth = 3 / state.view.scale
    const metrics = ctx.measureText(label)
    ctx.strokeText(label, mx - metrics.width / 2, my + fontSize / 3)
    ctx.fillText(label, mx - metrics.width / 2, my + fontSize / 3)
  }
}

function drawNode(ctx, n) {
  const isSelected = state.selectedType === 'node' && state.selected === n.id
  const isEditing = state.editing === n.id
  const isHovered = state.hoveredNode === n.id
  const isConnecting = state.connecting === n.id

  const nodeStyle = cloneStyle(n.style || {})

  ctx.shadowColor = isSelected ? `${nodeStyle.shadow}66` : 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 8 / state.view.scale
  ctx.shadowOffsetY = 3 / state.view.scale

  ctx.fillStyle = isSelected ? nodeStyle.accent : isConnecting ? nodeStyle.shadow : isHovered ? lightenColor(nodeStyle.fill, 0.14) : nodeStyle.fill
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.strokeStyle = isSelected ? nodeStyle.shadow : nodeStyle.stroke
  ctx.lineWidth = (isSelected || isHovered ? 2 : 1) / state.view.scale
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.stroke()

  if (!isEditing) {
    ctx.fillStyle = isSelected ? '#fff' : nodeStyle.text
    ctx.font = `16px system-ui, sans-serif`
    const lines = n.text.split('\n')
    const lineHeight = 16 * 1.4
    const totalHeight = lines.length * lineHeight
    const startY = n.y + (n.height - totalHeight) / 2 + 16 * 0.8
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], n.x + 12, startY + i * lineHeight)
    }
    if (linkedPageForNode(n)) {
      const badgeText = '↗ Page'
      const badgeFont = 11 / state.view.scale
      ctx.font = `700 ${badgeFont}px system-ui, sans-serif`
      const badgeW = ctx.measureText(badgeText).width + 14 / state.view.scale
      const badgeH = 18 / state.view.scale
      const bx = n.x + n.width - badgeW - 8 / state.view.scale
      const by = n.y + 7 / state.view.scale
      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.22)' : `${nodeStyle.accent}22`
      roundRect(ctx, bx, by, badgeW, badgeH, 999 / state.view.scale)
      ctx.fill()
      ctx.fillStyle = isSelected ? '#fff' : nodeStyle.accent
      ctx.fillText(badgeText, bx + 7 / state.view.scale, by + 13 / state.view.scale)
    }
  }
}

function lightenColor(hex, amount = 0.12) {
  const value = String(hex || '#ffffff').replace('#', '')
  if (value.length !== 6) return hex || '#ffffff'
  const n = parseInt(value, 16)
  const r = Math.min(255, Math.round(((n >> 16) & 255) + 255 * amount))
  const g = Math.min(255, Math.round(((n >> 8) & 255) + 255 * amount))
  const b = Math.min(255, Math.round((n & 255) + 255 * amount))
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── In-place text editing ─────────────────────────────────────────────────────
let editInput = null
let editCommitting = false

let edgeEditInput = null
let edgeEditEdgeId = null

function startEdgeLabelEdit(edge, ax, ay, bx, by) {
  if (edgeEditInput) return
  edgeEditEdgeId = edge.id
  edgeEditInput = document.createElement('input')
  edgeEditInput.type = 'text'
  edgeEditInput.className = 'edge-edit-input'
  edgeEditInput.value = state.edgeLabels[edge.id] || ''
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2
  const screen = worldToScreen(mx, my)
  edgeEditInput.style.cssText = `
    position:fixed;
    left:${screen.x - 60}px;
    top:${screen.y - 12}px;
    width:120px;
    font-size:${12 * state.view.scale}px;
    font-family:system-ui,sans-serif;
    padding:4px 6px;
    box-sizing:border-box;
    border:2px solid #aa3bff;
    border-radius:4px;
    outline:none;
    background:#fff;
    color:#08060d;
    z-index:1000;
    text-align:center;
  `
  document.body.appendChild(edgeEditInput)
  edgeEditInput.focus()
  edgeEditInput.select()
  edgeEditInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdgeLabel()
    }
    if (e.key === 'Escape') {
      cancelEdgeLabel()
    }
  })
  edgeEditInput.addEventListener('blur', commitEdgeLabel)
  edgeEditInput.addEventListener('click', e => e.stopPropagation())
}

function commitEdgeLabel() {
  if (!edgeEditInput) return
  const input = edgeEditInput
  const edgeId = edgeEditEdgeId
  edgeEditInput = null
  edgeEditEdgeId = null
  const label = input.value.trim()
  if (edgeId !== null) {
    if (label) state.edgeLabels[edgeId] = label
    else delete state.edgeLabels[edgeId]
    historyCommit()
    save()
  }
  if (input.parentNode) input.remove()
  render()
}

function cancelEdgeLabel() {
  if (!edgeEditInput) return
  const input = edgeEditInput
  edgeEditInput = null
  edgeEditEdgeId = null
  if (input.parentNode) input.remove()
  render()
}

function startEditing(node) {
  state.editing = node.id
  state.editText = node.text
  render()
  setTimeout(() => {
    if (!editInput) {
      editInput = document.createElement('textarea')
      editInput.className = 'node-edit-input'
      document.body.appendChild(editInput)
    }
    const screen = worldToScreen(node.x, node.y)
    const scaledW = node.width * state.view.scale
    const scaledH = node.height * state.view.scale
    editInput.style.cssText = `
      position:fixed;
      left:${screen.x}px;
      top:${screen.y}px;
      width:${scaledW}px;
      height:${scaledH}px;
      font-size:${16 * state.view.scale}px;
      font-family:system-ui,sans-serif;
      padding:6px;
      box-sizing:border-box;
      border:2px solid #aa3bff;
      border-radius:${8 * state.view.scale}px;
      outline:none;
      resize:none;
      background:#fff;
      color:#08060d;
      z-index:1000;
    `
    editInput.value = node.text
    editInput.focus()
    editInput.select()

    editInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        commitEdit()
      }
      if (e.key === 'Escape') {
        cancelEdit()
      }
    })
    editInput.addEventListener('blur', commitEdit)
  }, 0)
}

function commitEdit() {
  if (!editInput || editCommitting) return
  editCommitting = true
  const node = state.nodes.find(n => n.id === state.editing)
  if (node) {
    const newText = editInput.value.trim() || 'Node'
    node.text = newText
    const size = measureText(newText)
    node.width = size.width
    node.height = size.height
  }
  const input = editInput
  editInput = null
  if (input.parentNode) input.remove()
  state.editing = null
  historyCommit()
  save()
  editCommitting = false
  render()
}

function cancelEdit() {
  if (!editInput || editCommitting) return
  const input = editInput
  editInput = null
  state.editing = null
  editCommitting = false
  if (input.parentNode) input.remove()
  render()
}


// ─── Node details panel ──────────────────────────────────────────────────────
function selectedNode() {
  if (state.selectedType !== 'node') return null
  return state.nodes.find(node => node.id === state.selected) || null
}

function ensureNodeDetails(node) {
  if (!node.details) node.details = { text: '', drawing: null, strokes: [] }
  if (typeof node.details.text !== 'string') node.details.text = ''
  if (!('drawing' in node.details)) node.details.drawing = null
  if (!Array.isArray(node.details.strokes)) node.details.strokes = []
  return node.details
}

function drawDetailsBackground() {
  detailsCtx.fillStyle = '#fff'
  detailsCtx.fillRect(0, 0, detailsDrawing.width, detailsDrawing.height)
}

function renderDetailsDrawing(node) {
  drawDetailsBackground()
  const drawing = ensureNodeDetails(node).drawing
  if (drawing) {
    const img = new Image()
    img.onload = () => {
      drawDetailsBackground()
      detailsCtx.drawImage(img, 0, 0, detailsDrawing.width, detailsDrawing.height)
    }
    img.src = drawing
  }
}


function linkedPageForNode(node) {
  const id = Number(node?.details?.linkedPageId)
  return Number.isFinite(id) ? state.notebook.pages.find(page => page.id === id) : null
}

function renderDetailsPageLinkOptions() {
  if (!detailsPageLink) return
  const selected = selectedNode()
  const currentPageId = state.notebook.activePageId
  const linkedPageId = selected?.details?.linkedPageId ? String(selected.details.linkedPageId) : ''
  detailsPageLink.innerHTML = ''
  const empty = document.createElement('option')
  empty.value = ''
  empty.textContent = 'No linked page'
  detailsPageLink.appendChild(empty)
  for (const page of state.notebook.pages) {
    if (page.id === currentPageId) continue
    const option = document.createElement('option')
    option.value = String(page.id)
    option.textContent = page.title
    detailsPageLink.appendChild(option)
  }
  detailsPageLink.value = linkedPageId
  detailsPageLink.disabled = !selected
  btnOpenLinkedPage.disabled = !selected || !linkedPageForNode(selected)
}

function setSelectedNodePageLink(pageId) {
  const node = selectedNode()
  if (!node) return
  ensureNodeDetails(node)
  if (pageId) node.details.linkedPageId = Number(pageId)
  else delete node.details.linkedPageId
  historyCommit()
  save()
  renderDetailsPageLinkOptions()
  render()
}

function targetViewForPage(page) {
  const view = page?.view ? { ...page.view } : { x: 0, y: 0, scale: 1 }
  return view
}

function viewCenteredOnNode(node, scale = 2.4) {
  return {
    x: canvas.width / 2 - (node.x + node.width / 2) * scale,
    y: canvas.height / 2 - (node.y + node.height / 2) * scale,
    scale,
  }
}

function animateViewTo(target, duration = 420) {
  const start = { ...state.view }
  const startTime = performance.now()
  canvas.classList.add('prezi-zooming')
  return new Promise(resolve => {
    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      state.view = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        scale: start.scale + (target.scale - start.scale) * eased,
      }
      render()
      if (t < 1) requestAnimationFrame(tick)
      else {
        state.view = { ...target }
        canvas.classList.remove('prezi-zooming')
        render()
        resolve()
      }
    }
    requestAnimationFrame(tick)
  })
}


function updateZoomBackButton() {
  if (!btnZoomBack) return
  btnZoomBack.disabled = state.zoomTrail.length === 0
  btnZoomBack.textContent = state.zoomTrail.length ? `↩ Zoom Out (${state.zoomTrail.length})` : '↩ Zoom Out'
}

function pushZoomTrailEntry(node) {
  state.zoomTrail.push({
    pageId: state.notebook.activePageId,
    view: { ...state.view },
    nodeId: node.id,
  })
  if (state.zoomTrail.length > 20) state.zoomTrail.shift()
  updateZoomBackButton()
}

async function zoomBackOut() {
  if (!state.zoomTrail.length) return false
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()
  hideDetails()

  const entry = state.zoomTrail.pop()
  updateZoomBackButton()
  await animateViewTo({ x: canvas.width / 2, y: canvas.height / 2, scale: 0.08 }, 360)

  const returnPage = state.notebook.pages.find(page => page.id === entry.pageId)
  if (!returnPage) {
    save()
    return false
  }

  switchPage(returnPage.id, { skipResize: true })
  const returnNode = state.nodes.find(node => node.id === entry.nodeId)
  if (returnNode) {
    state.view = viewCenteredOnNode(returnNode, 2.65)
    state.selected = returnNode.id
    state.selectedType = 'node'
  } else {
    state.view = { x: canvas.width / 2, y: canvas.height / 2, scale: 0.08 }
  }
  render()
  await animateViewTo(entry.view || targetViewForPage(returnPage), 520)
  state.selected = null
  state.selectedType = null
  save()
  renderPageTabs()
  render()
  return true
}

async function openLinkedPageFromNode(node) {
  const targetPage = linkedPageForNode(node)
  if (!targetPage || targetPage.id === state.notebook.activePageId) return false
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()
  pushZoomTrailEntry(node)
  hideDetails()
  state.selected = node.id
  state.selectedType = 'node'
  await animateViewTo(viewCenteredOnNode(node, 2.65), 360)
  const targetView = targetViewForPage(targetPage)
  switchPage(targetPage.id, { skipResize: true })
  state.view = { x: canvas.width / 2, y: canvas.height / 2, scale: 0.08 }
  render()
  await animateViewTo(targetView, 520)
  save()
  return true
}

function showDetailsForNode(node) {
  ensureNodeDetails(node)
  detailsPanel.classList.remove('hidden')
  detailsTitle.textContent = node.text || 'Node details'
  detailsText.value = node.details.text
  recognitionStatus.textContent = ''
  renderDetailsPageLinkOptions()
  renderDetailsDrawing(node)
  resize()
}

function hideDetails() {
  if (!detailsPanel.classList.contains('hidden')) persistDetailsText({ commitHistory: false })
  detailsPanel.classList.add('hidden')
  renderDetailsPageLinkOptions()
  resize()
}

function refreshDetailsPanel() {
  const node = selectedNode()
  if (node) showDetailsForNode(node)
  else hideDetails()
}

let detailsTextSaveTimer = null

function persistDetailsText({ commitHistory = true } = {}) {
  const node = selectedNode()
  if (!node) return
  ensureNodeDetails(node).text = detailsText.value
  if (commitHistory) historyCommit()
  save()
}

function scheduleDetailsTextSave() {
  const node = selectedNode()
  if (!node) return
  ensureNodeDetails(node).text = detailsText.value
  save()
  clearTimeout(detailsTextSaveTimer)
  detailsTextSaveTimer = setTimeout(() => persistDetailsText({ commitHistory: false }), 250)
}

function persistDetailsDrawing() {
  const node = selectedNode()
  if (!node) return
  ensureNodeDetails(node).drawing = detailsDrawing.toDataURL('image/png')
  historyCommit()
  save()
}

let drawingDetails = false
let lastDetailsPoint = null
let currentDetailsStroke = null
let detailsDrawMode = 'pen'

function setDetailsDrawMode(mode) {
  detailsDrawMode = mode
  btnDrawPen.classList.toggle('active', mode === 'pen')
  btnDrawEraser.classList.toggle('active', mode === 'eraser')
  detailsDrawing.classList.toggle('drawing-eraser', mode === 'eraser')
}

function detailsPoint(e) {
  const rect = detailsDrawing.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (detailsDrawing.width / rect.width),
    y: (e.clientY - rect.top) * (detailsDrawing.height / rect.height),
  }
}

function beginDetailsDrawing(e) {
  if (!selectedNode()) return
  e.preventDefault()
  detailsDrawing.setPointerCapture?.(e.pointerId)
  drawingDetails = true
  lastDetailsPoint = detailsPoint(e)
  currentDetailsStroke = detailsDrawMode === 'pen' ? [{ ...lastDetailsPoint, t: Date.now() }] : null
}

function moveDetailsDrawing(e) {
  if (!drawingDetails) return
  e.preventDefault()
  const point = detailsPoint(e)
  detailsCtx.save()
  if (detailsDrawMode === 'eraser') {
    detailsCtx.globalCompositeOperation = 'destination-out'
    detailsCtx.strokeStyle = 'rgba(0,0,0,1)'
    detailsCtx.lineWidth = 18
  } else {
    detailsCtx.globalCompositeOperation = 'source-over'
    detailsCtx.strokeStyle = '#08060d'
    detailsCtx.lineWidth = 3
  }
  detailsCtx.lineCap = 'round'
  detailsCtx.lineJoin = 'round'
  detailsCtx.beginPath()
  detailsCtx.moveTo(lastDetailsPoint.x, lastDetailsPoint.y)
  detailsCtx.lineTo(point.x, point.y)
  detailsCtx.stroke()
  detailsCtx.restore()
  currentDetailsStroke?.push({ ...point, t: Date.now() })
  lastDetailsPoint = point
}

function endDetailsDrawing(e) {
  if (!drawingDetails) return
  detailsDrawing.releasePointerCapture?.(e.pointerId)
  drawingDetails = false
  const node = selectedNode()
  if (node && currentDetailsStroke?.length) ensureNodeDetails(node).strokes.push(currentDetailsStroke)
  if (node && detailsDrawMode === 'eraser') ensureNodeDetails(node).strokes = []
  currentDetailsStroke = null
  lastDetailsPoint = null
  persistDetailsDrawing()
}


function strokeBounds(points) {
  const xs = points.map(point => point.x)
  const ys = points.map(point => point.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const right = Math.max(...xs)
  const bottom = Math.max(...ys)
  return { left, top, width: right - left, height: bottom - top }
}

function makeHandwritingStroke(points) {
  const stroke = {
    points: points.map(point => ({ x: point.x, y: point.y, t: point.t })),
    getBoundingBox: () => strokeBounds(points),
  }
  return stroke
}

function bestPredictionText(predictions) {
  const first = predictions?.[0]
  if (!first) return ''
  if (typeof first === 'string') return first
  return first.text || first.label || first.prediction || first.candidates?.[0]?.text || ''
}

async function recognizeHandwritingFromStrokes(strokes) {
  if (window.mindMappRecognizeHandwriting) return window.mindMappRecognizeHandwriting(strokes)

  const image = detailsDrawing.toDataURL('image/png')
  try {
    const response = await fetch('/api/recognize-handwriting', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image, strokes }),
    })
    if (response.ok) {
      const data = await response.json()
      const text = String(data.text || '').trim()
      if (text) return text
      throw new Error('No handwriting text recognized.')
    }
    if (response.status !== 404 && response.status !== 405) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Handwriting recognition service failed.')
    }
  } catch (error) {
    if (error.message && !error.message.includes('Failed to fetch')) throw error
  }

  if (!navigator.createHandwritingRecognizer) {
    throw new Error('Handwriting recognition is not available in this browser, and the Ollama recognition service is not reachable.')
  }

  const recognizer = await navigator.createHandwritingRecognizer({ languages: ['en'] })
  const drawing = await recognizer.startDrawing({ hints: { recognitionType: 'text' } })
  for (const stroke of strokes) drawing.addStroke(makeHandwritingStroke(stroke))
  const predictions = await drawing.getPrediction()
  recognizer.finish?.()
  const text = bestPredictionText(predictions)
  if (!text) throw new Error('No handwriting text recognized.')
  return text
}

async function recognizeHandwriting() {
  const node = selectedNode()
  if (!node) return
  const details = ensureNodeDetails(node)
  if (!details.strokes.length) {
    recognitionStatus.textContent = 'Draw something first, then recognize.'
    return
  }

  btnRecognizeHandwriting.disabled = true
  recognitionStatus.textContent = 'Recognizing handwriting…'
  try {
    const text = (await recognizeHandwritingFromStrokes(details.strokes)).trim()
    if (!text) throw new Error('No handwriting text recognized.')
    const prefix = detailsText.value.trim() ? `${detailsText.value.trim()}\n` : ''
    detailsText.value = `${prefix}${text}`
    persistDetailsText({ commitHistory: true })
    recognitionStatus.textContent = `Recognized: “${text}”`
  } catch (error) {
    recognitionStatus.textContent = error.message || 'Handwriting recognition failed.'
  } finally {
    btnRecognizeHandwriting.disabled = false
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────
let lastMouse = { x: 0, y: 0 }
let mouseState = { down: false, clickTime: 0, clickX: 0, clickY: 0 }
const activePointers = new Map()
let pinchStart = null

function pointerCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function updatePointer(e) {
  activePointers.set(e.pointerId, pointerCanvasPoint(e))
}

function pinchMetrics() {
  const points = [...activePointers.values()]
  if (points.length < 2) return null
  const [a, b] = points
  return {
    cx: (a.x + b.x) / 2,
    cy: (a.y + b.y) / 2,
    dist: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
  }
}

function startPinch() {
  const metrics = pinchMetrics()
  if (!metrics) return
  state.dragging = null
  state.panning = false
  pinchStart = {
    ...metrics,
    viewX: state.view.x,
    viewY: state.view.y,
    scale: state.view.scale,
  }
}

function applyPinchZoom() {
  if (!pinchStart) return
  const metrics = pinchMetrics()
  if (!metrics) return
  const worldAtStart = {
    x: (pinchStart.cx - pinchStart.viewX) / pinchStart.scale,
    y: (pinchStart.cy - pinchStart.viewY) / pinchStart.scale,
  }
  const newScale = Math.max(0.1, Math.min(5, pinchStart.scale * (metrics.dist / pinchStart.dist)))
  state.view.scale = newScale
  state.view.x = metrics.cx - worldAtStart.x * newScale
  state.view.y = metrics.cy - worldAtStart.y * newScale
}

canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0) return
  e.preventDefault()
  canvas.setPointerCapture?.(e.pointerId)
  updatePointer(e)

  if (activePointers.size >= 2) {
    startPinch()
    render()
    return
  }

  const { x: mx, y: my } = pointerCanvasPoint(e)

  if (state.eraserMode) {
    eraseAt(mx, my)
    return
  }

  mouseState = { down: true, clickTime: Date.now(), clickX: mx, clickY: my }
  lastMouse = { x: mx, y: my }

  if (state.editing) { commitEdit(); return }

  const node = nodeAt(mx, my)
  if (node) {
    if (state.selected !== node.id || state.selectedType !== 'node') persistDetailsText({ commitHistory: false })
    state.selected = node.id
    state.selectedType = 'node'
    showDetailsForNode(node)
    if (state.connecting && state.connecting !== node.id) {
      const id = ++state.lastEdgeId
      state.edges.push({ id, from: state.connecting, to: node.id })
      state.connecting = null
      btnConnect.classList.remove('active')
      historyCommit()
      save()
    } else {
      const world = screenToWorld(mx, my)
      state.dragging = { id: node.id, offsetX: world.x - node.x, offsetY: world.y - node.y }
    }
  } else {
    const edge = edgeAt(mx, my)
    if (edge) {
      state.selected = edge.id
      state.selectedType = 'edge'
      state.connecting = null
      hideDetails()
    } else {
      state.selected = null
      state.selectedType = null
      state.connecting = null
      hideDetails()
      btnConnect.classList.remove('active')
      state.panning = true
      state.panStart = { x: mx - state.view.x, y: my - state.view.y }
    }
  }
  render()
})

canvas.addEventListener('pointermove', e => {
  if (activePointers.has(e.pointerId)) updatePointer(e)
  const { x: mx, y: my } = pointerCanvasPoint(e)
  lastMouse = { x: mx, y: my }

  if (pinchStart && activePointers.size >= 2) {
    applyPinchZoom()
  } else if (state.dragging) {
    const node = state.nodes.find(n => n.id === state.dragging.id)
    if (node) {
      const world = screenToWorld(mx, my)
      node.x = world.x - state.dragging.offsetX
      node.y = world.y - state.dragging.offsetY
    }
  } else if (state.panning) {
    state.view.x = mx - state.panStart.x
    state.view.y = my - state.panStart.y
  }

  state.hoveredNode = nodeAt(mx, my)?.id ?? null
  state.hoveredEdge = edgeAt(mx, my)?.id ?? null
  render()
})

canvas.addEventListener('pointerup', e => {
  canvas.releasePointerCapture?.(e.pointerId)
  activePointers.delete(e.pointerId)
  if (pinchStart) {
    pinchStart = null
    if (activePointers.size >= 2) startPinch()
  }
  if (state.dragging) {
    historyCommit()
  }
  save()
  state.dragging = null
  state.panning = false
  mouseState.down = false
  render()
})

canvas.addEventListener('pointercancel', e => {
  canvas.releasePointerCapture?.(e.pointerId)
  activePointers.delete(e.pointerId)
  pinchStart = null
  state.dragging = null
  state.panning = false
  mouseState.down = false
  render()
})

canvas.addEventListener('dblclick', e => {
  if (state.editing || edgeEditInput) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const world = screenToWorld(mx, my)

  const existing = nodeAt(mx, my)
  if (existing) {
    if (linkedPageForNode(existing)) {
      openLinkedPageFromNode(existing)
      return
    }
    startEditing(existing)
  } else {
    const edge = edgeAt(mx, my)
    if (edge) {
      const from = state.nodes.find(n => n.id === fromId(edge))
      const to = state.nodes.find(n => n.id === toId(edge))
      if (from && to) {
        const [ax, ay, bx, by] = endpoints(from, to)
        setTimeout(() => startEdgeLabelEdit(edge, ax, ay, bx, by), 10)
      }
      return
    }

    const node = newNode(world.x, world.y)
    state.nodes.push(node)
    state.selected = node.id
    state.selectedType = 'node'
    showDetailsForNode(node)
    historyCommit()
    save()
    render()
    setTimeout(() => startEditing(node), 50)
  }
})

canvas.addEventListener('wheel', e => {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, state.view.scale * delta))
  state.view.x = mx - (mx - state.view.x) * (newScale / state.view.scale)
  state.view.y = my - (my - state.view.y) * (newScale / state.view.scale)
  state.view.scale = newScale
  save()
  render()
}, { passive: false })

// Keyboard
document.addEventListener('keydown', e => {
  if (state.editing) return

  // Undo: Ctrl+Z / Cmd+Z
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    historyUndo()
    return
  }
  // Redo: Ctrl+Y or Ctrl+Shift+Z
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    historyRedo()
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelected()
  }
  if (e.key === 'Escape') {
    state.selected = null
    state.selectedType = null
    state.connecting = null
    hideDetails()
    setEraserMode(false)
    btnConnect.classList.remove('active')
    render()
  }
  if (e.key === 'a' || e.key === 'A') {
    const cx = canvas.width / 2, cy = canvas.height / 2
    const world = screenToWorld(cx, cy)
    const node = newNode(world.x, world.y)
    state.nodes.push(node)
    state.selected = node.id
    state.selectedType = 'node'
    historyCommit()
    save()
    render()
    setTimeout(() => startEditing(node), 50)
  }
  if (e.key === 'c' || e.key === 'C') {
    setEraserMode(false)
    if (state.connecting) {
      state.connecting = null
      btnConnect.classList.remove('active')
    } else if (state.selected !== null) {
      state.connecting = state.selected
      btnConnect.classList.add('active')
    }
    render()
  }
  if (e.key === 'e' || e.key === 'E') {
    exportPNG()
  }
  if (e.key === 'f' || e.key === 'F') {
    fitToContent()
  }
  if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'b' || e.key === 'B') {
    if (state.zoomTrail.length) {
      e.preventDefault()
      zoomBackOut()
    }
  }
})

// Buttons
detailsText.addEventListener('input', scheduleDetailsTextSave)
detailsText.addEventListener('change', () => persistDetailsText({ commitHistory: false }))
detailsText.addEventListener('blur', () => persistDetailsText({ commitHistory: false }))
detailsPageLink.addEventListener('change', () => setSelectedNodePageLink(detailsPageLink.value))
btnOpenLinkedPage.addEventListener('click', () => { const node = selectedNode(); if (node) openLinkedPageFromNode(node) })
btnCloseDetails.addEventListener('click', () => { state.selected = null; state.selectedType = null; hideDetails(); render() })
btnDrawPen.addEventListener('click', () => setDetailsDrawMode('pen'))
btnDrawEraser.addEventListener('click', () => setDetailsDrawMode('eraser'))
btnClearDrawing.addEventListener('click', () => {
  const node = selectedNode()
  if (node) {
    const details = ensureNodeDetails(node)
    details.strokes = []
    details.drawing = null
  }
  drawDetailsBackground()
  recognitionStatus.textContent = ''
  persistDetailsDrawing()
})
btnRecognizeHandwriting.addEventListener('click', recognizeHandwriting)
detailsDrawing.addEventListener('pointerdown', beginDetailsDrawing)
detailsDrawing.addEventListener('pointermove', moveDetailsDrawing)
detailsDrawing.addEventListener('pointerup', endDetailsDrawing)
detailsDrawing.addEventListener('pointercancel', endDetailsDrawing)

pageSelect.addEventListener('change', () => switchPage(Number(pageSelect.value)))
btnNewPage.addEventListener('click', addNotebookPage)
btnDeletePage.addEventListener('click', deleteCurrentPage)
btnZoomBack.addEventListener('click', zoomBackOut)
btnProjectKanban.addEventListener('click', applyProjectKanbanToNewPage)
btnImportTrello.addEventListener('click', () => trelloFileInput.click())
trelloFileInput.addEventListener('change', () => importTrelloFile(trelloFileInput.files?.[0]))
btnImportObsidian.addEventListener('click', () => obsidianFileInput.click())
obsidianFileInput.addEventListener('change', () => importObsidianKanbanFile(obsidianFileInput.files?.[0]))
btnTemplates.addEventListener('click', openTemplateModal)
btnColorful.addEventListener('click', makeMapColorful)
btnAiKanban.addEventListener('click', organizeCurrentPageAsAiKanban)
btnCloseTemplates.addEventListener('click', closeTemplateModal)
templateModal.addEventListener('click', e => { if (e.target === templateModal) closeTemplateModal() })
btnTemplateApplySelected.addEventListener('click', () => {
  const template = activeTemplate()
  if (applyTemplateToNodes(template, selectedNodesForTemplate())) setTemplateStatus(`Applied ${template.name} to selected node.`)
  else setTemplateStatus('Select a node first, or use Apply to All.')
})
btnTemplateApplyAll.addEventListener('click', () => {
  const template = activeTemplate()
  if (applyTemplateToNodes(template, state.nodes)) setTemplateStatus(`Applied ${template.name} to every node on this page.`)
  else setTemplateStatus('This page has no nodes yet.')
})
btnTemplateSaveSelected.addEventListener('click', saveSelectedNodeAsTemplate)
btnTemplateExport.addEventListener('click', exportTemplates)
btnTemplateImport.addEventListener('click', () => templateFileInput.click())
templateFileInput.addEventListener('change', () => importTemplateFile(templateFileInput.files?.[0]))

btnDelete.addEventListener('click', deleteSelected)
btnEraser.addEventListener('click', () => setEraserMode(!state.eraserMode))

btnAdd.addEventListener('click', () => {
  btnAdd.blur()
  setEraserMode(false)
  const cx = canvas.width / 2, cy = canvas.height / 2
  const world = screenToWorld(cx, cy)
  const node = newNode(world.x, world.y)
  state.nodes.push(node)
  state.selected = node.id
  state.selectedType = 'node'
  showDetailsForNode(node)
  historyCommit()
  save()
  render()
  setTimeout(() => startEditing(node), 50)
})

btnConnect.addEventListener('click', () => {
  setEraserMode(false)
  if (state.connecting) {
    state.connecting = null
    btnConnect.classList.remove('active')
  } else if (state.selectedType === 'node' && state.selected !== null) {
    state.connecting = state.selected
    btnConnect.classList.add('active')
  }
  render()
})

btnExport.addEventListener('click', exportPNG)
btnExportTrello.addEventListener('click', exportCurrentPageAsTrelloJson)
btnExportObsidian.addEventListener('click', exportCurrentPageAsObsidianMarkdown)
btnFit.addEventListener('click', fitToContent)

btnUndo.addEventListener('click', () => {
  if (state.editing) return
  historyUndo()
})

btnRedo.addEventListener('click', () => {
  if (state.editing) return
  historyRedo()
})


function contentBounds(pad = 80) {
  if (state.nodes.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of state.nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

function fitToContent() {
  const bounds = contentBounds()
  if (!bounds) return
  const worldW = Math.max(1, bounds.maxX - bounds.minX)
  const worldH = Math.max(1, bounds.maxY - bounds.minY)
  const scale = Math.max(0.1, Math.min(5, Math.min(canvas.width / worldW, canvas.height / worldH)))
  state.view.scale = scale
  state.view.x = (canvas.width - worldW * scale) / 2 - bounds.minX * scale
  state.view.y = (canvas.height - worldH * scale) / 2 - bounds.minY * scale
  save()
  render()
}


function slugifyFileName(value, fallback = 'mind-mapp') {
  return compactText(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function childrenByParent() {
  const children = new Map()
  for (const node of state.nodes) children.set(node.id, [])
  for (const edge of state.edges) {
    const from = fromId(edge)
    const to = toId(edge)
    if (children.has(from) && state.nodes.some(node => node.id === to)) children.get(from).push(to)
  }
  for (const ids of children.values()) {
    ids.sort((a, b) => {
      const na = state.nodes.find(node => node.id === a)
      const nb = state.nodes.find(node => node.id === b)
      return (na?.y ?? 0) - (nb?.y ?? 0) || (na?.x ?? 0) - (nb?.x ?? 0)
    })
  }
  return children
}

function rootNodeForExport() {
  if (!state.nodes.length) return null
  const incoming = new Set(state.edges.map(edge => toId(edge)))
  const roots = state.nodes.filter(node => !incoming.has(node.id))
  roots.sort((a, b) => a.y - b.y || a.x - b.x)
  return roots[0] || state.nodes[0]
}

function trelloId(prefix, number) {
  return `${prefix}${String(number).padStart(20, '0')}`.slice(-24)
}

function nodeDetailsText(node) {
  return node?.details?.text || ''
}

function exportCurrentPageToTrelloBoard() {
  const root = rootNodeForExport()
  const page = activePage()
  const boardId = trelloId('board', page?.id || 1)
  const boardName = root?.text || page?.title || 'Mind Mapp Export'
  const children = childrenByParent()
  const lists = []
  const cards = []
  const checklists = []
  const rootChildren = root ? (children.get(root.id) || []) : []
  const listNodeIds = rootChildren.length ? rootChildren : []

  function addCard(node, listId, pos, parentChecklistId = null) {
    const cardId = trelloId('card', node.id)
    const descParts = [nodeDetailsText(node)]
    if (parentChecklistId) descParts.push(`Source parent checklist: ${parentChecklistId}`)
    cards.push({
      id: cardId,
      name: compactText(node.text) || 'Untitled Card',
      desc: descParts.filter(Boolean).join('\n\n'),
      idBoard: boardId,
      idList: listId,
      pos,
      closed: false,
      labels: [],
      idLabels: [],
      due: null,
      url: '',
      shortUrl: '',
    })
    const childIds = children.get(node.id) || []
    if (childIds.length) {
      const checklistId = trelloId('check', node.id)
      checklists.push({
        id: checklistId,
        name: 'Subtasks',
        idBoard: boardId,
        idCard: cardId,
        pos: 16384,
        checkItems: childIds.map((childId, index) => {
          const child = state.nodes.find(n => n.id === childId)
          return {
            id: trelloId('item', childId),
            name: compactText(child?.text) || 'Untitled Item',
            nameData: null,
            pos: (index + 1) * 16384,
            state: 'incomplete',
            due: null,
            idMember: null,
          }
        }),
      })
    }
  }

  if (!listNodeIds.length) {
    const listId = trelloId('list', 1)
    lists.push({ id: listId, name: 'Mind Map', closed: false, idBoard: boardId, pos: 16384 })
    state.nodes.forEach((node, index) => addCard(node, listId, (index + 1) * 16384))
  } else {
    listNodeIds.forEach((listNodeId, listIndex) => {
      const listNode = state.nodes.find(node => node.id === listNodeId)
      if (!listNode) return
      const listId = trelloId('list', listNode.id)
      lists.push({ id: listId, name: compactText(listNode.text) || `List ${listIndex + 1}`, closed: false, idBoard: boardId, pos: (listIndex + 1) * 16384 })
      const cardIds = children.get(listNode.id) || []
      if (cardIds.length) {
        cardIds.forEach((cardId, cardIndex) => {
          const cardNode = state.nodes.find(node => node.id === cardId)
          if (cardNode) addCard(cardNode, listId, (cardIndex + 1) * 16384)
        })
      } else {
        addCard(listNode, listId, 16384)
      }
    })
  }

  return {
    id: boardId,
    name: boardName,
    desc: `Exported from Mind Mapp page: ${page?.title || boardName}`,
    closed: false,
    url: '',
    shortUrl: '',
    labelNames: {},
    lists,
    cards,
    checklists,
    labels: [],
  }
}


function nodeSummaryForAi(node) {
  const parentLabels = state.edges.filter(edge => toId(edge) === node.id).map(edge => {
    const parent = state.nodes.find(candidate => candidate.id === fromId(edge))
    return parent?.text || ''
  }).filter(Boolean)
  const childLabels = state.edges.filter(edge => fromId(edge) === node.id).map(edge => {
    const child = state.nodes.find(candidate => candidate.id === toId(edge))
    return child?.text || ''
  }).filter(Boolean)
  return {
    id: node.id,
    title: compactText(node.text) || 'Untitled node',
    details: nodeDetailsText(node),
    parents: parentLabels,
    children: childLabels,
  }
}

function statusForKanbanText(text) {
  const normalized = normalizeConceptText(text)
  if (/\b(done|complete|completed|shipped|closed|resolved|finished)\b/.test(normalized)) return 'Done'
  if (/\b(blocked|risk|issue|bug|broken|fail|failed|failure|stuck|waiting|depends|timeout)\b/.test(normalized)) return 'Blocked / Risk'
  if (/\b(active|now|doing|progress|current|execution|building|implement|working)\b/.test(normalized)) return 'In Progress'
  return 'To Do'
}

function localKanbanPlanFromCurrentPage() {
  const root = rootNodeForExport()
  const columns = ['To Do', 'In Progress', 'Blocked / Risk', 'Done'].map(title => ({ title, items: [] }))
  const columnByTitle = new Map(columns.map(column => [column.title, column]))
  const roots = new Set([root?.id].filter(Boolean))
  for (const node of state.nodes) {
    if (roots.has(node.id) && state.nodes.length > 1) continue
    const details = [nodeDetailsText(node), nodeSummaryForAi(node).parents.length ? `From: ${nodeSummaryForAi(node).parents.join(' → ')}` : '']
      .filter(Boolean)
      .join('\n')
    const text = `${node.text || ''} ${details}`
    columnByTitle.get(statusForKanbanText(text)).items.push({ title: compactText(node.text) || 'Untitled card', details })
  }
  return {
    title: `AI Kanban: ${root?.text || activePage()?.title || 'Mind Map'}`,
    columns: columns.filter(column => column.items.length),
    provider: 'local heuristic',
  }
}

function sanitizeKanbanPlan(plan) {
  const fallback = localKanbanPlanFromCurrentPage()
  const columns = Array.isArray(plan?.columns) ? plan.columns : []
  const cleanColumns = columns.map(column => ({
    title: compactText(column?.title) || 'To Do',
    items: (Array.isArray(column?.items) ? column.items : [])
      .map(item => ({
        title: compactText(item?.title || item?.name || item) || 'Untitled card',
        details: compactText(item?.details || item?.description || item?.concept || ''),
      }))
      .filter(item => item.title),
  })).filter(column => column.items.length)
  return {
    title: compactText(plan?.title) || fallback.title,
    columns: cleanColumns.length ? cleanColumns : fallback.columns,
    provider: compactText(plan?.provider) || fallback.provider,
  }
}

function buildAiKanbanPage(page, plan) {
  const parsed = sanitizeKanbanPlan(plan)
  buildObsidianKanbanPage(page, parsed)
  page.title = parsed.title
  page.aiKanbanVersion = 1
  page.aiKanbanProvider = parsed.provider
  const root = page.nodes[0]
  if (root) root.details.text = `Organized as Kanban by ${parsed.provider}.\n\nSource page: ${activePage()?.title || 'Mind Map'}`
  colorizePage(page)
}

async function requestAiKanbanPlan() {
  const payload = {
    title: activePage()?.title || rootNodeForExport()?.text || 'Mind Map',
    nodes: state.nodes.map(nodeSummaryForAi),
    edges: state.edges.map(edge => ({ from: fromId(edge), to: toId(edge), label: state.edgeLabels?.[edge.id] || '' })),
  }
  try {
    const response = await fetch('/api/organize-kanban', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return sanitizeKanbanPlan(await response.json())
  } catch {
    return localKanbanPlanFromCurrentPage()
  }
}

async function organizeCurrentPageAsAiKanban() {
  if (!state.nodes.length) {
    window.alert('Add or import a mind map first, then AI Kanban can organize it.')
    return false
  }
  persistDetailsText({ commitHistory: false })
  if (state.editing) commitEdit()
  if (edgeEditInput) commitEdgeLabel()
  syncCurrentPage()
  const originalText = btnAiKanban.textContent
  btnAiKanban.disabled = true
  btnAiKanban.textContent = 'Organizing…'
  try {
    const plan = await requestAiKanbanPlan()
    const page = createPage(plan.title)
    buildAiKanbanPage(page, plan)
    state.notebook.pages.push(page)
    state.notebook.activePageId = page.id
    loadPageIntoState(page)
    hideDetails()
    resetHistoryForCurrentPage()
    save()
    renderPageTabs()
    resize()
    return true
  } catch (error) {
    window.alert(`Could not organize Kanban: ${error.message}`)
    return false
  } finally {
    btnAiKanban.disabled = false
    btnAiKanban.textContent = originalText
  }
}

function exportCurrentPageAsTrelloJson() {
  persistDetailsText({ commitHistory: false })
  syncCurrentPage()
  const board = exportCurrentPageToTrelloBoard()
  downloadTextFile(`${slugifyFileName(board.name)}-trello.json`, JSON.stringify(board, null, 2), 'application/json')
}

function escapeMarkdown(text) {
  return String(text || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function exportCurrentPageToObsidianMarkdown() {
  const root = rootNodeForExport()
  const page = activePage()
  const children = childrenByParent()
  const title = root?.text || page?.title || 'Mind Mapp Export'
  const lines = [`# ${escapeMarkdown(title)}`, '', `_Exported from Mind Mapp._`, '']
  const rootChildren = root ? (children.get(root.id) || []) : []
  const sections = rootChildren.length ? rootChildren : []

  function writeCard(node, indent = '') {
    lines.push(`${indent}- [ ] ${escapeMarkdown(node.text) || 'Untitled Card'}`)
    const details = escapeMarkdown(nodeDetailsText(node))
    if (details) {
      for (const detailLine of details.split('\n')) lines.push(`${indent}  > ${detailLine}`)
    }
    for (const childId of children.get(node.id) || []) {
      const child = state.nodes.find(n => n.id === childId)
      if (child) writeCard(child, `${indent}  `)
    }
  }

  if (!sections.length) {
    lines.push('## Mind Map', '')
    state.nodes.forEach(node => writeCard(node))
  } else {
    for (const sectionId of sections) {
      const section = state.nodes.find(node => node.id === sectionId)
      if (!section) continue
      lines.push(`## ${escapeMarkdown(section.text) || 'List'}`, '')
      const cards = children.get(section.id) || []
      if (cards.length) {
        cards.forEach(cardId => {
          const card = state.nodes.find(node => node.id === cardId)
          if (card) writeCard(card)
        })
      } else {
        writeCard(section)
      }
      lines.push('')
    }
  }
  return lines.join('\n').replace(/\n{4,}/g, '\n\n\n')
}

function exportCurrentPageAsObsidianMarkdown() {
  persistDetailsText({ commitHistory: false })
  syncCurrentPage()
  const page = activePage()
  const title = rootNodeForExport()?.text || page?.title || 'mind-mapp'
  downloadTextFile(`${slugifyFileName(title)}-obsidian-kanban.md`, exportCurrentPageToObsidianMarkdown(), 'text/markdown')
}

function exportPNG() {
  const savedView = { ...state.view }
  state.view = { x: 0, y: 0, scale: 1 }

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.fillStyle = '#fff'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

  renderScene(tempCtx)

  state.view = savedView

  const link = document.createElement('a')
  link.download = 'mind-mapp.png'
  link.href = tempCanvas.toDataURL('image/png')
  link.click()
  render()
}

// ─── Minimap ───────────────────────────────────────────────────────────────────
const MINIMAP_W = 180
const MINIMAP_H = 120

function minimapResize() {
  minimapCanvas.width = MINIMAP_W
  minimapCanvas.height = MINIMAP_H
}
minimapResize()

function minimapMetrics() {
  if (state.nodes.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of state.nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  }

  const pad = 40
  minX -= pad; minY -= pad; maxX += pad; maxY += pad
  const worldW = maxX - minX || 1
  const worldH = maxY - minY || 1
  const scaleX = MINIMAP_W / worldW
  const scaleY = MINIMAP_H / worldH
  const scale = Math.min(scaleX, scaleY, 1)
  const offsetX = (MINIMAP_W - worldW * scale) / 2
  const offsetY = (MINIMAP_H - worldH * scale) / 2

  return { minX, minY, scale, offsetX, offsetY }
}

function worldToMinimap(x, y, metrics) {
  return {
    x: (x - metrics.minX) * metrics.scale + metrics.offsetX,
    y: (y - metrics.minY) * metrics.scale + metrics.offsetY,
  }
}

function minimapToWorld(x, y, metrics) {
  return {
    x: (x - metrics.offsetX) / metrics.scale + metrics.minX,
    y: (y - metrics.offsetY) / metrics.scale + metrics.minY,
  }
}

minimapCanvas.addEventListener('click', e => {
  const metrics = minimapMetrics()
  if (!metrics) return

  const rect = minimapCanvas.getBoundingClientRect()
  const world = minimapToWorld(e.clientX - rect.left, e.clientY - rect.top, metrics)
  state.view.x = canvas.width / 2 - world.x * state.view.scale
  state.view.y = canvas.height / 2 - world.y * state.view.scale
  save()
  render()
})

function drawMinimap() {
  mctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
  mctx.fillStyle = '#f8f7f4'
  mctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

  const metrics = minimapMetrics()
  if (!metrics) return

  mctx.strokeStyle = '#c4bfcc'
  mctx.lineWidth = 1
  for (const e of state.edges) {
    const from = state.nodes.find(n => n.id === fromId(e))
    const to = state.nodes.find(n => n.id === toId(e))
    if (!from || !to) continue
    const [ax, ay, bx, by] = endpoints(from, to)
    mctx.beginPath()
    const a = worldToMinimap(ax, ay, metrics)
    const b = worldToMinimap(bx, by, metrics)
    mctx.moveTo(a.x, a.y)
    mctx.lineTo(b.x, b.y)
    mctx.stroke()
  }

  for (const n of state.nodes) {
    const isSelected = state.selectedType === 'node' && state.selected === n.id
    mctx.fillStyle = isSelected ? '#aa3bff' : '#fff'
    mctx.strokeStyle = isSelected ? '#7c2db8' : '#c4bfcc'
    mctx.lineWidth = 1
    const pos = worldToMinimap(n.x, n.y, metrics)
    mctx.fillRect(pos.x, pos.y, n.width * metrics.scale, n.height * metrics.scale)
    mctx.strokeRect(pos.x, pos.y, n.width * metrics.scale, n.height * metrics.scale)
  }

  const viewport = worldToMinimap(-state.view.x / state.view.scale, -state.view.y / state.view.scale, metrics)
  const vpX = viewport.x
  const vpY = viewport.y
  const vpW = (canvas.width / state.view.scale) * metrics.scale
  const vpH = (canvas.height / state.view.scale) * metrics.scale
  mctx.strokeStyle = '#aa3bff'
  mctx.lineWidth = 1.5
  mctx.strokeRect(vpX, vpY, vpW, vpH)
}

// ─── Render wrapper ────────────────────────────────────────────────────────────
function render() {
  requestAnimationFrame(draw)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
load()
renderPageTabs()
updateZoomBackButton()
// Initialize history after load
historyPush()

if (state.nodes.length === 0) {
  const center = screenToWorld(canvas.width / 2, canvas.height / 2)
  state.nodes.push(newNode(center.x, center.y, activePage()?.title || 'Mind Map'))
  historyCommit()
  save()
}
render()

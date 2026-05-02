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
  notebook: { pages: [], activePageId: null, lastPageId: 0 },
}

const STORAGE_KEY = 'mind-mapp-v1'

// ─── Notebook pages ──────────────────────────────────────────────────────────
function createPage(title = null) {
  const id = ++state.notebook.lastPageId
  return { id, title: title || `Page ${id}`, nodes: [], edges: [], lastId: 0, lastEdgeId: 0, edgeLabels: {}, view: { x: 0, y: 0, scale: 1 } }
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
}

function switchPage(pageId) {
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
  resize()
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
  </span>
  <button id="btn-add" title="Add node (A)">+ Node</button>
  <button id="btn-connect" title="Connect mode (C)">⬌ Connect</button>
  <button id="btn-export" title="Export PNG (E)">📷 Export</button>
  <button id="btn-fit" title="Fit view (F)">⛶ Fit</button>
  <span id="undo-redo-btns">
    <button id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
    <button id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
  </span>
  <span class="toolbar-hint">Double-click canvas to add node. Double-click node to edit. Drag to move.</span>
  <div id="minimap-container"><canvas id="minimap"></canvas></div>
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
    <div class="details-draw-header">
      <span class="details-label">Drawing</span>
      <button id="btn-clear-drawing" title="Clear drawing">Clear</button>
    </div>
    <canvas id="details-drawing" width="320" height="220"></canvas>
  </aside>
</div>
`

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const minimapCanvas = document.getElementById('minimap')
const mctx = minimapCanvas.getContext('2d')
const pageSelect = document.getElementById('page-select')
const btnNewPage = document.getElementById('btn-new-page')
const btnAdd = document.getElementById('btn-add')
const btnConnect = document.getElementById('btn-connect')
const btnExport = document.getElementById('btn-export')
const btnFit = document.getElementById('btn-fit')
const btnUndo = document.getElementById('btn-undo')
const btnRedo = document.getElementById('btn-redo')
const detailsPanel = document.getElementById('details-panel')
const detailsTitle = document.getElementById('details-title')
const detailsText = document.getElementById('details-text')
const detailsDrawing = document.getElementById('details-drawing')
const detailsCtx = detailsDrawing.getContext('2d')
const btnCloseDetails = document.getElementById('btn-close-details')
const btnClearDrawing = document.getElementById('btn-clear-drawing')


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
    details: { text: '', drawing: null },
  }
}

function save() {
  syncCurrentPage()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 2,
    notebook: state.notebook,
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
  drawEdgeLine(ctx, ax, ay, bx, by, isHovered ? '#aa3bff' : '#6b6375', false, isHovered, label)
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

  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 8 / state.view.scale
  ctx.shadowOffsetY = 3 / state.view.scale

  ctx.fillStyle = isSelected ? '#aa3bff' : isConnecting ? '#c084fc' : isHovered ? '#f4f3ec' : '#fff'
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  ctx.strokeStyle = isSelected ? '#7c2db8' : '#e5e4e7'
  ctx.lineWidth = (isSelected || isHovered ? 2 : 1) / state.view.scale
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.stroke()

  if (!isEditing) {
    ctx.fillStyle = isSelected ? '#fff' : '#08060d'
    ctx.font = `16px system-ui, sans-serif`
    const lines = n.text.split('\n')
    const lineHeight = 16 * 1.4
    const totalHeight = lines.length * lineHeight
    const startY = n.y + (n.height - totalHeight) / 2 + 16 * 0.8
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], n.x + 12, startY + i * lineHeight)
    }
  }
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
  if (!node.details) node.details = { text: '', drawing: null }
  if (typeof node.details.text !== 'string') node.details.text = ''
  if (!('drawing' in node.details)) node.details.drawing = null
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

function showDetailsForNode(node) {
  ensureNodeDetails(node)
  detailsPanel.classList.remove('hidden')
  detailsTitle.textContent = node.text || 'Node details'
  detailsText.value = node.details.text
  renderDetailsDrawing(node)
  resize()
}

function hideDetails() {
  if (!detailsPanel.classList.contains('hidden')) persistDetailsText({ commitHistory: false })
  detailsPanel.classList.add('hidden')
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
}

function moveDetailsDrawing(e) {
  if (!drawingDetails) return
  e.preventDefault()
  const point = detailsPoint(e)
  detailsCtx.strokeStyle = '#08060d'
  detailsCtx.lineWidth = 3
  detailsCtx.lineCap = 'round'
  detailsCtx.lineJoin = 'round'
  detailsCtx.beginPath()
  detailsCtx.moveTo(lastDetailsPoint.x, lastDetailsPoint.y)
  detailsCtx.lineTo(point.x, point.y)
  detailsCtx.stroke()
  lastDetailsPoint = point
}

function endDetailsDrawing(e) {
  if (!drawingDetails) return
  detailsDrawing.releasePointerCapture?.(e.pointerId)
  drawingDetails = false
  lastDetailsPoint = null
  persistDetailsDrawing()
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
    if (state.selected !== null) {
      const selectedId = state.selected
      if (state.selectedType === 'edge') {
        delete state.edgeLabels[selectedId]
        state.edges = state.edges.filter(e => e.id !== selectedId)
      } else {
        for (const edge of state.edges) {
          if (fromId(edge) === selectedId || toId(edge) === selectedId) delete state.edgeLabels[edge.id]
        }
        state.nodes = state.nodes.filter(n => n.id !== selectedId)
        state.edges = state.edges.filter(e => fromId(e) !== selectedId && toId(e) !== selectedId)
      }
      state.selected = null
      hideDetails()
      historyCommit()
      save()
      render()
    }
  }
  if (e.key === 'Escape') {
    state.selected = null
    state.selectedType = null
    state.connecting = null
    hideDetails()
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
})

// Buttons
detailsText.addEventListener('input', scheduleDetailsTextSave)
detailsText.addEventListener('change', () => persistDetailsText({ commitHistory: false }))
detailsText.addEventListener('blur', () => persistDetailsText({ commitHistory: false }))
btnCloseDetails.addEventListener('click', () => { state.selected = null; state.selectedType = null; hideDetails(); render() })
btnClearDrawing.addEventListener('click', () => { drawDetailsBackground(); persistDetailsDrawing() })
detailsDrawing.addEventListener('pointerdown', beginDetailsDrawing)
detailsDrawing.addEventListener('pointermove', moveDetailsDrawing)
detailsDrawing.addEventListener('pointerup', endDetailsDrawing)
detailsDrawing.addEventListener('pointercancel', endDetailsDrawing)

pageSelect.addEventListener('change', () => switchPage(Number(pageSelect.value)))
btnNewPage.addEventListener('click', addNotebookPage)

btnAdd.addEventListener('click', () => {
  btnAdd.blur()
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
// Initialize history after load
historyPush()

if (state.nodes.length === 0) {
  const center = screenToWorld(canvas.width / 2, canvas.height / 2)
  state.nodes.push(newNode(center.x, center.y, activePage()?.title || 'Mind Map'))
  historyCommit()
  save()
}
render()

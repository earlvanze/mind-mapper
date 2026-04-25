import './style.css'

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  nodes: [],       // { id, x, y, text, width, height, color }
  edges: [],       // { id, from, to }
  selected: null,  // node id
  connecting: null, // node id | null (in progress edge)
  dragging: null,   // { id, offsetX, offsetY }
  panning: false,   // mid-canvas mouse down
  panStart: { x: 0, y: 0 },
  view: { x: 0, y: 0, scale: 1 },
  editing: null,     // node id being edited
  editText: '',
  hoveredNode: null,
  hoveredEdge: null,
  lastId: 0,
  lastEdgeId: 0,
}

// ─── Node Colors ─────────────────────────────────────────────────────────────
const NODE_COLORS = [
  { bg: '#ffffff', border: '#e5e4e7', label: 'White' },
  { bg: '#fee2e2', border: '#fca5a5', label: 'Red' },
  { bg: '#ffedd5', border: '#fdba74', label: 'Orange' },
  { bg: '#fef9c3', border: '#fde047', label: 'Yellow' },
  { bg: '#dcfce7', border: '#86efac', label: 'Green' },
  { bg: '#dbeafe', border: '#93c5fd', label: 'Blue' },
  { bg: '#ede9fe', border: '#c4b5fd', label: 'Purple' },
  { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink' },
]

// ─── Undo/Redo ────────────────────────────────────────────────────────────────
const MAX_HISTORY = 50
const history = { stack: [], index: -1 }

function snapshot() {
  const data = {
    nodes: state.nodes.map(n => ({ ...n })),
    edges: state.edges.map(e => ({ ...e })),
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
  }
  // truncate forward history
  history.stack = history.stack.slice(0, history.index + 1)
  history.stack.push(data)
  if (history.stack.length > MAX_HISTORY) history.stack.shift()
  history.index = history.stack.length - 1
}

function undo() {
  if (history.index <= 0) return
  history.index--
  restoreSnapshot(history.stack[history.index])
}

function redo() {
  if (history.index >= history.stack.length - 1) return
  history.index++
  restoreSnapshot(history.stack[history.index])
}

function restoreSnapshot(data) {
  state.nodes = data.nodes.map(n => ({ ...n }))
  state.edges = data.edges.map(e => ({ ...e }))
  state.lastId = data.lastId
  state.lastEdgeId = data.lastEdgeId
  state.selected = null
  state.connecting = null
  state.dragging = null
  state.panning = false
  state.editing = null
  save()
  render()
}

const STORAGE_KEY = 'mind-mapp-v1'

// ─── DOM ─────────────────────────────────────────────────────────────────────
const app = document.getElementById('app')
app.innerHTML = `
<div class="toolbar">
  <button id="btn-undo" title="Undo (Ctrl+Z)">↩</button>
  <button id="btn-redo" title="Redo (Ctrl+Y)">↪</button>
  <span class="toolbar-sep"></span>
  <button id="btn-add" title="Add node (A)">+ Node</button>
  <button id="btn-connect" title="Connect mode (C)">⬌</button>
  <div id="color-picker" class="color-picker" style="display:none"></div>
  <button id="btn-export" title="Export PNG (E)">📷</button>
  <span class="toolbar-sep"></span>
  <span id="zoom-indicator" class="zoom-indicator">100%</span>
  <span class="toolbar-hint">dbl-click canvas to add node · dbl-click node to edit · Del to delete · Ctrl+Z/Y undo/redo</span>
  <div id="minimap-container"><canvas id="minimap"></canvas></div>
</div>
<canvas id="canvas"></canvas>
`

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const minimapCanvas = document.getElementById('minimap')
const mctx = minimapCanvas.getContext('2d')
const btnAdd = document.getElementById('btn-add')
const btnConnect = document.getElementById('btn-connect')
const btnExport = document.getElementById('btn-export')
const btnUndo = document.getElementById('btn-undo')
const btnRedo = document.getElementById('btn-redo')
const colorPicker = document.getElementById('color-picker')
const zoomIndicator = document.getElementById('zoom-indicator')

// Build color swatches
NODE_COLORS.forEach((c, i) => {
  const swatch = document.createElement('button')
  swatch.className = 'color-swatch'
  swatch.style.background = c.bg
  swatch.style.borderColor = c.border
  swatch.title = c.label
  swatch.dataset.index = i
  colorPicker.appendChild(swatch)
})

// ─── Sizing ───────────────────────────────────────────────────────────────────
function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
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
    const fromNode = state.nodes.find(n => n.id === fromId(e))
    const toNode = state.nodes.find(n => n.id === toId(e))
    if (!fromNode || !toNode) continue
    const [ax, ay, bx, by] = endpoints(fromNode, toNode)
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

function newNode(x, y, text = 'New Node', color = 0) {
  const id = ++state.lastId
  const size = measureText(text)
  return { id, x: x - size.width / 2, y: y - size.height / 2, text, width: size.width, height: size.height, color }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
    history: { stack: history.stack, index: history.index },
  }))
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (data) {
      state.nodes = data.nodes || []
      state.edges = data.edges || []
      state.lastId = data.lastId || 0
      state.lastEdgeId = data.lastEdgeId || 0
      if (data.history) {
        history.stack = data.history.stack || []
        history.index = data.history.index ?? -1
      }
    }
  } catch (e) { /* ignore */ }
}

function updateUndoButtons() {
  btnUndo.disabled = history.index <= 0
  btnRedo.disabled = history.index >= history.stack.length - 1
}

function updateZoomIndicator() {
  zoomIndicator.textContent = Math.round(state.view.scale * 100) + '%'
}

function updateColorPicker() {
  if (state.selected !== null) {
    colorPicker.style.display = 'flex'
    const node = state.nodes.find(n => n.id === state.selected)
    document.querySelectorAll('.color-swatch').forEach((s, i) => {
      s.classList.toggle('active', node && node.color === i)
    })
  } else {
    colorPicker.style.display = 'none'
  }
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.setTransform(state.view.scale, 0, 0, state.view.scale, state.view.x, state.view.y)

  drawGrid()

  for (const e of state.edges) {
    drawEdge(e)
  }

  if (state.connecting) {
    const from = state.nodes.find(n => n.id === state.connecting)
    if (from) {
      const sx = lastMouse.x, sy = lastMouse.y
      const world = screenToWorld(sx, sy)
      const [ax, ay] = [from.x + from.width / 2, from.y + from.height / 2]
      drawEdgeLine(ax, ay, world.x, world.y, '#aa3bff', true)
    }
  }

  for (const n of state.nodes) {
    drawNode(n)
  }

  ctx.restore()

  drawMinimap()
  updateZoomIndicator()
}

function drawGrid() {
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

function drawEdge(e) {
  const fromNode = state.nodes.find(n => n.id === fromId(e))
  const toNode = state.nodes.find(n => n.id === toId(e))
  if (!fromNode || !toNode) return
  const [ax, ay, bx, by] = endpoints(fromNode, toNode)
  const isHovered = state.hoveredEdge && state.hoveredEdge.id === e.id
  drawEdgeLine(ax, ay, bx, by, isHovered ? '#aa3bff' : '#6b6375', false, isHovered)
}

function drawEdgeLine(ax, ay, bx, by, color, dashed, highlighted = false) {
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
}

function drawNode(n) {
  const isSelected = state.selected === n.id
  const isEditing = state.editing === n.id
  const isHovered = state.hoveredNode === n.id
  const isConnecting = state.connecting === n.id

  const colorDef = NODE_COLORS[n.color ?? 0]

  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 8 / state.view.scale
  ctx.shadowOffsetY = 3 / state.view.scale

  // Determine background
  let bgColor
  if (isSelected) bgColor = '#aa3bff'
  else if (isConnecting) bgColor = '#c084fc'
  else bgColor = colorDef.bg

  ctx.fillStyle = bgColor
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Border
  ctx.strokeStyle = isSelected ? '#7c2db8' : isConnecting ? '#a855f7' : colorDef.border
  ctx.lineWidth = (isSelected || isHovered ? 2 : 1) / state.view.scale
  roundRect(ctx, n.x, n.y, n.width, n.height, 8 / state.view.scale)
  ctx.stroke()

  // Text
  if (!isEditing) {
    ctx.fillStyle = isSelected || isConnecting ? '#ffffff' : '#08060d'
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
  if (!editInput) return
  const node = state.nodes.find(n => n.id === state.editing)
  if (node) {
    const newText = editInput.value.trim() || 'Node'
    if (newText !== node.text) {
      node.text = newText
      const size = measureText(newText)
      node.width = size.width
      node.height = size.height
      snapshot()
      save()
    }
  }
  editInput.remove()
  editInput = null
  state.editing = null
  render()
  updateUndoButtons()
}

function cancelEdit() {
  if (!editInput) return
  editInput.remove()
  editInput = null
  state.editing = null
  render()
}

// ─── Events ───────────────────────────────────────────────────────────────────
let lastMouse = { x: 0, y: 0 }
let mouseState = { down: false, clickTime: 0, clickX: 0, clickY: 0 }

canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  mouseState = { down: true, clickTime: Date.now(), clickX: mx, clickY: my }
  lastMouse = { x: mx, y: my }

  if (state.editing) { commitEdit(); return }

  const node = nodeAt(mx, my)
  if (node) {
    state.selected = node.id
    updateColorPicker()
    if (state.connecting && state.connecting !== node.id) {
      const id = ++state.lastEdgeId
      state.edges.push({ id, from: state.connecting, to: node.id })
      state.connecting = null
      btnConnect.classList.remove('active')
      snapshot()
      save()
    } else {
      state.dragging = { id: node.id, offsetX: mx / state.view.scale - node.x, offsetY: my / state.view.scale - node.y }
    }
  } else {
    const edge = edgeAt(mx, my)
    if (edge) {
      state.selected = null
      updateColorPicker()
      state.edges = state.edges.filter(e => e.id !== edge.id)
      snapshot()
      save()
    } else {
      state.selected = null
      updateColorPicker()
      state.connecting = null
      btnConnect.classList.remove('active')
      state.panning = true
      state.panStart = { x: mx - state.view.x, y: my - state.view.y }
    }
  }
  render()
})

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  lastMouse = { x: mx, y: my }

  if (state.dragging) {
    const node = state.nodes.find(n => n.id === state.dragging.id)
    if (node) {
      node.x = mx / state.view.scale - state.dragging.offsetX
      node.y = my / state.view.scale - state.dragging.offsetY
    }
  } else if (state.panning) {
    state.view.x = mx - state.panStart.x
    state.view.y = my - state.panStart.y
  }

  state.hoveredNode = nodeAt(mx, my)?.id ?? null
  state.hoveredEdge = edgeAt(mx, my)?.id ?? null
  render()
})

canvas.addEventListener('mouseup', e => {
  if (state.dragging) {
    snapshot()
    save()
  }
  state.dragging = null
  state.panning = false
  mouseState.down = false
  render()
  updateUndoButtons()
})

canvas.addEventListener('dblclick', e => {
  if (state.editing) return
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const world = screenToWorld(mx, my)

  const existing = nodeAt(mx, my)
  if (existing) {
    startEditing(existing)
  } else {
    const node = newNode(world.x, world.y)
    state.nodes.push(node)
    state.selected = node.id
    updateColorPicker()
    snapshot()
    save()
    render()
    updateUndoButtons()
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
  render()
}, { passive: false })

// Keyboard
document.addEventListener('keydown', e => {
  if (state.editing) return
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    updateUndoButtons()
    updateColorPicker()
    return
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
    updateUndoButtons()
    updateColorPicker()
    return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selected !== null) {
      snapshot()
      state.nodes = state.nodes.filter(n => n.id !== state.selected)
      state.edges = state.edges.filter(e => e.from !== state.selected && e.to !== state.selected)
      state.selected = null
      updateColorPicker()
      save()
      render()
      updateUndoButtons()
    }
  }
  if (e.key === 'Escape') {
    state.selected = null
    updateColorPicker()
    state.connecting = null
    btnConnect.classList.remove('active')
    render()
  }
  if (e.key === 'a' || e.key === 'A') {
    const cx = canvas.width / 2, cy = canvas.height / 2
    const world = screenToWorld(cx, cy)
    const node = newNode(world.x, world.y)
    state.nodes.push(node)
    state.selected = node.id
    updateColorPicker()
    snapshot()
    save()
    render()
    updateUndoButtons()
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
})

// Buttons
btnUndo.addEventListener('click', () => {
  undo()
  updateUndoButtons()
  updateColorPicker()
})

btnRedo.addEventListener('click', () => {
  redo()
  updateUndoButtons()
  updateColorPicker()
})

btnAdd.addEventListener('click', () => {
  const cx = canvas.width / 2, cy = canvas.height / 2
  const world = screenToWorld(cx, cy)
  const node = newNode(world.x, world.y)
  state.nodes.push(node)
  state.selected = node.id
  updateColorPicker()
  snapshot()
  save()
  render()
  updateUndoButtons()
  setTimeout(() => startEditing(node), 50)
})

btnConnect.addEventListener('click', () => {
  if (state.connecting) {
    state.connecting = null
    btnConnect.classList.remove('active')
  } else if (state.selected !== null) {
    state.connecting = state.selected
    btnConnect.classList.add('active')
  }
  render()
})

btnExport.addEventListener('click', exportPNG)

// Color picker swatches
colorPicker.addEventListener('click', e => {
  const swatch = e.target.closest('.color-swatch')
  if (!swatch) return
  const idx = parseInt(swatch.dataset.index, 10)
  if (state.selected === null) return
  const node = state.nodes.find(n => n.id === state.selected)
  if (!node) return
  if (node.color !== idx) {
    node.color = idx
    snapshot()
    save()
    render()
  }
  updateColorPicker()
})

function exportPNG() {
  const savedView = { ...state.view }
  state.view = { x: 0, y: 0, scale: 1 }
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.fillStyle = '#fff'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  tempCtx.save()
  tempCtx.setTransform(1, 0, 0, 1, 0, 0)
  state.view.x = 0; state.view.y = 0
  draw()
  tempCtx.restore()
  tempCtx.drawImage(canvas, 0, 0)
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

minimapCanvas.addEventListener('click', e => {
  if (state.nodes.length === 0) return
  const rect = minimapCanvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of state.nodes) {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height)
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

  const worldX = (mx - offsetX) / scale
  const worldY = (my - offsetY) / scale
  state.view.x = canvas.width / 2 - worldX * state.view.scale
  state.view.y = canvas.height / 2 - worldY * state.view.scale
  render()
})

function drawMinimap() {
  mctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H)
  mctx.fillStyle = '#f8f7f4'
  mctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H)

  if (state.nodes.length === 0) return

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

  mctx.strokeStyle = '#c4bfcc'
  mctx.lineWidth = 1
  for (const e of state.edges) {
    const fromNode = state.nodes.find(n => n.id === fromId(e))
    const toNode = state.nodes.find(n => n.id === toId(e))
    if (!fromNode || !toNode) continue
    const [ax, ay, bx, by] = endpoints(fromNode, toNode)
    mctx.beginPath()
    mctx.moveTo(ax * scale + offsetX, ay * scale + offsetY)
    mctx.lineTo(bx * scale + offsetX, by * scale + offsetY)
    mctx.stroke()
  }

  for (const n of state.nodes) {
    const isSelected = state.selected === n.id
    const colorDef = NODE_COLORS[n.color ?? 0]
    mctx.fillStyle = isSelected ? '#aa3bff' : colorDef.bg
    mctx.strokeStyle = isSelected ? '#7c2db8' : colorDef.border
    mctx.lineWidth = 1
    mctx.fillRect(n.x * scale + offsetX, n.y * scale + offsetY, n.width * scale, n.height * scale)
    mctx.strokeRect(n.x * scale + offsetX, n.y * scale + offsetY, n.width * scale, n.height * scale)
  }

  const vpX = (-state.view.x / state.view.scale) * scale + offsetX
  const vpY = (-state.view.y / state.view.scale) * scale + offsetY
  const vpW = (canvas.width / state.view.scale) * scale
  const vpH = (canvas.height / state.view.scale) * scale
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
snapshot() // initial state for undo
if (state.nodes.length === 0) {
  const center = screenToWorld(canvas.width / 2, canvas.height / 2)
  state.nodes.push(newNode(center.x, center.y, 'Mind Map'))
}
render()
updateUndoButtons()
updateColorPicker()
updateZoomIndicator()

import './style.css'

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  nodes: [],
  edges: [],
  selected: null,
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
}

const STORAGE_KEY = 'mind-mapp-v1'

// ─── History (undo/redo) ─────────────────────────────────────────────────────
const MAX_HISTORY = 50
const history = { stack: [], index: -1 }

function historySnapshot() {
  return JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
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
    state.selected = null
    state.connecting = null
    state.editing = null
    save()
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
  <button id="btn-add" title="Add node (A)">+ Node</button>
  <button id="btn-connect" title="Connect mode (C)">⬌ Connect</button>
  <button id="btn-export" title="Export PNG (E)">📷 Export</button>
  <span id="undo-redo-btns">
    <button id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
    <button id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
  </span>
  <span class="toolbar-hint">Double-click canvas to add node. Double-click node to edit. Drag to move.</span>
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
  return { id, x: x - size.width / 2, y: y - size.height / 2, text, width: size.width, height: size.height }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    lastId: state.lastId,
    lastEdgeId: state.lastEdgeId,
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
    }
  } catch (e) { /* ignore */ }
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
  const isHovered = state.hoveredEdge && state.hoveredEdge.id === e.id
  drawEdgeLine(ctx, ax, ay, bx, by, isHovered ? '#aa3bff' : '#6b6375', false, isHovered)
}

function drawEdgeLine(ctx, ax, ay, bx, by, color, dashed, highlighted = false) {
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

function drawNode(ctx, n) {
  const isSelected = state.selected === n.id
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
  // Guard: only remove if still in DOM (blur may have already removed it)
  if (!editCommitting && editInput.parentNode) editInput.remove()
  editInput = null
  state.editing = null
  historyCommit()
  save()
  editCommitting = false
  render()
}

function cancelEdit() {
  if (!editInput || editCommitting) return
  if (editInput.parentNode) editInput.remove()
  editInput = null
  state.editing = null
  editCommitting = false
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
    if (state.connecting && state.connecting !== node.id) {
      const id = ++state.lastEdgeId
      state.edges.push({ id, from: state.connecting, to: node.id })
      state.connecting = null
      btnConnect.classList.remove('active')
      historyCommit()
      save()
    } else {
      state.dragging = { id: node.id, offsetX: mx / state.view.scale - node.x, offsetY: my / state.view.scale - node.y }
    }
  } else {
    const edge = edgeAt(mx, my)
    if (edge) {
      state.selected = null
      state.edges = state.edges.filter(e => e.id !== edge.id)
      historyCommit()
      save()
    } else {
      state.selected = null
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
    historyCommit()
    save()
  }
  state.dragging = null
  state.panning = false
  mouseState.down = false
  render()
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
      state.nodes = state.nodes.filter(n => n.id !== state.selected)
      state.edges = state.edges.filter(e => e.from !== state.selected && e.to !== state.selected)
      state.selected = null
      historyCommit()
      save()
      render()
    }
  }
  if (e.key === 'Escape') {
    state.selected = null
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
})

// Buttons
btnAdd.addEventListener('click', () => {
  const cx = canvas.width / 2, cy = canvas.height / 2
  const world = screenToWorld(cx, cy)
  const node = newNode(world.x, world.y)
  state.nodes.push(node)
  state.selected = node.id
  historyCommit()
  save()
  render()
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

btnUndo.addEventListener('click', () => {
  if (state.editing) return
  historyUndo()
})

btnRedo.addEventListener('click', () => {
  if (state.editing) return
  historyRedo()
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
    const from = state.nodes.find(n => n.id === fromId(e))
    const to = state.nodes.find(n => n.id === toId(e))
    if (!from || !to) continue
    const [ax, ay, bx, by] = endpoints(from, to)
    mctx.beginPath()
    mctx.moveTo(ax * scale + offsetX, ay * scale + offsetY)
    mctx.lineTo(bx * scale + offsetX, by * scale + offsetY)
    mctx.stroke()
  }

  for (const n of state.nodes) {
    const isSelected = state.selected === n.id
    mctx.fillStyle = isSelected ? '#aa3bff' : '#fff'
    mctx.strokeStyle = isSelected ? '#7c2db8' : '#c4bfcc'
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
// Initialize history after load
historyPush()

if (state.nodes.length === 0) {
  const center = screenToWorld(canvas.width / 2, canvas.height / 2)
  state.nodes.push(newNode(center.x, center.y, 'Mind Map'))
  historyCommit()
}
render()

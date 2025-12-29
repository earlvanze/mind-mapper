/* ========================================================
   mindmap.js – Full version (move & delete nodes)
   ======================================================== */

/* ----------------  1️⃣ GLOBALS & CONSTANTS  ---------------- */
const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const status   = document.getElementById('status');

const ICON_SZ  = 20;
const TITLE_H  = 50;                 // taller title bar
const CONTENT_PAD = 10;

let mode = 'none';                   // 'none','draw','write','drag','connect'
let currentNode = null;              // node that was clicked (for delete)
let curStroke = [];                  // for handwriting
let curTarget = '';                  // 'title' | 'content'
let offset = {x:0, y:0};             // drag offset
let lastTap = 0;                     // double‑tap helper
let startNode = null;                // node from which a drag started
let dragThreshold = 5;               // pixels to distinguish click‑drag

let nodeIdCounter = 0;
const nodes = [];
const edges = [];

/* ----------------  2️⃣ DATA MODEL  ---------------- */
function addNode(x, y, title = '') {
  const node = {
    id: nodeIdCounter++,
    x, y, w: 180, h: 120,
    title,
    visible: true,
    writing: false,
    titleStrokes: [],
    contentStrokes: []
  };
  nodes.push(node);
  return node;
}

/* ----------------  3️⃣ HELPER FUNCTIONS  ---------------- */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {x: e.clientX - rect.left, y: e.clientY - rect.top};
}

function hitRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function nodeAt(p) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.visible && hitRect(p, {x: n.x, y: n.y, w: n.w, h: n.h})) return n;
  }
  return null;
}

function iconAt(node, p) {
  const pencil = {x: node.x + node.w - ICON_SZ - 8, y: node.y + 8, w: ICON_SZ, h: ICON_SZ};
  const clear  = {x: node.x + node.w - ICON_SZ - 8, y: node.y + node.h - ICON_SZ - 8, w: ICON_SZ, h: ICON_SZ};
  if (hitRect(p, pencil)) return {type: 'pencil', rect: pencil};
  if (hitRect(p, clear))  return {type: 'clear',  rect: clear};
  return null;
}

/* ----------------  4️⃣ RENDERING  ---------------- */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* 4.1 Draw all connectors first */
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  edges.forEach(e => {
    const a = e.from, b = e.to;
    ctx.beginPath();
    ctx.moveTo(a.x + a.w/2, a.y + a.h/2);
    ctx.lineTo(b.x + b.w/2, b.y + b.h/2);
    ctx.stroke();
  });

  /* 4.2 Draw nodes */
  nodes.forEach(n => {
    /* background & border */
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    ctx.fillRect(n.x, n.y, n.w, n.h);
    ctx.strokeRect(n.x, n.y, n.w, n.h);

    /* title bar */
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(n.x, n.y, n.w, TITLE_H);

    /* icons */
    // pencil
    ctx.beginPath();
    ctx.moveTo(n.x + n.w - ICON_SZ - 8, n.y + 8);
    ctx.lineTo(n.x + n.w - ICON_SZ - 8 + ICON_SZ, n.y + 8 + ICON_SZ);
    ctx.moveTo(n.x + n.w - ICON_SZ - 8, n.y + 8);
    ctx.lineTo(n.x + n.w - ICON_SZ - 8 + ICON_SZ, n.y + 8 + ICON_SZ);
    ctx.stroke();
    // clear
    ctx.beginPath();
    ctx.moveTo(n.x + n.w - ICON_SZ - 8, n.y + n.h - ICON_SZ - 8);
    ctx.lineTo(n.x + n.w - 8, n.y + n.h - 8);
    ctx.moveTo(n.x + n.w - 8, n.y + n.h - ICON_SZ - 8);
    ctx.lineTo(n.x + n.w - ICON_SZ - 8, n.y + n.h - 8);
    ctx.stroke();

    /* title text (fallback) */
    if (n.titleStrokes.length === 0) {
      ctx.fillStyle = '#222';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(n.title, n.x + CONTENT_PAD, n.y + TITLE_H - 8);
    }

    /* strokes */
    renderStrokeArray(n.titleStrokes, n.x, n.y, 'title');
    renderStrokeArray(n.contentStrokes, n.x, n.y, 'content');
  });

  /* 4.3 Temporary connector while dragging */
  if (mode === 'connect' && startNode) {
    const a = startNode;
    const b = curDragPos || getPos(lastMoveEvent);
    if (b) {
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x + a.w/2, a.y + a.h/2);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function renderStrokeArray(arr, ox, oy, area) {
  arr.forEach(stroke => {
    ctx.beginPath();
    ctx.moveTo(ox + stroke[0].x, oy + stroke[0].y);
    for (let i = 1; i < stroke.length; i++)
      ctx.lineTo(ox + stroke[i].x, oy + stroke[i].y);
    ctx.strokeStyle = area === 'title' ? '#e53935' : '#6a1b9a';
    ctx.lineWidth   = 2;
    ctx.stroke();
  });
}

/* ----------------  5️⃣ POINTER HANDLERS  ---------------- */
canvas.addEventListener('pointerdown', e => {
  const p = getPos(e);
  const node = nodeAt(p);
  const clickPos = {x: p.x, y: p.y};

  /* ---------- DELETE / SELECTION ---------- */
  if (node) currentNode = node;      // always remember the clicked node

  /* ---------- PENCIL / CLEAR ICON ---------- */
  if (node) {
    const ico = iconAt(node, p);
    if (ico) {
      if (ico.type === 'pencil') {
        node.writing = !node.writing;
        mode = node.writing ? 'write' : 'none';
        curStroke = [];
        status.textContent = node.writing ? 'Writing…' : 'Handwriting OFF';
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      if (ico.type === 'clear') {
        node.titleStrokes = [];
        node.contentStrokes = [];
        render(); status.textContent = 'Strokes cleared';
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
    }
  }

  /* ---------- MOVE / CONNECT ---------- */
  if (node && !node.writing && !iconAt(node, p)) {
    startNode = node;
    offset = {x: p.x - node.x, y: p.y - node.y};
    mode = 'maybeDrag';          // will become 'drag' if we move > threshold
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }

  /* ---------- NEW NODE DRAW ---------- */
  if (!node) {
    mode = 'draw';
    curStroke = [p];
    status.textContent = 'Drawing…';
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }

  /* ---------- HANDWRITING ---------- */
  if (node) {
    const ico = iconAt(node, p);
    if (!ico && node.writing) {
      mode = 'write';
      const relY = p.y - node.y;
      curTarget = relY < (TITLE_H + 10) ? 'title' : 'content';
      curStroke = [];
      status.textContent = 'Writing ' + (curTarget === 'title' ? 'title' : 'details');
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
  }
});

canvas.addEventListener('pointermove', e => {
  const p = getPos(e);
  const lastMoveEvent = e;            // keep for connector preview

  if (mode === 'draw') {
    curStroke.push(p);
    render();
    ctx.beginPath();
    ctx.moveTo(curStroke[0].x, curStroke[0].y);
    for (let i = 1; i < curStroke.length; i++)
      ctx.lineTo(curStroke[i].x, curStroke[i].y);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke();
  } else if (mode === 'write' && currentNode) {
    curStroke.push({x: p.x - currentNode.x, y: p.y - currentNode.y});
    render();
    ctx.beginPath();
    ctx.moveTo(currentNode.x + curStroke[0].x, currentNode.y + curStroke[0].y);
    for (let i = 1; i < curStroke.length; i++)
      ctx.lineTo(currentNode.x + curStroke[i].x, currentNode.y + curStroke[i].y);
    ctx.strokeStyle = curTarget === 'title' ? '#e53935' : '#6a1b9a';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (mode === 'maybeDrag' && startNode) {
    const dx = p.x - startNode.x - offset.x;
    const dy = p.y - startNode.y - offset.y;
    if (Math.hypot(dx, dy) > dragThreshold) {
      mode = 'drag';
      currentNode = startNode;   // keep selection for delete
    }
  } else if (mode === 'drag' && currentNode) {
    currentNode.x = p.x - offset.x;
    currentNode.y = p.y - offset.y;
    render();
  }
});

canvas.addEventListener('pointerup', e => {
  const p = getPos(e);
  const endNode = nodeAt(p);

  /* ---------- DRAW NEW NODE ---------- */
  if (mode === 'draw') {
    addNode(p.x, p.y, '');
    curStroke = [];
    render(); status.textContent = 'Node created';
  }
  /* ---------- HANDWRITING ---------- */
  else if (mode === 'write' && currentNode) {
    if (curTarget === 'title')
      currentNode.titleStrokes.push([...curStroke]);
    else
      currentNode.contentStrokes.push([...curStroke]);
    curStroke = [];
    status.textContent = 'Handwriting saved';
  }
  /* ---------- MOVE OR CONNECT ---------- */
  else if (mode === 'drag' && startNode) {
    // If dragged onto a different node → create connector
    if (endNode && endNode !== startNode) {
      edges.push({from: startNode, to: endNode});
      status.textContent = 'Connector added';
    } else {
      status.textContent = 'Node moved';
    }
  }
  /* ---------- CONNECT (dragged to a node) ---------- */
  else if (mode === 'maybeDrag' && startNode && endNode && endNode !== startNode) {
    edges.push({from: startNode, to: endNode});
    status.textContent = 'Connector added';
  }
  /* ---------- DELETE ---------- */
  else if (mode === 'none' && endNode) {
    // nothing special – just select the node
  }

  /* ---------- RESET ---------- */
  mode = 'none';
  currentNode = null;
  curStroke = [];
  curTarget = '';
  offset = {x:0, y:0};
  startNode = null;
  lastTap = 0;
  canvas.releasePointerCapture(e.pointerId);
  e.preventDefault();
});

/* ----------------  6️⃣ CANVAS RESIZE  ---------------- */
function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

/* ----------------  7️⃣ KEYDOWN (DELETE)  ---------------- */
window.addEventListener('keydown', e => {
  if (!currentNode) return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // 1️⃣ remove the node
    nodes.splice(nodes.findIndex(n => n.id === currentNode.id), 1);
    // 2️⃣ remove any edges that involve it
    for (let i = edges.length - 1; i >= 0; i--) {
      if (edges[i].from.id === currentNode.id || edges[i].to.id === currentNode.id)
        edges.splice(i, 1);
    }
    currentNode = null;
    render();
    status.textContent = 'Node deleted';
    e.preventDefault();
  }
});

/* ----------------  8️⃣ DEMO NODE (blank)  ---------------- */
addNode(window.innerWidth/2, window.innerHeight/2, '');
render();
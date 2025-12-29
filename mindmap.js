/* ===========================================
   mindmap.js – Version with permanent connectors
   =========================================== */

/* 1️⃣ GLOBALS & CONSTANTS */
const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');
const status   = document.getElementById('status');

const ICON_SZ  = 20;
const TITLE_H  = 50;           // taller title bar
const CONTENT_PAD = 10;

let mode = 'none';             // 'none', 'draw', 'write', 'connect', 'drag'
let currentNode = null;        // node being written on / dragged
let curStroke = [];            // strokes while writing
let curTarget = '';            // 'title' | 'content'
let offset = {x:0, y:0};
let lastTap = 0;               // double‑tap helper
let startNode = null;          // node from which a connector was started
let curDragPos = null;         // current pointer position while connecting

let nodeIdCounter = 0;
const nodes = [];
const edges = [];              // {from: node, to: node}

/* 2️⃣ DATA MODEL */
function addNode(x, y, title = '') {
  const node = {
    id: nodeIdCounter++,
    x, y, w:180, h:120,
    title,
    visible:true,
    writing:false,
    titleStrokes:[],
    contentStrokes:[]
  };
  nodes.push(node);
  return node;
}

/* 3️⃣ HELPER FUNCTIONS */
function getPos(e){
  const rect = canvas.getBoundingClientRect();
  return {x:e.clientX-rect.left, y:e.clientY-rect.top};
}

function hitRect(p,r){
  return p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h;
}

function nodeAt(p){
  for(let i=nodes.length-1;i>=0;i--){
    const n = nodes[i];
    if(n.visible && hitRect(p,{x:n.x,y:n.y,w:n.w,h:n.h})) return n;
  }
  return null;
}

function iconAt(node,p){
  const pencil = {x:node.x+node.w-ICON_SZ-8, y:node.y+8, w:ICON_SZ, h:ICON_SZ};
  const clear  = {x:node.x+node.w-ICON_SZ-8, y:node.y+node.h-ICON_SZ-8, w:ICON_SZ, h:ICON_SZ};
  if(hitRect(p,pencil)) return {type:'pencil', rect:pencil};
  if(hitRect(p,clear))  return {type:'clear',  rect:clear};
  return null;
}

/* 4️⃣ RENDERING */
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  /* 4.1  Draw all connectors first */
  ctx.strokeStyle='#666';
  ctx.lineWidth=2;
  edges.forEach(e=>{
    const a = e.from, b = e.to;
    ctx.beginPath();
    ctx.moveTo(a.x + a.w/2, a.y + a.h/2);
    ctx.lineTo(b.x + b.w/2, b.y + b.h/2);
    ctx.stroke();
  });

  /* 4.2  Draw nodes (background, border, title bar, icons, strokes) */
  nodes.forEach(n=>{
    /* background & border */
    ctx.fillStyle='#fff'; ctx.strokeStyle='#999'; ctx.lineWidth=1;
    ctx.fillRect(n.x,n.y,n.w,n.h);
    ctx.strokeRect(n.x,n.y,n.w,n.h);

    /* title bar */
    ctx.fillStyle='#fafafa';
    ctx.fillRect(n.x,n.y,n.w,TITLE_H);

    /* icons */
    // pencil
    ctx.beginPath();
    ctx.moveTo(n.x+n.w-ICON_SZ-8, n.y+8);
    ctx.lineTo(n.x+n.w-ICON_SZ-8+ICON_SZ, n.y+8+ICON_SZ);
    ctx.moveTo(n.x+n.w-ICON_SZ-8, n.y+8);
    ctx.lineTo(n.x+n.w-ICON_SZ-8+ICON_SZ, n.y+8+ICON_SZ);
    ctx.stroke();
    // clear
    ctx.beginPath();
    ctx.moveTo(n.x+n.w-ICON_SZ-8, n.y+n.h-ICON_SZ-8);
    ctx.lineTo(n.x+n.w-8, n.y+n.h-8);
    ctx.moveTo(n.x+n.w-8, n.y+n.h-ICON_SZ-8);
    ctx.lineTo(n.x+n.w-ICON_SZ-8, n.y+n.h-8);
    ctx.stroke();

    /* title text (fallback) */
    if(n.titleStrokes.length===0){
      ctx.fillStyle='#222';
      ctx.font='bold 16px sans-serif';
      ctx.fillText(n.title, n.x+CONTENT_PAD, n.y+TITLE_H-8);
    }

    /* node strokes */
    renderStrokeArray(n.titleStrokes, n.x, n.y, 'title');
    renderStrokeArray(n.contentStrokes, n.x, n.y, 'content');
  });

  /* 4.3  Temporary connector while dragging */
  if(mode==='connect' && startNode){
    const a = startNode;
    const b = curDragPos || getPos({clientX:e.clientX, clientY:e.clientY});
    if(b){
      ctx.strokeStyle='#777';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(a.x + a.w/2, a.y + a.h/2);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function renderStrokeArray(arr, ox, oy, area){
  arr.forEach(stroke=>{
    ctx.beginPath();
    ctx.moveTo(ox+stroke[0].x, oy+stroke[0].y);
    for(let i=1;i<stroke.length;i++)
      ctx.lineTo(ox+stroke[i].x, oy+stroke[i].y);
    ctx.strokeStyle = area==='title'?'#e53935':'#6a1b9a';
    ctx.lineWidth   = 2;
    ctx.stroke();
  });
}

/* 5️⃣ POINTER HANDLERS */
canvas.addEventListener('pointerdown', e=>{
  const p = getPos(e);
  const node = nodeAt(p);

  /* -----------  CONNECT MODE  ----------- */
  if(node && !node.writing && !iconAt(node,p)){
    startNode = node;
    mode = 'connect';
    curDragPos = {x:p.x, y:p.y};
    status.textContent = 'Start connector…';
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }

  /* -----------  NORMAL (DRAW / WRITE)  ----------- */
  if(node){
    const ico = iconAt(node,p);
    if(ico){
      if(ico.type==='pencil'){
        node.writing = !node.writing;
        mode = node.writing ? 'write' : 'none';
        curStroke = [];
        status.textContent = node.writing ? 'Writing…' : 'Handwriting OFF';
        e.preventDefault(); return;
      }
      if(ico.type==='clear'){
        node.titleStrokes   = [];
        node.contentStrokes = [];
        render(); status.textContent='Strokes cleared';
        e.preventDefault(); return;
      }
    }

    if(node.writing){
      mode = 'write';
      const relY = p.y - node.y;
      curTarget = relY < (TITLE_H + 10) ? 'title' : 'content';
      curStroke=[];
      status.textContent = 'Writing ' + (curTarget==='title'?'title':'details');
    }else{
      mode = 'none';
    }
    currentNode = node;
  }else{
    /* --------------  NEW NODE DRAW -------------- */
    mode = 'draw';
    curStroke = [p];
    status.textContent = 'Drawing…';
  }

  canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
});

canvas.addEventListener('pointermove', e=>{
  const p = getPos(e);

  if(mode==='draw'){
    curStroke.push(p);
    render();
    ctx.beginPath();
    ctx.moveTo(curStroke[0].x, curStroke[0].y);
    for(let i=1;i<curStroke.length;i++)
      ctx.lineTo(curStroke[i].x, curStroke[i].y);
    ctx.strokeStyle='#333'; ctx.lineWidth=4; ctx.stroke();
  }else if(mode==='write' && currentNode){
    curStroke.push({x:p.x-currentNode.x, y:p.y-currentNode.y});
    render();
    ctx.beginPath();
    ctx.moveTo(currentNode.x+curStroke[0].x, currentNode.y+curStroke[0].y);
    for(let i=1;i<curStroke.length;i++)
      ctx.lineTo(currentNode.x+curStroke[i].x, currentNode.y+curStroke[i].y);
    ctx.strokeStyle = curTarget==='title'?'#e53935':'#6a1b9a';
    ctx.lineWidth   = 2;
    ctx.stroke();
  }else if(mode==='connect'){
    curDragPos = p;     // remember while rendering
  }else if(mode==='drag' && currentNode){
    currentNode.x = p.x - offset.x;
    currentNode.y = p.y - offset.y;
    render();
  }
  e.preventDefault();
});

canvas.addEventListener('pointerup', e=>{
  const p = getPos(e);

  if(mode==='draw'){
    /* New node (blank title) */
    const newNode = addNode(p.x, p.y, '');
    curStroke=[];
    render(); status.textContent='Node created';
  }else if(mode==='write' && currentNode){
    /* Save handwriting */
    if(curTarget==='title'){
      currentNode.titleStrokes.push([...curStroke]);
    }else{
      currentNode.contentStrokes.push([...curStroke]);
    }
    curStroke=[];
    status.textContent='Handwriting saved';
  }else if(mode==='drag'){
    status.textContent='Node moved';
  }else if(mode==='connect' && startNode){
    const endNode = nodeAt(p);
    if(endNode && endNode !== startNode){
      /* Connect to an existing node – no new node */
      edges.push({from:startNode, to:endNode});
    }else{
      /* Create a new node and connect to it */
      const newNode = addNode(p.x, p.y, '');
      edges.push({from:startNode, to:newNode});
    }
    render(); status.textContent='Connector added';
  }

  /* reset all transient state */
  mode = 'none';
  currentNode = null;
  curStroke = [];
  curTarget = '';
  offset = {x:0, y:0};
  lastTap = 0;
  startNode = null;
  curDragPos = null;
  e.preventDefault();
});

/* 6️⃣ CANVAS RESIZE */
function resize(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

/* 7️⃣ ONE DEMO NODE (blank) */
addNode(window.innerWidth/2, window.innerHeight/2, '');
render();
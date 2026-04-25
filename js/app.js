class MindMap {
    constructor() {
        this.nodes = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.nodeIdCounter = 0;
        
        // Zoom and pan state
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        
        this.nodesContainer = document.getElementById('nodes');
        this.connectionsContainer = document.getElementById('connections');
        this.canvasContainer = document.getElementById('canvas-container');
        this.nodeEditor = document.getElementById('node-editor');
        this.nodeTextInput = document.getElementById('node-text');
        
        this.setupEventListeners();
        this.load();
    }
    
    setupEventListeners() {
        document.getElementById('addNode').addEventListener('click', () => this.addNode());
        document.getElementById('addChild').addEventListener('click', () => this.addChild());
        document.getElementById('deleteNode').addEventListener('click', () => this.deleteNode());
        document.getElementById('save').addEventListener('click', () => this.save());
        document.getElementById('load').addEventListener('click', () => this.load());
        document.getElementById('clear').addEventListener('click', () => this.clear());
        document.getElementById('exportPNG').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('zoomReset').addEventListener('click', () => this.resetView());
        
        // Color picker
        document.getElementById('nodeColor').addEventListener('input', (e) => this.applyColorToSelected(e.target.value));
        
        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.applyColorToSelected(color);
                document.getElementById('nodeColor').value = color;
            });
        });
        
        // Style buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.style;
                this.applyStyleToSelected(style);
                
                document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });
        
        document.getElementById('save-text').addEventListener('click', () => this.saveNodeText());
        document.getElementById('cancel-edit').addEventListener('click', () => this.hideEditor());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.id !== 'node-text') return;
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedNode && !this.nodeEditor.classList.contains('hidden')) return;
                this.deleteNode();
            }
            if (e.key === 'Enter') {
                if (this.selectedNode && this.nodeEditor.classList.contains('hidden')) {
                    e.preventDefault();
                    this.showEditor(this.selectedNode);
                }
            }
            if (e.key === 'Escape') {
                if (!this.nodeEditor.classList.contains('hidden')) {
                    this.hideEditor();
                }
            }
            if (e.key === '+' || e.key === '=') {
                this.zoom(1.2);
            }
            if (e.key === '-' || e.key === '_') {
                this.zoom(0.8);
            }
            if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.resetView();
            }
        });
        
        // Mouse wheel zoom
        this.canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvasContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomAt(zoomFactor, mouseX, mouseY);
        }, { passive: false });
        
        // Pan with middle mouse button or space+drag
        let spacePressed = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !spacePressed) {
                spacePressed = true;
                this.canvasContainer.style.cursor = 'grab';
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                spacePressed = false;
                this.canvasContainer.style.cursor = 'default';
            }
        });
        
        this.canvasContainer.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && spacePressed)) {
                e.preventDefault();
                this.isPanning = true;
                this.panStartX = e.clientX - this.translateX;
                this.panStartY = e.clientY - this.translateY;
                this.canvasContainer.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.translateX = e.clientX - this.panStartX;
                this.translateY = e.clientY - this.panStartY;
                this.updateTransform();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvasContainer.style.cursor = spacePressed ? 'grab' : 'default';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.node') && !e.target.closest('#node-editor') && !e.target.closest('#toolbar button') && !e.target.closest('.zoom-controls') && !e.target.closest('#style-toolbar')) {
                this.deselectAll();
            }
        });
    }
    
    applyColorToSelected(color) {
        if (!this.selectedNode) return;
        
        const node = this.nodes.find(n => n.id === this.selectedNode);
        if (node) {
            node.color = color;
            this.renderNode(node);
            if (this.selectedNode === node.id) {
                document.getElementById(node.id).classList.add('selected');
            }
            this.save();
        }
    }
    
    applyStyleToSelected(style) {
        if (!this.selectedNode) return;
        
        const node = this.nodes.find(n => n.id === this.selectedNode);
        if (node) {
            node.style = style;
            this.renderNode(node);
            if (this.selectedNode === node.id) {
                document.getElementById(node.id).classList.add('selected');
            }
            this.save();
        }
    }
    
    zoom(factor) {
        this.scale = Math.max(0.1, Math.min(5, this.scale * factor));
        this.updateTransform();
    }
    
    zoomAt(factor, x, y) {
        const newScale = Math.max(0.1, Math.min(5, this.scale * factor));
        
        const scaleDiff = newScale / this.scale;
        this.translateX = x - (x - this.translateX) * scaleDiff;
        this.translateY = y - (y - this.translateY) * scaleDiff;
        
        this.scale = newScale;
        this.updateTransform();
    }
    
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    }
    
    updateTransform() {
        const content = document.getElementById('content-layer');
        if (content) {
            content.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }
    
    addNode() {
        const id = `node-${this.nodeIdCounter++}`;
        const x = (window.innerWidth / 2 - this.translateX) / this.scale - 50;
        const y = (window.innerHeight / 2 - this.translateY) / this.scale - 20;
        
        const node = {
            id,
            text: 'New Node',
            x,
            y,
            parentId: null,
            isRoot: this.nodes.length === 0,
            color: '#4a90d9',
            style: 'filled'
        };
        
        this.nodes.push(node);
        this.renderNode(node);
        this.selectNode(id);
        this.showEditor(id);
        this.save();
    }
    
    addChild() {
        if (!this.selectedNode) return;
        
        const id = `node-${this.nodeIdCounter++}`;
        const parent = this.nodes.find(n => n.id === this.selectedNode);
        
        const node = {
            id,
            text: 'Child Node',
            x: parent.x + 150,
            y: parent.y + (this.getChildren(parent.id).length * 60),
            parentId: parent.id,
            isRoot: false,
            color: '#4a90d9',
            style: 'filled'
        };
        
        this.nodes.push(node);
        this.renderNode(node);
        this.renderConnections();
        this.selectNode(id);
        this.showEditor(id);
        this.save();
    }
    
    getChildren(parentId) {
        return this.nodes.filter(n => n.parentId === parentId);
    }
    
    deleteNode() {
        if (!this.selectedNode) return;
        
        const deleteRecursive = (nodeId) => {
            const children = this.getChildren(nodeId);
            children.forEach(child => deleteRecursive(child.id));
            
            const element = document.getElementById(nodeId);
            if (element) element.remove();
            
            this.nodes = this.nodes.filter(n => n.id !== nodeId);
        };
        
        deleteRecursive(this.selectedNode);
        this.selectedNode = null;
        this.renderConnections();
        this.save();
    }
    
    getColorClass(color) {
        const colorMap = {
            '#4a90d9': 'blue',
            '#5cb85c': 'green',
            '#ff6b6b': 'red',
            '#f0ad4e': 'orange',
            '#9b59b6': 'purple',
            '#34495e': 'dark'
        };
        return colorMap[color] || 'white';
    }
    
    renderNode(node) {
        const existing = document.getElementById(node.id);
        if (existing) existing.remove();
        
        const div = document.createElement('div');
        div.id = node.id;
        
        let classes = 'node';
        if (node.isRoot) classes += ' root';
        if (this.selectedNode === node.id) classes += ' selected';
        
        const colorClass = this.getColorClass(node.color);
        if (colorClass !== 'white') {
            classes += ` color-${colorClass}`;
        }
        
        if (node.style && node.style !== 'filled') {
            classes += ` style-${node.style}`;
        }
        
        div.className = classes;
        div.textContent = node.text;
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        
        div.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.startDrag(e, node.id);
        });
        div.addEventListener('dblclick', () => this.showEditor(node.id));
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });
        
        this.nodesContainer.appendChild(div);
    }
    
    startDrag(e, nodeId) {
        e.preventDefault();
        
        this.draggedNode = nodeId;
        const node = document.getElementById(nodeId);
        const rect = node.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
    }
    
    drag(e) {
        if (!this.draggedNode) return;
        
        const x = (e.clientX - this.dragOffset.x - this.translateX) / this.scale;
        const y = (e.clientY - this.dragOffset.y - this.translateY) / this.scale;
        
        const node = this.nodes.find(n => n.id === this.draggedNode);
        if (node) {
            node.x = x;
            node.y = y;
            
            const element = document.getElementById(this.draggedNode);
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            
            this.renderConnections();
        }
    }
    
    endDrag() {
        if (this.draggedNode) {
            this.save();
        }
        this.draggedNode = null;
        document.removeEventListener('mousemove', this.drag);
    }
    
    renderConnections() {
        this.connectionsContainer.innerHTML = '';
        
        this.nodes.forEach(node => {
            if (node.parentId) {
                const parent = this.nodes.find(n => n.id === node.parentId);
                if (parent) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    const startX = parent.x + 50;
                    const startY = parent.y + 20;
                    const endX = node.x + 50;
                    const endY = node.y + 20;
                    
                    const midX = (startX + endX) / 2;
                    
                    line.setAttribute('d', `M ${startX} ${startY} Q ${midX} ${startY} ${midX} ${(startY + endY) / 2} Q ${midX} ${endY} ${endX} ${endY}`);
                    line.setAttribute('class', 'connection-line');
                    
                    this.connectionsContainer.appendChild(line);
                }
            }
        });
    }
    
    selectNode(nodeId) {
        this.deselectAll();
        this.selectedNode = nodeId;
        const nodeEl = document.getElementById(nodeId);
        nodeEl.classList.add('selected');
        
        // Update color picker to match selected node
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            document.getElementById('nodeColor').value = node.color || '#4a90d9';
            
            // Update style buttons
            document.querySelectorAll('.style-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.style === (node.style || 'filled'));
            });
        }
    }
    
    deselectAll() {
        document.querySelectorAll('.node.selected').forEach(n => n.classList.remove('selected'));
        this.selectedNode = null;
    }
    
    showEditor(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        const element = document.getElementById(nodeId);
        const rect = element.getBoundingClientRect();
        
        this.nodeEditor.classList.remove('hidden');
        this.nodeEditor.style.left = `${rect.left}px`;
        this.nodeEditor.style.top = `${rect.bottom + 10}px`;
        
        this.nodeTextInput.value = node.text;
        this.nodeTextInput.dataset.nodeId = nodeId;
        this.nodeTextInput.focus();
        
        this.hideEditor = () => {
            this.nodeEditor.classList.add('hidden');
        };
        
        document.getElementById('save-text').onclick = () => this.saveNodeText();
        document.getElementById('cancel-edit').onclick = () => this.hideEditor();
        
        this.nodeTextInput.onkeydown = (e) => {
            if (e.key === 'Enter') this.saveNodeText();
            if (e.key === 'Escape') this.hideEditor();
        };
    }
    
    saveNodeText() {
        const nodeId = this.nodeTextInput.dataset.nodeId;
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.text = this.nodeTextInput.value || 'Node';
            this.renderNode(node);
            if (this.selectedNode === nodeId) {
                document.getElementById(nodeId).classList.add('selected');
            }
            this.save();
        }
        this.hideEditor();
    }
    
    save() {
        localStorage.setItem('mindmap-data', JSON.stringify({
            nodes: this.nodes,
            nodeIdCounter: this.nodeIdCounter,
            scale: this.scale,
            translateX: this.translateX,
            translateY: this.translateY
        }));
    }
    
    load() {
        const data = localStorage.getItem('mindmap-data');
        if (data) {
            const parsed = JSON.parse(data);
            this.nodes = parsed.nodes || [];
            this.nodeIdCounter = parsed.nodeIdCounter || 0;
            this.scale = parsed.scale || 1;
            this.translateX = parsed.translateX || 0;
            this.translateY = parsed.translateY || 0;
            
            this.nodesContainer.innerHTML = '';
            this.connectionsContainer.innerHTML = '';
            
            this.nodes.forEach(node => this.renderNode(node));
            this.renderConnections();
            this.updateTransform();
        }
    }
    
    clear() {
        if (confirm('Clear all nodes?')) {
            this.nodes = [];
            this.selectedNode = null;
            this.nodeIdCounter = 0;
            this.resetView();
            this.nodesContainer.innerHTML = '';
            this.connectionsContainer.innerHTML = '';
            localStorage.removeItem('mindmap-data');
        }
    }
    
    exportPNG() {
        if (this.nodes.length === 0) {
            alert('Nothing to export. Create some nodes first!');
            return;
        }
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + 100);
            maxY = Math.max(maxY, node.y + 40);
        });
        
        const padding = 40;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        // Temporarily reset transform for clean export
        const originalScale = this.scale;
        const originalTranslateX = this.translateX;
        const originalTranslateY = this.translateY;
        
        this.scale = 1;
        this.translateX = padding - minX;
        this.translateY = padding - minY;
        this.updateTransform();
        
        // Use html2canvas on the canvas container
        html2canvas(this.canvasContainer, {
            backgroundColor: '#f5f5f5',
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `mindmap-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restore transform
            this.scale = originalScale;
            this.translateX = originalTranslateX;
            this.translateY = originalTranslateY;
            this.updateTransform();
        }).catch(err => {
            alert('Export failed: ' + err.message);
            // Restore transform on error too
            this.scale = originalScale;
            this.translateX = originalTranslateX;
            this.translateY = originalTranslateY;
            this.updateTransform();
        });
    }
    
    exportJSON() {
        if (this.nodes.length === 0) {
            alert('Nothing to export. Create some nodes first!');
            return;
        }
        
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            nodes: this.nodes,
            nodeIdCounter: this.nodeIdCounter
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `mindmap-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});

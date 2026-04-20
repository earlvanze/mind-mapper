class MindMap {
    constructor() {
        this.nodes = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.nodeIdCounter = 0;
        
        this.nodesContainer = document.getElementById('nodes');
        this.connectionsContainer = document.getElementById('connections');
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
        
        document.getElementById('save-text').addEventListener('click', () => this.saveNodeText());
        document.getElementById('cancel-edit').addEventListener('click', () => this.hideEditor());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input (except node-text)
            if (e.target.tagName === 'INPUT' && e.target.id !== 'node-text') return;
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete if editor is open (user might be typing)
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
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.node') && !e.target.closest('#node-editor') && !e.target.closest('#toolbar button')) {
                this.deselectAll();
            }
        });
    }
    
    addNode() {
        const id = `node-${this.nodeIdCounter++}`;
        const x = window.innerWidth / 2 - 50;
        const y = window.innerHeight / 2 - 20;
        
        const node = {
            id,
            text: 'New Node',
            x,
            y,
            parentId: null,
            isRoot: this.nodes.length === 0
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
            isRoot: false
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
    
    renderNode(node) {
        const existing = document.getElementById(node.id);
        if (existing) existing.remove();
        
        const div = document.createElement('div');
        div.id = node.id;
        div.className = `node${node.isRoot ? ' root' : ''}`;
        div.textContent = node.text;
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        
        div.addEventListener('mousedown', (e) => this.startDrag(e, node.id));
        div.addEventListener('dblclick', () => this.showEditor(node.id));
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });
        
        this.nodesContainer.appendChild(div);
    }
    
    startDrag(e, nodeId) {
        if (e.detail === 2) return;
        
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
        
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
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
        document.getElementById(nodeId).classList.add('selected');
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
            document.getElementById('save-text').removeEventListener('click', this.saveNodeText);
            document.getElementById('cancel-edit').removeEventListener('click', this.hideEditor);
        };
        
        document.getElementById('save-text').addEventListener('click', () => this.saveNodeText());
        document.getElementById('cancel-edit').addEventListener('click', () => this.hideEditor());
        
        this.nodeTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveNodeText();
            if (e.key === 'Escape') this.hideEditor();
        });
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
            nodeIdCounter: this.nodeIdCounter
        }));
    }
    
    load() {
        const data = localStorage.getItem('mindmap-data');
        if (data) {
            const parsed = JSON.parse(data);
            this.nodes = parsed.nodes || [];
            this.nodeIdCounter = parsed.nodeIdCounter || 0;
            
            this.nodesContainer.innerHTML = '';
            this.connectionsContainer.innerHTML = '';
            
            this.nodes.forEach(node => this.renderNode(node));
            this.renderConnections();
        }
    }
    
    clear() {
        if (confirm('Clear all nodes?')) {
            this.nodes = [];
            this.selectedNode = null;
            this.nodeIdCounter = 0;
            this.nodesContainer.innerHTML = '';
            this.connectionsContainer.innerHTML = '';
            localStorage.removeItem('mindmap-data');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});

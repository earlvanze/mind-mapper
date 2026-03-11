import { useState } from 'react';
import { useMindMapStore, saveState } from './store/useMindMapStore';
import Node from './components/Node';
import Edges from './components/Edges';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanZoom } from './hooks/usePanZoom';
import { useAutosave } from './hooks/useAutosave';
import { exportPng, exportJsonData, exportMarkdownData, fitToView, centerPointInView, confirmAction, parseImportPayload, sampleMap, APP_VERSION } from './utils';
import SearchDialog from './components/SearchDialog';
import HelpDialog from './components/HelpDialog';
import MiniMap from './components/MiniMap';

export default function App() {
  const { nodes, focusId, selectedIds, setFocus, selectAll, selectSiblings, selectSubtree, duplicateSelected, importState, resetMap, undo, redo, canUndo, canRedo } = useMindMapStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  const centerOnWorld = (x: number, y: number) => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const panZoom = (window as any).__mindmappPanZoom;
    if (!panZoom?.setView || !panZoom?.getView) return;

    const current = panZoom.getView();
    const centered = centerPointInView(
      { x, y },
      { width: rect.width, height: rect.height },
      current.scale ?? 1,
    );

    panZoom.setView(centered);
  };

  const centerOnNode = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    centerOnWorld(node.x + 30, node.y + 16);
  };

  useKeyboard({
    onSearch: () => setSearchOpen(true),
    onFit: () => fitToView(),
    onCenterFocus: () => centerOnNode(focusId),
    onHelp: () => setHelpOpen(true),
    onUndo: () => undo(),
    onRedo: () => redo(),
    onExportMarkdown: () => exportMarkdownData(nodes),
  });
  usePanZoom({ selector: '.canvas' });
  useAutosave(() => saveState(), 600);

  const exportJson = () => exportJsonData(nodes);

  const exportPngClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportPng(el);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nodes = parseImportPayload(parsed);
      importState(nodes);
      setImportNotice({ text: `Imported ${Object.keys(nodes).length} nodes.`, kind: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON file.';
      setImportNotice({ text: message, kind: 'error' });
    }
  };

  return (
    <div className="app">
      <div className="toolbar">
        <strong>Mind Mapp</strong>
        <span style={{ color: '#666' }}>v{APP_VERSION}</span>
        <span style={{ color: '#666' }}>{Object.keys(nodes).length} nodes</span>
        <span style={{ color: '#666' }}>{selectedIds.length} selected</span>
        <span style={{ color: '#666' }}>Press ? for shortcuts</span>
        {importNotice ? (
          <span style={{ color: importNotice.kind === 'error' ? '#ff7b7b' : '#9ad67a' }}>
            {importNotice.text}
          </span>
        ) : null}
        <div className="toolbar-actions">
          <button title="Undo (Cmd/Ctrl+Z)" onClick={undo} disabled={!canUndo}>Undo</button>
          <button title="Redo (Cmd/Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>Redo</button>
          <button title="Select all nodes (Cmd/Ctrl+A)" onClick={selectAll}>Select All</button>
          <button title="Select siblings of focused node (Alt+S)" onClick={selectSiblings}>Siblings</button>
          <button title="Select focused subtree (Alt+B)" onClick={selectSubtree}>Subtree</button>
          <button title="Duplicate selected nodes (Cmd/Ctrl+D)" onClick={duplicateSelected}>Duplicate</button>
          <label className="import-btn">
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
              }}
            />
          </label>
          <button title="Fit to view" onClick={() => fitToView()}>Fit</button>
          <button title="Center focused node (C)" onClick={() => centerOnNode(focusId)}>Center</button>
          <button title="Show shortcuts" onClick={() => setHelpOpen(true)}>Help</button>
          <button
            title="Clear map"
            onClick={() => {
              if (confirmAction('Clear the entire map?')) resetMap();
            }}
          >
            Clear
          </button>
          <button title="Load sample map" onClick={() => importState(sampleMap())}>Sample</button>
          <button title="Export JSON" data-export="json" onClick={exportJson}>Export JSON</button>
          <button title="Export Markdown" data-export="markdown" onClick={() => exportMarkdownData(nodes)}>Export MD</button>
          <button title="Export PNG" data-export="png" onClick={exportPngClick}>Export PNG</button>
          <button title="Reset pan/zoom" onClick={() => (window as any).__mindmappResetView?.()}>Reset View</button>
        </div>
      </div>
      <div className="canvas">
        <Edges nodes={nodes} />
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
        <MiniMap
          nodes={nodes}
          focusId={focusId}
          selectedIds={selectedIds}
          onFocus={(id) => {
            setFocus(id);
            centerOnNode(id);
          }}
          onNavigate={(x, y) => centerOnWorld(x, y)}
        />
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

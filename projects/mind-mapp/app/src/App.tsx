import { lazy, Suspense, useEffect, useState } from 'react';
import { useMindMapStore, saveState } from './store/useMindMapStore';
import Node from './components/Node';
import Edges from './components/Edges';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanZoom } from './hooks/usePanZoom';
import { useAutosave } from './hooks/useAutosave';
import { exportPng, exportJsonData, exportMarkdownData, fitToView, computeFitView, computeSelectionBounds, centerPointInView, confirmAction, parseImportPayload, sampleMap, loadUiPrefs, saveUiPrefs, APP_VERSION } from './utils';
import MiniMap from './components/MiniMap';

const SearchDialog = lazy(() => import('./components/SearchDialog'));
const HelpDialog = lazy(() => import('./components/HelpDialog'));

export default function App() {
  const { nodes, focusId, selectedIds, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, selectParent, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, duplicateSelected, importState, resetMap, undo, redo, canUndo, canRedo } = useMindMapStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [importNotice, setImportNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const prefs = loadUiPrefs();
    if (!prefs) return;
    if (typeof prefs.showGrid === 'boolean') setShowGrid(prefs.showGrid);
    if (typeof prefs.showMiniMap === 'boolean') setShowMiniMap(prefs.showMiniMap);
    if (typeof prefs.showAdvancedActions === 'boolean') setShowAdvancedActions(prefs.showAdvancedActions);
  }, []);

  useEffect(() => {
    saveUiPrefs({ showGrid, showMiniMap, showAdvancedActions });
  }, [showGrid, showMiniMap, showAdvancedActions]);

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

  const fitSelection = () => {
    const selected = selectedIds
      .map(id => nodes[id])
      .filter(Boolean);
    if (!selected.length) return;

    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;

    const panZoom = (window as any).__mindmappPanZoom;
    const rect = el.getBoundingClientRect();
    const view = computeFitView(selected, { width: rect.width, height: rect.height }, { padding: 140, maxScale: 2 });

    if (panZoom?.setView) {
      panZoom.setView(view);
      return;
    }

    el.style.transform = `translate(${view.originX}px, ${view.originY}px) scale(${view.scale})`;
  };

  const zoomBy = (factor: number) => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    const panZoom = (window as any).__mindmappPanZoom;
    if (!el || !panZoom?.setView || !panZoom?.getView) return;

    const rect = el.getBoundingClientRect();
    const current = panZoom.getView();
    const originX = current.originX ?? 0;
    const originY = current.originY ?? 0;
    const scale = current.scale ?? 1;
    const nextScale = Math.max(0.2, Math.min(3, scale * factor));
    if (Math.abs(nextScale - scale) < 0.0001) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const worldX = (centerX - originX) / scale;
    const worldY = (centerY - originY) / scale;

    panZoom.setView({
      originX: centerX - worldX * nextScale,
      originY: centerY - worldY * nextScale,
      scale: nextScale,
    });
  };

  useKeyboard({
    onSearch: () => setSearchOpen(true),
    onFit: () => fitToView(),
    onFitSelection: () => fitSelection(),
    onZoomIn: () => zoomBy(1.15),
    onZoomOut: () => zoomBy(1 / 1.15),
    onCenterFocus: () => centerOnNode(focusId),
    onToggleGrid: () => setShowGrid(v => !v),
    onToggleMiniMap: () => setShowMiniMap(v => !v),
    onToggleAdvanced: () => setShowAdvancedActions(v => !v),
    onHelp: () => setHelpOpen(true),
    onUndo: () => undo(),
    onRedo: () => redo(),
    onExportMarkdown: () => exportMarkdownData(nodes),
  });
  usePanZoom({ selector: '.canvas' });
  useAutosave(() => saveState(), 600);

  const selectedBounds = computeSelectionBounds(nodes, selectedIds);

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
        {selectedBounds ? <span style={{ color: '#666' }}>sel box {selectedBounds.width}×{selectedBounds.height}</span> : null}
        <span style={{ color: '#666' }}>Press ? for shortcuts</span>
        {importNotice ? (
          <span style={{ color: importNotice.kind === 'error' ? '#ff7b7b' : '#9ad67a' }}>
            {importNotice.text}
          </span>
        ) : null}
        <div className="toolbar-actions">
          <button title="Undo (Cmd/Ctrl+Z)" onClick={undo} disabled={!canUndo}>Undo</button>
          <button title="Redo (Cmd/Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>Redo</button>
          <button title="Fit to view" onClick={() => fitToView()}>Fit</button>
          <button title="Fit selected nodes (Alt+F)" onClick={fitSelection}>Fit Sel</button>
          <button title="Center focused node (C)" onClick={() => centerOnNode(focusId)}>Center</button>
          <button title="Toggle grid overlay (Shift+G)" onClick={() => setShowGrid(v => !v)}>{showGrid ? 'Grid On' : 'Grid Off'}</button>
          <button title="Toggle mini-map (Shift+M)" onClick={() => setShowMiniMap(v => !v)}>{showMiniMap ? 'Mini-map On' : 'Mini-map Off'}</button>
          <button title="Show/Hide advanced actions (Shift+A)" onClick={() => setShowAdvancedActions(v => !v)}>
            {showAdvancedActions ? 'Advanced ▴' : 'Advanced ▾'}
          </button>
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
          <button title="Export JSON" data-export="json" onClick={exportJson}>Export JSON</button>
          <button title="Export Markdown" data-export="markdown" onClick={() => exportMarkdownData(nodes)}>Export MD</button>
          <button title="Export PNG" data-export="png" onClick={exportPngClick}>Export PNG</button>
          <button title="Reset pan/zoom" onClick={() => (window as any).__mindmappResetView?.()}>Reset View</button>

          {showAdvancedActions ? (
            <>
              <button title="Select all nodes (Cmd/Ctrl+A)" onClick={selectAll}>Select All</button>
              <button title="Invert selection (Alt+I)" onClick={invertSelection}>Invert</button>
              <button title="Select siblings of focused node (Alt+S)" onClick={selectSiblings}>Siblings</button>
              <button title="Select children of focused node (Alt+C)" onClick={selectChildren}>Children</button>
              <button title="Select leaves under focused subtree (Alt+L)" onClick={selectLeaves}>Leaves</button>
              <button title="Select focused node ancestors (Alt+U)" onClick={selectAncestors}>Ancestors</button>
              <button title="Keep top-level nodes from selection (Alt+T)" onClick={selectTopLevel}>Top-level</button>
              <button title="Select nodes at same depth (Alt+G)" onClick={selectGeneration}>Generation</button>
              <button title="Clear selection extras (Alt+X)" onClick={clearSelectionSet}>Clear Sel</button>
              <button title="Expand selection to neighbors (Alt+N)" onClick={expandSelectionToNeighbors}>Neighbors</button>
              <button title="Align selected X to focus (Alt+Shift+X)" onClick={() => alignSelection('x')}>Align X</button>
              <button title="Align selected Y to focus (Alt+Shift+Y)" onClick={() => alignSelection('y')}>Align Y</button>
              <button title="Distribute selected horizontally (Alt+Shift+H)" onClick={() => distributeSelection('x')}>Dist X</button>
              <button title="Distribute selected vertically (Alt+Shift+V)" onClick={() => distributeSelection('y')}>Dist Y</button>
              <button title="Layout selected as row from focus (Alt+Shift+R)" onClick={() => layoutSelection('row')}>Layout Row</button>
              <button title="Layout selected as column from focus (Alt+Shift+D)" onClick={() => layoutSelection('column')}>Layout Col</button>
              <button title="Snap selected to 20px grid (Alt+Shift+G)" onClick={() => snapSelectionToGrid(20)}>Snap 20</button>
              <button title="Mirror selected across focused X axis (Alt+Shift+M)" onClick={() => mirrorSelection('x')}>Mirror X</button>
              <button title="Mirror selected across focused Y axis (Alt+Shift+W)" onClick={() => mirrorSelection('y')}>Mirror Y</button>
              <button title="Stack selected on X from focus (Alt+[)" onClick={() => stackSelection('x')}>Stack X</button>
              <button title="Stack selected on Y from focus (Alt+])" onClick={() => stackSelection('y')}>Stack Y</button>
              <button title="Select focused subtree (Alt+B)" onClick={selectSubtree}>Subtree</button>
              <button title="Select parent of focused node (Alt+P)" onClick={selectParent}>Parent</button>
              <button title="Duplicate selected nodes (Cmd/Ctrl+D)" onClick={duplicateSelected}>Duplicate</button>
            </>
          ) : null}
        </div>
      </div>
      <div className={`canvas ${showGrid ? 'grid-on' : ''}`}>
        <Edges nodes={nodes} />
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
        {showMiniMap ? (
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
        ) : null}
      </div>
      <Suspense fallback={null}>
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Suspense>
    </div>
  );
}

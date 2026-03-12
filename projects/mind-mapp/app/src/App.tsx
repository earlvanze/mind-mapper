import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMindMapStore, saveState } from './store/useMindMapStore';
import Node from './components/Node';
import Edges from './components/Edges';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanZoom } from './hooks/usePanZoom';
import { useAutosave } from './hooks/useAutosave';
import { exportPng, exportJsonData, exportMarkdownData, fitToView, computeFitView, computeSelectionBounds, formatSelectionText, formatSubtreeOutline, getFocusPathSegments, getParentFocusId, getFirstChildId, getWrappedSiblingId, getFirstLeafId, getLastLeafId, getCycledLeafId, centerPointInView, confirmAction, parseImportPayload, sampleMap, loadUiPrefs, saveUiPrefs, APP_VERSION } from './utils';
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
  const [viewScale, setViewScale] = useState(1);
  const [importNotice, setImportNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const previousFocusRef = useRef('n_root');
  const currentFocusRef = useRef(focusId);

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

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ scale?: number }>).detail;
      if (typeof detail?.scale === 'number') {
        setViewScale(detail.scale);
      }
    };
    window.addEventListener('mindmapp:viewchange', handler);
    const panZoom = (window as any).__mindmappPanZoom;
    const view = panZoom?.getView?.();
    if (typeof view?.scale === 'number') {
      setViewScale(view.scale);
    }
    return () => window.removeEventListener('mindmapp:viewchange', handler);
  }, []);

  useEffect(() => {
    if (!importNotice) return;
    const timeout = window.setTimeout(() => setImportNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [importNotice]);

  useEffect(() => {
    if (focusId === currentFocusRef.current) return;
    previousFocusRef.current = currentFocusRef.current;
    currentFocusRef.current = focusId;
  }, [focusId]);

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

  const focusRoot = () => {
    setFocus('n_root');
    centerOnNode('n_root');
  };

  const centerRoot = () => {
    centerOnNode('n_root');
  };

  const centerSelection = () => {
    const selected = selectedIds
      .map(id => nodes[id])
      .filter(Boolean);

    if (!selected.length) {
      centerOnNode(focusId);
      return;
    }

    const sum = selected.reduce(
      (acc, node) => ({ x: acc.x + node.x + 30, y: acc.y + node.y + 16 }),
      { x: 0, y: 0 },
    );

    centerOnWorld(sum.x / selected.length, sum.y / selected.length);
  };

  const centerSubtree = () => {
    const root = nodes[focusId];
    if (!root) return;

    const stack = [focusId];
    const visited = new Set<string>();
    const subtree: Array<{ x: number; y: number }> = [];

    while (stack.length) {
      const id = stack.pop();
      if (!id || visited.has(id)) continue;
      visited.add(id);

      const node = nodes[id];
      if (!node) continue;
      subtree.push(node);
      stack.push(...node.children);
    }

    if (!subtree.length) return;

    const sum = subtree.reduce(
      (acc, node) => ({ x: acc.x + node.x + 30, y: acc.y + node.y + 16 }),
      { x: 0, y: 0 },
    );

    centerOnWorld(sum.x / subtree.length, sum.y / subtree.length);
  };

  const focusParentNode = () => {
    const parentId = getParentFocusId(nodes, focusId);
    if (!parentId) return;

    setFocus(parentId);
    centerOnNode(parentId);
  };

  const focusChildNode = () => {
    const childId = getFirstChildId(nodes, focusId);
    if (!childId) return;

    setFocus(childId);
    centerOnNode(childId);
  };

  const focusSibling = (direction: -1 | 1) => {
    const siblingId = getWrappedSiblingId(nodes, focusId, direction);
    if (!siblingId) return;

    setFocus(siblingId);
    centerOnNode(siblingId);
  };

  const focusSubtreeFirstLeaf = () => {
    const leafId = getFirstLeafId(nodes, focusId);
    if (!leafId) return;

    setFocus(leafId);
    centerOnNode(leafId);
  };

  const focusSubtreeLastLeaf = () => {
    const leafId = getLastLeafId(nodes, focusId);
    if (!leafId) return;

    setFocus(leafId);
    centerOnNode(leafId);
  };

  const focusSubtreeLeafCycle = (direction: -1 | 1) => {
    const leafId = getCycledLeafId(nodes, focusId, focusId, direction);
    if (!leafId) return;

    setFocus(leafId);
    centerOnNode(leafId);
  };

  const focusPrevious = () => {
    const previousId = previousFocusRef.current;
    if (!previousId || previousId === focusId || !nodes[previousId]) return;

    const currentId = focusId;
    setFocus(previousId);
    centerOnNode(previousId);
    previousFocusRef.current = currentId;
    currentFocusRef.current = previousId;
  };

  const fitNodesInView = (targetNodes: Array<{ x: number; y: number }>) => {
    if (!targetNodes.length) return;

    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;

    const panZoom = (window as any).__mindmappPanZoom;
    const rect = el.getBoundingClientRect();
    const view = computeFitView(targetNodes, { width: rect.width, height: rect.height }, { padding: 140, maxScale: 2 });

    if (panZoom?.setView) {
      panZoom.setView(view);
      return;
    }

    el.style.transform = `translate(${view.originX}px, ${view.originY}px) scale(${view.scale})`;
  };

  const fitSelection = () => {
    const selected = selectedIds
      .map(id => nodes[id])
      .filter(Boolean);
    fitNodesInView(selected);
  };

  const fitFocusedSubtree = () => {
    const root = nodes[focusId];
    if (!root) return;

    const stack = [focusId];
    const visited = new Set<string>();
    const subtree: Array<{ x: number; y: number }> = [];

    while (stack.length) {
      const id = stack.pop();
      if (!id || visited.has(id)) continue;
      visited.add(id);

      const node = nodes[id];
      if (!node) continue;
      subtree.push(node);
      stack.push(...node.children);
    }

    fitNodesInView(subtree);
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
    onFitSubtree: () => fitFocusedSubtree(),
    onZoomIn: () => zoomBy(1.15),
    onZoomOut: () => zoomBy(1 / 1.15),
    onResetView: () => (window as any).__mindmappResetView?.(),
    onCenterFocus: () => centerOnNode(focusId),
    onCenterSelection: () => centerSelection(),
    onCenterSubtree: () => centerSubtree(),
    onFocusParent: () => focusParentNode(),
    onFocusChild: () => focusChildNode(),
    onFocusPrevSibling: () => focusSibling(-1),
    onFocusNextSibling: () => focusSibling(1),
    onFocusSubtreeFirstLeaf: () => focusSubtreeFirstLeaf(),
    onFocusSubtreeLastLeaf: () => focusSubtreeLastLeaf(),
    onFocusPrevLeaf: () => focusSubtreeLeafCycle(-1),
    onFocusNextLeaf: () => focusSubtreeLeafCycle(1),
    onFocusRoot: () => focusRoot(),
    onFocusPrevious: () => focusPrevious(),
    onToggleGrid: () => setShowGrid(v => !v),
    onToggleMiniMap: () => setShowMiniMap(v => !v),
    onToggleAdvanced: () => setShowAdvancedActions(v => !v),
    onHelp: () => setHelpOpen(true),
    onUndo: () => undo(),
    onRedo: () => redo(),
    onExportMarkdown: () => exportMarkdownData(nodes),
    onCopySelection: () => copySelectionText(),
    onCopySubtree: () => copySubtreeText(),
    onCopyPath: () => copyFocusPath(),
    onCenterRoot: () => centerRoot(),
  });
  usePanZoom({ selector: '.canvas' });
  useAutosave(() => saveState(), 600);

  const selectedBounds = computeSelectionBounds(nodes, selectedIds);
  const focusPathSegments = getFocusPathSegments(nodes, focusId);
  const focusedPath = focusPathSegments.map(segment => segment.label).join(' / ');

  const exportJson = () => exportJsonData(nodes);

  const exportPngClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportPng(el);
  };

  const writeClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  };

  const copySelectionText = async () => {
    const text = formatSelectionText(nodes, selectedIds, focusId);
    if (!text) {
      setImportNotice({ text: 'No node text available to copy.', kind: 'error' });
      return;
    }

    try {
      await writeClipboard(text);
      const lineCount = text.split('\n').length;
      setImportNotice({ text: `Copied ${lineCount} line${lineCount === 1 ? '' : 's'} to clipboard.`, kind: 'success' });
    } catch {
      setImportNotice({ text: 'Clipboard copy failed. Use Export MD as fallback.', kind: 'error' });
    }
  };

  const copySubtreeText = async () => {
    const text = formatSubtreeOutline(nodes, focusId);
    if (!text) {
      setImportNotice({ text: 'No focused subtree available to copy.', kind: 'error' });
      return;
    }

    try {
      await writeClipboard(text);
      const lineCount = text.split('\n').length;
      setImportNotice({ text: `Copied subtree outline (${lineCount} lines).`, kind: 'success' });
    } catch {
      setImportNotice({ text: 'Subtree copy failed. Use Export MD as fallback.', kind: 'error' });
    }
  };

  const copyFocusPath = async () => {
    if (!focusedPath) {
      setImportNotice({ text: 'No focused path available to copy.', kind: 'error' });
      return;
    }

    try {
      await writeClipboard(focusedPath);
      setImportNotice({ text: 'Copied focused path to clipboard.', kind: 'success' });
    } catch {
      setImportNotice({ text: 'Path copy failed. Use Copy Tree as fallback.', kind: 'error' });
    }
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
        <span style={{ color: '#666' }}>zoom {Math.round(viewScale * 100)}%</span>
        {focusPathSegments.length ? (
          <span className="toolbar-path" title={focusedPath}>
            {focusPathSegments.map((segment, index) => (
              <span key={segment.id}>
                <button
                  className="toolbar-path-segment"
                  title={`Focus ${segment.label}`}
                  onClick={() => {
                    setFocus(segment.id);
                    centerOnNode(segment.id);
                  }}
                >
                  {segment.label}
                </button>
                {index < focusPathSegments.length - 1 ? <span className="toolbar-path-sep">/</span> : null}
              </span>
            ))}
          </span>
        ) : null}
        <span style={{ color: '#666' }}>Press ? for shortcuts</span>
        {importNotice ? (
          <span className={`toolbar-notice ${importNotice.kind === 'error' ? 'is-error' : 'is-success'}`}>
            {importNotice.text}
            <button
              title="Dismiss notice"
              onClick={() => setImportNotice(null)}
            >
              ×
            </button>
          </span>
        ) : null}
        <div className="toolbar-actions">
          <button title="Undo (Cmd/Ctrl+Z)" onClick={undo} disabled={!canUndo}>Undo</button>
          <button title="Redo (Cmd/Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>Redo</button>
          <button title="Fit to view" onClick={() => fitToView()}>Fit</button>
          <button title="Fit selected nodes (Alt+F)" onClick={fitSelection}>Fit Sel</button>
          <button title="Fit focused subtree (Alt+Shift+F)" onClick={fitFocusedSubtree}>Fit Sub</button>
          <button title="Center focused node (C)" onClick={() => centerOnNode(focusId)}>Center</button>
          <button title="Center selected nodes (Alt+Shift+C)" onClick={centerSelection}>Center Sel</button>
          <button title="Center focused subtree (Alt+Shift+B)" onClick={centerSubtree}>Center Sub</button>
          <button title="Center root node (Shift+C)" onClick={centerRoot}>Center Root</button>
          <button title="Jump focus to parent node (Shift+P)" onClick={focusParentNode}>Parent Focus</button>
          <button title="Jump focus to first child node (Shift+N)" onClick={focusChildNode}>Child Focus</button>
          <button title="Jump focus to previous sibling (Shift+H)" onClick={() => focusSibling(-1)}>Prev Sib</button>
          <button title="Jump focus to next sibling (Shift+J)" onClick={() => focusSibling(1)}>Next Sib</button>
          <button title="Jump focus to first leaf in focused subtree (Shift+L)" onClick={focusSubtreeFirstLeaf}>Leaf Focus</button>
          <button title="Jump focus to last leaf in focused subtree (Shift+K)" onClick={focusSubtreeLastLeaf}>Last Leaf</button>
          <button title="Jump focus to previous leaf in focused subtree (Shift+,)" onClick={() => focusSubtreeLeafCycle(-1)}>Prev Leaf</button>
          <button title="Jump focus to next leaf in focused subtree (Shift+.)" onClick={() => focusSubtreeLeafCycle(1)}>Next Leaf</button>
          <button title="Jump focus to root node (R)" onClick={focusRoot}>Root</button>
          <button title="Jump back to previous focus (Alt+R)" onClick={focusPrevious}>Back</button>
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
          <button title="Copy selected/focused node text (Cmd/Ctrl+Shift+C)" onClick={copySelectionText}>Copy Sel</button>
          <button title="Copy focused subtree outline (Cmd/Ctrl+Shift+L)" onClick={copySubtreeText}>Copy Tree</button>
          <button title="Copy focused node path (Alt+Shift+P)" onClick={copyFocusPath}>Copy Path</button>
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

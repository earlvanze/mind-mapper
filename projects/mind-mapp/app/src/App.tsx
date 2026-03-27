import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMindMapStore, saveState } from './store/useMindMapStore';
import { loadTheme, saveTheme, applyTheme, toggleTheme, type Theme } from './utils/theme';
import VersionHistoryDialog from './components/VersionHistoryDialog';
import { createSnapshot, saveSnapshot, type NamedSnapshot } from './store/versionHistory';
import Node from './components/Node';
import Edges from './components/Edges';
import CanvasEdges from './components/CanvasEdges';
import { useKeyboard } from './hooks/useKeyboard';
import { useVirtualization } from './hooks/useVirtualization';
import { usePanZoom } from './hooks/usePanZoom';
import { useAutosave } from './hooks/useAutosave';
import { exportPng, exportJsonData, exportMarkdownData, exportSvg, exportFreemindData, exportPdf, fitToView, computeFitView, computeSelectionBounds, formatSelectionText, formatSubtreeOutline, getFocusPathSegments, getParentFocusId, getFirstChildId, getWrappedSiblingId, getFirstLeafId, getLastLeafId, getCycledLeafId, getLeafCycleRootId, getLeafIdsInSubtree, createFocusHistory, recordFocus, resetFocusHistory, findStepFocus, findEdgeFocus, pruneFocusHistory, centerPointInView, confirmAction, parseImportPayload, sampleMap, loadFocusHistory, saveFocusHistory, loadUiPrefs, saveUiPrefs, APP_VERSION, HELP_TOGGLE_ARIA_KEYSHORTCUTS, SEARCH_TOGGLE_ARIA_KEYSHORTCUTS, encodeShareLink, loadSharedMap, clearShareLink } from './utils';
import MiniMap from './components/MiniMap';
import StyleToolbar from './components/StyleToolbar';

const SearchDialog = lazy(() => import('./components/SearchDialog'));
const HelpDialog = lazy(() => import('./components/HelpDialog'));
const VersionHistoryDialogLazy = lazy(() => import('./components/VersionHistoryDialog'));

export default function App() {
  const [useCanvasRenderer, setUseCanvasRenderer] = useState(false);
  const { nodes, focusId, selectedIds, editingId, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, selectParent, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, duplicateSelected, importState, resetMap, undo, redo, canUndo, canRedo } = useMindMapStore();
  const { visibleNodeIds, shouldVirtualize } = useVirtualization(nodes, useCanvasRenderer);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [pdfLayout, setPdfLayout] = useState<'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape' | 'fit'>('a4-portrait');
  const [theme, setTheme] = useState<Theme>(() => {
    const t = loadTheme();
    applyTheme(t);
    return t;
  });
  const [viewScale, setViewScale] = useState(1);
  const [importNotice, setImportNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const focusHistoryRef = useRef(createFocusHistory(focusId));
  const focusHistoryHydratedRef = useRef(false);

  useEffect(() => {
    const prefs = loadUiPrefs();
    if (!prefs) return;
    if (typeof prefs.showGrid === 'boolean') setShowGrid(prefs.showGrid);
    if (typeof prefs.showMiniMap === 'boolean') setShowMiniMap(prefs.showMiniMap);
    if (typeof prefs.showAdvancedActions === 'boolean') setShowAdvancedActions(prefs.showAdvancedActions);
    if (typeof prefs.rendererMode === 'string') setUseCanvasRenderer(prefs.rendererMode === 'canvas');
  }, []);

  useEffect(() => {
    saveUiPrefs({ showGrid, showMiniMap, showAdvancedActions, rendererMode: useCanvasRenderer ? 'canvas' : 'svg' });
  }, [showGrid, showMiniMap, showAdvancedActions, useCanvasRenderer]);

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
    if (focusHistoryHydratedRef.current) return;
    focusHistoryHydratedRef.current = true;

    const saved = loadFocusHistory();
    if (!saved) return;

    focusHistoryRef.current = pruneFocusHistory(saved, (id) => !!nodes[id], focusId);
  }, [focusId, nodes]);

  useEffect(() => {
    let next = recordFocus(focusHistoryRef.current, focusId);
    next = pruneFocusHistory(next, (id) => !!nodes[id], focusId);

  // Load shared map from URL on mount
  useEffect(() => {
    const sharedNodes = loadSharedMap();
    if (sharedNodes) {
      importState(sharedNodes);
      clearShareLink();
      resetFocusHistoryTo('n_root');
      setImportNotice({ text: `Loaded shared map with ${Object.keys(sharedNodes).length} nodes.`, kind: 'success' });
    }
  }, []);
    focusHistoryRef.current = next;
    saveFocusHistory(next);
  }, [focusId, nodes]);

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
    const rootId = getLeafCycleRootId(nodes, focusId);
    if (!rootId) return;

    const leafId = getCycledLeafId(nodes, rootId, focusId, direction);
    if (!leafId) return;

    setFocus(leafId);
    centerOnNode(leafId);
  };

  const jumpFocusHistory = (direction: -1 | 1) => {
    const stepped = findStepFocus(
      focusHistoryRef.current,
      direction,
      (id) => !!nodes[id],
    );

    focusHistoryRef.current = stepped.state;
    saveFocusHistory(stepped.state);

    if (!stepped.focusId) return;
    setFocus(stepped.focusId);
    centerOnNode(stepped.focusId);
  };

  const focusPrevious = () => jumpFocusHistory(-1);
  const focusForward = () => jumpFocusHistory(1);

  const jumpFocusHistoryEdge = (edge: 'start' | 'end') => {
    const stepped = findEdgeFocus(
      focusHistoryRef.current,
      edge,
      (id) => !!nodes[id],
    );

    focusHistoryRef.current = stepped.state;
    saveFocusHistory(stepped.state);

    if (!stepped.focusId) return;
    setFocus(stepped.focusId);
    centerOnNode(stepped.focusId);
  };

  const focusHistoryStart = () => jumpFocusHistoryEdge('start');
  const focusHistoryEnd = () => jumpFocusHistoryEdge('end');

  const resetFocusHistoryTo = (nextFocusId: string, noticeText?: string) => {
    const next = resetFocusHistory(focusHistoryRef.current, nextFocusId);
    focusHistoryRef.current = next;
    saveFocusHistory(next);

    if (noticeText) {
      setImportNotice({ text: noticeText, kind: 'success' });
    }
  };

  const resetFocusHistoryNow = () => {
    resetFocusHistoryTo(focusId, 'Focus history reset to current node.');
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

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = toggleTheme(prev);
      saveTheme(next);
      applyTheme(next);
      return next;
    });
  };

  const closeSearchDialog = () => {
    setSearchOpen(false);
  };

  const toggleSearchDialog = () => {
    setSearchOpen((current) => {
      const next = !current;
      if (next) setHelpOpen(false);
      return next;
    });
  };

  const closeHelpDialog = () => {
    setHelpOpen(false);
  };

  const toggleHelpDialog = () => {
    setHelpOpen((current) => {
      const next = !current;
      if (next) setSearchOpen(false);
      return next;
    });
  };

  const toggleVersionHistory = () => {
    setVersionHistoryOpen(v => !v);
  };

  const handleSaveSnapshot = (name: string) => {
    const snap = createSnapshot(nodes, focusId, name);
    return saveSnapshot(snap);
  };

  const handleLoadSnapshot = (snap: NamedSnapshot) => {
    importState(snap.nodes);
    resetFocusHistoryTo(snap.focusId, `Loaded snapshot "${snap.name}".`);
  };

  useKeyboard({
    onSearch: () => toggleSearchDialog(),
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
    onFocusForward: () => focusForward(),
    onFocusHistoryStart: () => focusHistoryStart(),
    onFocusHistoryEnd: () => focusHistoryEnd(),
    onResetFocusHistory: () => resetFocusHistoryNow(),
    onToggleGrid: () => setShowGrid(v => !v),
    onToggleMiniMap: () => setShowMiniMap(v => !v),
    onToggleAdvanced: () => setShowAdvancedActions(v => !v),
    onToggleTheme: handleToggleTheme,
    onHelp: () => toggleHelpDialog(),
    onVersionHistory: () => toggleVersionHistory(),
    onUndo: () => undo(),
    onRedo: () => redo(),
    onExportMarkdown: () => exportMarkdownData(nodes),
    onCopySelection: () => copySelectionText(),
    onCopySubtree: () => copySubtreeText(),
    onCopyPath: () => copyFocusPath(),
    onCenterRoot: () => centerRoot(),
    suspended: searchOpen || helpOpen,
  });
  usePanZoom({ selector: '.canvas' });
  useAutosave(() => saveState(), 600);

  const selectedBounds = computeSelectionBounds(nodes, selectedIds);
  const focusPathSegments = getFocusPathSegments(nodes, focusId);
  const focusedPath = focusPathSegments.map(segment => segment.label).join(' / ');
  const parentFocusId = getParentFocusId(nodes, focusId);
  const childFocusId = getFirstChildId(nodes, focusId);
  const prevSiblingId = getWrappedSiblingId(nodes, focusId, -1);
  const nextSiblingId = getWrappedSiblingId(nodes, focusId, 1);
  const firstLeafId = getFirstLeafId(nodes, focusId);
  const lastLeafId = getLastLeafId(nodes, focusId);
  const leafCycleRootId = getLeafCycleRootId(nodes, focusId);
  const leafCycleLeaves = leafCycleRootId ? getLeafIdsInSubtree(nodes, leafCycleRootId) : [];
  const leafCycleEnabled = leafCycleLeaves.length > 1;
  const leafCycleIndex = leafCycleLeaves.indexOf(focusId);
  const focusHistoryState = focusHistoryRef.current;
  const historyBackTargetId = findStepFocus(
    { entries: focusHistoryState.entries, index: focusHistoryState.index },
    -1,
    (id) => !!nodes[id],
  ).focusId;
  const historyForwardTargetId = findStepFocus(
    { entries: focusHistoryState.entries, index: focusHistoryState.index },
    1,
    (id) => !!nodes[id],
  ).focusId;
  const historyStartStep = findEdgeFocus(
    { entries: focusHistoryState.entries, index: focusHistoryState.index },
    'start',
    (id) => !!nodes[id],
  );
  const historyEndStep = findEdgeFocus(
    { entries: focusHistoryState.entries, index: focusHistoryState.index },
    'end',
    (id) => !!nodes[id],
  );
  const historyStartTargetId = historyStartStep.focusId;
  const historyEndTargetId = historyEndStep.focusId;
  const historyBackLabel = historyBackTargetId ? (nodes[historyBackTargetId]?.text.trim() || historyBackTargetId) : null;
  const historyForwardLabel = historyForwardTargetId ? (nodes[historyForwardTargetId]?.text.trim() || historyForwardTargetId) : null;
  const historyStartLabel = historyStartTargetId ? (nodes[historyStartTargetId]?.text.trim() || historyStartTargetId) : null;
  const historyEndLabel = historyEndTargetId ? (nodes[historyEndTargetId]?.text.trim() || historyEndTargetId) : null;
  const canFocusBack = !!historyBackTargetId;
  const canFocusForward = !!historyForwardTargetId;
  const canFocusHistoryStart = !!historyStartTargetId && historyStartStep.state.index !== focusHistoryState.index;
  const canFocusHistoryEnd = !!historyEndTargetId && historyEndStep.state.index !== focusHistoryState.index;
  const focusHistoryCount = focusHistoryState.entries.length;
  const focusHistoryPosition = focusHistoryState.index + 1;

  const exportJson = () => exportJsonData(nodes);

  const exportPngClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportPng(el);
  };
  const exportSvgClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportSvg(el);
  };
  const exportPdfClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportPdf(el, nodes, pdfLayout);
  };
  const exportFreemindClick = () => exportFreemindData(nodes);

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
      resetFocusHistoryTo('n_root');
      setImportNotice({ text: `Imported ${Object.keys(nodes).length} nodes and reset focus history.`, kind: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON file.';
      setImportNotice({ text: message, kind: 'error' });
    }
  };

  const createShareLink = async () => {
    try {
      const link = encodeShareLink(nodes);
      await writeClipboard(link);
      setImportNotice({ text: 'Share link copied to clipboard!', kind: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create share link.';
      setImportNotice({ text: message, kind: 'error' });
    }
  };

  return (
    <div className="app">
      <a href="#mindmap-canvas" className="skip-link">Skip to canvas</a>
      <div className="toolbar" role="toolbar" aria-label="Mind Mapp actions" aria-orientation="horizontal">
        <strong>Mind Mapp</strong>
        <span style={{ color: '#666' }}>v{APP_VERSION}</span>
        <span style={{ color: '#666' }}>{Object.keys(nodes).length} nodes</span>
        <span style={{ color: '#666' }}>{selectedIds.length} selected</span>
        {selectedBounds ? <span style={{ color: '#666' }}>sel box {selectedBounds.width}×{selectedBounds.height}</span> : null}
        <span style={{ color: '#666' }}>zoom {Math.round(viewScale * 100)}%</span>
        {leafCycleEnabled ? <span style={{ color: '#666' }}>leaf {leafCycleIndex >= 0 ? leafCycleIndex + 1 : '•'}/{leafCycleLeaves.length}</span> : null}
        <span style={{ color: '#666' }}>hist {focusHistoryPosition}/{focusHistoryCount}</span>
        {focusPathSegments.length ? (
          <span className="toolbar-path" title={focusedPath} role="navigation" aria-label="Focused node breadcrumb path">
            {focusPathSegments.map((segment, index) => {
              const isCurrent = index === focusPathSegments.length - 1;
              return (
                <span key={segment.id}>
                  <button
                    className="toolbar-path-segment"
                    title={isCurrent ? `Current focus: ${segment.label}` : `Focus ${segment.label}`}
                    aria-label={isCurrent ? `Current breadcrumb node ${segment.label}` : `Focus breadcrumb node ${segment.label}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    disabled={isCurrent}
                    onClick={() => {
                      if (isCurrent) return;
                      setFocus(segment.id);
                      centerOnNode(segment.id);
                    }}
                  >
                    {segment.label}
                  </button>
                  {index < focusPathSegments.length - 1 ? <span className="toolbar-path-sep" aria-hidden="true">/</span> : null}
                </span>
              );
            })}
          </span>
        ) : null}
        <span style={{ color: '#666' }}>Press ? for shortcuts</span>
        {/* Screen-reader live region for dynamic status announcements */}
        <div id="mindmapp-status" aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }} />
        {importNotice ? (
          <span
            className={`toolbar-notice ${importNotice.kind === 'error' ? 'is-error' : 'is-success'}`}
            role={importNotice.kind === 'error' ? 'alert' : 'status'}
            aria-live={importNotice.kind === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            aria-describedby="mindmapp-status"
          >
            {importNotice.text}
            <button
              title="Dismiss notice"
              aria-label={`Dismiss ${importNotice.kind === 'error' ? 'error' : 'success'} notice`}
              onClick={() => setImportNotice(null)}
            >
              ×
            </button>
          </span>
        ) : null}
        <div id="mindmapp-primary-actions" className="toolbar-actions" role="group" aria-label="Primary actions">
          <button title="Undo (Cmd/Ctrl+Z)" aria-keyshortcuts="Control+Z Meta+Z" onClick={undo} disabled={!canUndo}>Undo</button>
          <button title="Redo (Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y)" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y" onClick={redo} disabled={!canRedo}>Redo</button>
          <button title="Fit to view (F)" aria-keyshortcuts="F" onClick={() => fitToView()}>Fit</button>
          <button title="Fit selected nodes (Alt+F)" aria-keyshortcuts="Alt+F" onClick={fitSelection}>Fit Sel</button>
          <button title="Fit focused subtree (Alt+Shift+F)" aria-keyshortcuts="Alt+Shift+F" onClick={fitFocusedSubtree}>Fit Sub</button>
          <button title="Center focused node (C)" aria-keyshortcuts="C" onClick={() => centerOnNode(focusId)}>Center</button>
          <button title="Center selected nodes (Alt+Shift+C)" aria-keyshortcuts="Alt+Shift+C" onClick={centerSelection}>Center Sel</button>
          <button title="Center focused subtree (Alt+Shift+B)" aria-keyshortcuts="Alt+Shift+B" onClick={centerSubtree}>Center Sub</button>
          <button title="Center root node (Shift+C)" aria-keyshortcuts="Shift+C" onClick={centerRoot}>Center Root</button>
          <button
            title={parentFocusId ? 'Jump focus to parent node (Shift+P)' : 'No parent node available'}
            aria-keyshortcuts="Shift+P"
            onClick={focusParentNode}
            disabled={!parentFocusId}
          >
            Parent Focus
          </button>
          <button
            title={childFocusId ? 'Jump focus to first child node (Shift+N)' : 'No child node available'}
            aria-keyshortcuts="Shift+N"
            onClick={focusChildNode}
            disabled={!childFocusId}
          >
            Child Focus
          </button>
          <button
            title={prevSiblingId ? 'Jump focus to previous sibling (Shift+H)' : 'No sibling available'}
            aria-keyshortcuts="Shift+H"
            onClick={() => focusSibling(-1)}
            disabled={!prevSiblingId}
          >
            Prev Sib
          </button>
          <button
            title={nextSiblingId ? 'Jump focus to next sibling (Shift+J)' : 'No sibling available'}
            aria-keyshortcuts="Shift+J"
            onClick={() => focusSibling(1)}
            disabled={!nextSiblingId}
          >
            Next Sib
          </button>
          <button
            title={firstLeafId ? 'Jump focus to first leaf in focused subtree (Shift+L)' : 'No leaf node available'}
            aria-keyshortcuts="Shift+L"
            onClick={focusSubtreeFirstLeaf}
            disabled={!firstLeafId}
          >
            Leaf Focus
          </button>
          <button
            title={lastLeafId ? 'Jump focus to last leaf in focused subtree (Shift+K)' : 'No leaf node available'}
            aria-keyshortcuts="Shift+K"
            onClick={focusSubtreeLastLeaf}
            disabled={!lastLeafId}
          >
            Last Leaf
          </button>
          <button
            title={leafCycleEnabled ? 'Jump focus to previous leaf in focused subtree (Shift+,)' : 'Leaf cycle unavailable (need multiple leaves in focus chain)'}
            aria-keyshortcuts="Shift+Comma"
            onClick={() => focusSubtreeLeafCycle(-1)}
            disabled={!leafCycleEnabled}
          >
            Prev Leaf
          </button>
          <button
            title={leafCycleEnabled ? 'Jump focus to next leaf in focused subtree (Shift+.)' : 'Leaf cycle unavailable (need multiple leaves in focus chain)'}
            aria-keyshortcuts="Shift+Period"
            onClick={() => focusSubtreeLeafCycle(1)}
            disabled={!leafCycleEnabled}
          >
            Next Leaf
          </button>
          <button title="Jump focus to root node (R)" aria-keyshortcuts="R" onClick={focusRoot}>Root</button>
          <button title={canFocusBack ? `Jump back to previous focus (Alt+R): ${historyBackLabel}` : 'No previous focus in history'} aria-keyshortcuts="Alt+R" onClick={focusPrevious} disabled={!canFocusBack}>Back</button>
          <button title={canFocusForward ? `Jump forward in focus history (Shift+R): ${historyForwardLabel}` : 'No forward focus history'} aria-keyshortcuts="Shift+R" onClick={focusForward} disabled={!canFocusForward}>Forward</button>
          <button title={canFocusHistoryStart ? `Jump to oldest focus in history (Alt+Shift+Home): ${historyStartLabel}` : 'Already at oldest focus history entry'} aria-keyshortcuts="Alt+Shift+Home" onClick={focusHistoryStart} disabled={!canFocusHistoryStart}>Hist Start</button>
          <button title={canFocusHistoryEnd ? `Jump to newest focus in history (Alt+Shift+End): ${historyEndLabel}` : 'Already at newest focus history entry'} aria-keyshortcuts="Alt+Shift+End" onClick={focusHistoryEnd} disabled={!canFocusHistoryEnd}>Hist End</button>
          <button title={focusHistoryCount > 1 ? 'Reset focus history to current node (Alt+Shift+Q)' : 'Focus history already reset'} aria-keyshortcuts="Alt+Shift+Q" onClick={resetFocusHistoryNow} disabled={focusHistoryCount <= 1}>Reset Hist</button>
          <button title="Toggle grid overlay (Shift+G)" aria-pressed={showGrid} aria-keyshortcuts="Shift+G" onClick={() => setShowGrid(v => !v)}>{showGrid ? 'Grid On' : 'Grid Off'}</button>
          <button title="Toggle Canvas Renderer (better performance for large maps)" aria-pressed={useCanvasRenderer} onClick={() => setUseCanvasRenderer(v => !v)}>{useCanvasRenderer ? "Canvas" : "SVG"}</button>
          <button
            title="Toggle mini-map (Shift+M)"
            aria-pressed={showMiniMap}
            aria-expanded={showMiniMap}
            aria-controls="mindmapp-mini-map"
            aria-keyshortcuts="Shift+M"
            onClick={() => setShowMiniMap(v => !v)}
          >
            {showMiniMap ? 'Mini-map On' : 'Mini-map Off'}
          </button>
          <button
            title="Show/Hide advanced actions (Shift+A)"
            aria-pressed={showAdvancedActions}
            aria-expanded={showAdvancedActions}
            aria-controls="mindmapp-advanced-actions"
            aria-keyshortcuts="Shift+A"
            onClick={() => setShowAdvancedActions(v => !v)}
          >
            {showAdvancedActions ? 'Advanced ▴' : 'Advanced ▾'}
          </button>
          <button
            title={searchOpen ? 'Hide search (Cmd/Ctrl+K)' : 'Show search (Cmd/Ctrl+K)'}
            aria-pressed={searchOpen}
            aria-expanded={searchOpen}
            aria-controls="mindmapp-search-dialog"
            aria-haspopup="dialog"
            aria-keyshortcuts={SEARCH_TOGGLE_ARIA_KEYSHORTCUTS}
            onClick={toggleSearchDialog}
          >
            {searchOpen ? 'Search On' : 'Search Off'}
          </button>
          <button
            title={helpOpen ? 'Hide shortcuts (? / Cmd/Ctrl+/)' : 'Show shortcuts (? / Cmd/Ctrl+/)'}
            aria-pressed={helpOpen}
            aria-expanded={helpOpen}
            aria-controls="mindmapp-help-dialog"
            aria-haspopup="dialog"
            aria-keyshortcuts={HELP_TOGGLE_ARIA_KEYSHORTCUTS}
            onClick={toggleHelpDialog}
          >
            {helpOpen ? 'Help On' : 'Help Off'}
          </button>
          <button
            title={versionHistoryOpen ? 'Hide version history (Alt+V)' : 'Version history (Alt+V)'}
            aria-pressed={versionHistoryOpen}
            aria-expanded={versionHistoryOpen}
            aria-controls="mindmapp-version-history"
            aria-haspopup="dialog"
            aria-keyshortcuts="Alt+V"
            onClick={toggleVersionHistory}
          >
            {versionHistoryOpen ? 'Versions On' : 'Versions'}
          </button>
          <StyleToolbar theme={theme} />
          <button
            title="Clear map"
            aria-label="Clear the entire mind map"
            onClick={() => {
              if (!confirmAction('Clear the entire map?')) return;
              resetMap();
              resetFocusHistoryTo('n_root', 'Cleared map and reset focus history.');
            }}
          >
            Clear
          </button>
          <button
            title="Load sample map"
            aria-label="Load sample mind map"
            onClick={() => {
              importState(sampleMap());
              resetFocusHistoryTo('n_root', 'Loaded sample map and reset focus history.');
            }}
          >
            Sample
          </button>
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
          <button title="Export JSON" aria-keyshortcuts="Control+S Meta+S" data-export="json" onClick={exportJson}>Export JSON</button>
          <button title="Create shareable link (copies to clipboard)" aria-label="Create share link" onClick={createShareLink}>Share Link</button>
          <button title="Export Markdown" aria-keyshortcuts="Control+Shift+M Meta+Shift+M" data-export="markdown" onClick={() => exportMarkdownData(nodes)}>Export MD</button>
          <button title="Copy selected/focused node text (Cmd/Ctrl+Shift+C)" aria-keyshortcuts="Control+Shift+C Meta+Shift+C" onClick={copySelectionText}>Copy Sel</button>
          <button title="Copy focused subtree outline (Cmd/Ctrl+Shift+L)" aria-keyshortcuts="Control+Shift+L Meta+Shift+L" onClick={copySubtreeText}>Copy Tree</button>
          <button title="Copy focused node path (Alt+Shift+P)" aria-keyshortcuts="Alt+Shift+P" onClick={copyFocusPath}>Copy Path</button>
          <button title="Export PNG" aria-keyshortcuts="Control+Shift+S Meta+Shift+S" data-export="png" onClick={exportPngClick}>Export PNG</button>
          <button title="Export SVG (vector)" aria-label="Export as SVG vector file" onClick={exportSvgClick}>Export SVG</button>
          <button title="Export FreeMind (.mm)" aria-label="Export as FreeMind XML file" onClick={exportFreemindClick}>Export FreeMind</button>
          <select title="PDF page layout" aria-label="PDF page layout" value={pdfLayout} onChange={e => setPdfLayout(e.target.value as typeof pdfLayout)} style={{ height: "28px", fontSize: "12px" }}>
            <option value="a4-portrait">A4 Portrait</option>
            <option value="a4-landscape">A4 Landscape</option>
            <option value="letter-portrait">Letter Portrait</option>
            <option value="letter-landscape">Letter Landscape</option>
            <option value="fit">Fit to Content</option>
          </select>
          <button title="Export PDF" aria-label="Export as PDF document" onClick={exportPdfClick}>Export PDF</button>
          <button title="Reset pan/zoom" aria-label="Reset pan and zoom to default view" aria-keyshortcuts="0" onClick={() => (window as any).__mindmappResetView?.()}>Reset View</button>
          <button title="Toggle theme (Shift+T)" aria-pressed={theme === 'dark'} aria-keyshortcuts="Shift+T" onClick={handleToggleTheme}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>

          {showAdvancedActions ? (
            <div id="mindmapp-advanced-actions" role="group" aria-label="Advanced toolbar actions">
              <button title="Select all nodes (Cmd/Ctrl+A)" aria-keyshortcuts="Control+A Meta+A" onClick={selectAll}>Select All</button>
              <button title="Invert selection (Alt+I)" aria-keyshortcuts="Alt+I" onClick={invertSelection}>Invert</button>
              <button title="Select siblings of focused node (Alt+S)" aria-keyshortcuts="Alt+S" onClick={selectSiblings}>Siblings</button>
              <button title="Select children of focused node (Alt+C)" aria-keyshortcuts="Alt+C" onClick={selectChildren}>Children</button>
              <button title="Select leaves under focused subtree (Alt+L)" aria-keyshortcuts="Alt+L" onClick={selectLeaves}>Leaves</button>
              <button title="Select focused node ancestors (Alt+U)" aria-keyshortcuts="Alt+U" onClick={selectAncestors}>Ancestors</button>
              <button title="Keep top-level nodes from selection (Alt+T)" aria-keyshortcuts="Alt+T" onClick={selectTopLevel}>Top-level</button>
              <button title="Select nodes at same depth (Alt+G)" aria-keyshortcuts="Alt+G" onClick={selectGeneration}>Generation</button>
              <button title="Clear selection extras (Alt+X)" aria-keyshortcuts="Alt+X" onClick={clearSelectionSet}>Clear Sel</button>
              <button title="Expand selection to neighbors (Alt+N)" aria-keyshortcuts="Alt+N" onClick={expandSelectionToNeighbors}>Neighbors</button>
              <button title="Align selected X to focus (Alt+Shift+X)" aria-keyshortcuts="Alt+Shift+X" onClick={() => alignSelection('x')}>Align X</button>
              <button title="Align selected Y to focus (Alt+Shift+Y)" aria-keyshortcuts="Alt+Shift+Y" onClick={() => alignSelection('y')}>Align Y</button>
              <button title="Distribute selected horizontally (Alt+Shift+H)" aria-keyshortcuts="Alt+Shift+H" onClick={() => distributeSelection('x')}>Dist X</button>
              <button title="Distribute selected vertically (Alt+Shift+V)" aria-keyshortcuts="Alt+Shift+V" onClick={() => distributeSelection('y')}>Dist Y</button>
              <button title="Layout selected as row from focus (Alt+Shift+R)" aria-keyshortcuts="Alt+Shift+R" onClick={() => layoutSelection('row')}>Layout Row</button>
              <button title="Layout selected as column from focus (Alt+Shift+D)" aria-keyshortcuts="Alt+Shift+D" onClick={() => layoutSelection('column')}>Layout Col</button>
              <button title="Snap selected to 20px grid (Alt+Shift+G)" aria-keyshortcuts="Alt+Shift+G" onClick={() => snapSelectionToGrid(20)}>Snap 20</button>
              <button title="Mirror selected across focused X axis (Alt+Shift+M)" aria-keyshortcuts="Alt+Shift+M" onClick={() => mirrorSelection('x')}>Mirror X</button>
              <button title="Mirror selected across focused Y axis (Alt+Shift+W)" aria-keyshortcuts="Alt+Shift+W" onClick={() => mirrorSelection('y')}>Mirror Y</button>
              <button title="Stack selected on X from focus (Alt+[)" aria-keyshortcuts="Alt+BracketLeft" onClick={() => stackSelection('x')}>Stack X</button>
              <button title="Stack selected on Y from focus (Alt+])" aria-keyshortcuts="Alt+BracketRight" onClick={() => stackSelection('y')}>Stack Y</button>
              <button title="Select focused subtree (Alt+B)" aria-keyshortcuts="Alt+B" onClick={selectSubtree}>Subtree</button>
              <button title="Select parent of focused node (Alt+P)" aria-keyshortcuts="Alt+P" onClick={selectParent}>Parent</button>
              <button title="Duplicate selected nodes (Cmd/Ctrl+D)" aria-keyshortcuts="Control+D Meta+D" onClick={duplicateSelected}>Duplicate</button>
            </div>
          ) : null}
        </div>
      </div>
      <div id="mindmap-canvas" className={`canvas ${showGrid ? 'grid-on' : ''}`} role="application" aria-label="Mind map canvas. Use arrow keys to navigate nodes, Enter to edit, Tab to add child, Delete to remove." tabIndex={-1}>
        {useCanvasRenderer ? <CanvasEdges nodes={nodes} /> : <Edges nodes={nodes} />}
        {Object.values(nodes).filter(n => !shouldVirtualize || visibleNodeIds.has(n.id)).map(n => (
          <Node key={n.id} node={n} isFocused={focusId === n.id} isSelected={selectedIds.includes(n.id)} isEditing={editingId === n.id} />
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
        <SearchDialog open={searchOpen} onClose={closeSearchDialog} />
        <HelpDialog open={helpOpen} onClose={closeHelpDialog} />
        <VersionHistoryDialogLazy
          open={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
          onSaveSnapshot={handleSaveSnapshot}
          onLoadSnapshot={handleLoadSnapshot}
        />
      </Suspense>
    </div>
  );
}

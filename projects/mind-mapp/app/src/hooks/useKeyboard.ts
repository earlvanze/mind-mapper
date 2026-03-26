import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { isTypingTarget } from '../utils/keyboardTarget';
import { isHelpToggleEvent } from '../utils/helpToggle';
import { LayoutMode } from '../utils/treeLayout';
import { isSearchToggleEvent } from '../utils/searchToggle';
import { COLOR_PRESETS } from '../utils/nodeStyles';

type Props = {
  onSearch: () => void;
  onFit: () => void;
  onFitSelection: () => void;
  onFitSubtree: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenterFocus: () => void;
  onCenterSelection: () => void;
  onCenterSubtree: () => void;
  onFocusParent: () => void;
  onFocusChild: () => void;
  onFocusPrevSibling: () => void;
  onFocusNextSibling: () => void;
  onFocusSubtreeFirstLeaf: () => void;
  onFocusSubtreeLastLeaf: () => void;
  onFocusPrevLeaf: () => void;
  onFocusNextLeaf: () => void;
  onFocusRoot: () => void;
  onFocusPrevious: () => void;
  onFocusForward: () => void;
  onFocusHistoryStart: () => void;
  onFocusHistoryEnd: () => void;
  onResetFocusHistory: () => void;
  onToggleGrid: () => void;
  onToggleMiniMap: () => void;
  onToggleAdvanced: () => void;
  onToggleTheme: () => void;
  onHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportMarkdown: () => void;
  onCopySelection: () => void;
  onCopySubtree: () => void;
  onCopyPath: () => void;
  onCenterRoot: () => void;
  onVersionHistory: () => void;
  suspended?: boolean;
};

export function useKeyboard({ onSearch, onFit, onFitSelection, onFitSubtree, onZoomIn, onZoomOut, onResetView, onCenterFocus, onCenterSelection, onCenterSubtree, onFocusParent, onFocusChild, onFocusPrevSibling, onFocusNextSibling, onFocusSubtreeFirstLeaf, onFocusSubtreeLastLeaf, onFocusPrevLeaf, onFocusNextLeaf, onFocusRoot, onFocusPrevious, onFocusForward, onFocusHistoryStart, onFocusHistoryEnd, onResetFocusHistory, onToggleGrid, onToggleMiniMap, onToggleAdvanced, onToggleTheme, onHelp, onUndo, onRedo, onExportMarkdown, onCopySelection, onCopySubtree, onCopyPath, onCenterRoot, suspended = false }: Props) {
  const { focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, autoLayoutChildren, autoLayout, setLayoutMode, nudgeSelected, editingId, startEditing, setSelectedStyle, selectedIds } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typingTarget = isTypingTarget(e.target);

      if (suspended) {
        if (isSearchToggleEvent(e)) { e.preventDefault(); onSearch(); }
        if (isHelpToggleEvent(e, typingTarget)) { e.preventDefault(); onHelp(); }
        return;
      }

      // Style shortcuts — Cmd/Ctrl+1-7 for color presets
      if ((e.metaKey || e.ctrlKey) && /^[1-7]$/.test(e.key) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const preset = COLOR_PRESETS[idx];
        if (preset && selectedIds.length > 0) {
          setSelectedStyle({ backgroundColor: preset.name, textColor: preset.name, borderColor: preset.name });
        }
        return;
      }

      // Cmd/Ctrl+0 — reset style
      if ((e.metaKey || e.ctrlKey) && e.key === '0' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          setSelectedStyle(undefined);
        }
        return;
      }

      // Cmd/Ctrl+Shift+R — reset style (alternate)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r' && !e.altKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          setSelectedStyle(undefined);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); onUndo(); return; }
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')) { e.preventDefault(); onRedo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAll(); return; }
      if (e.altKey && e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); invertSelection(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (e.altKey && e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectSiblings(); return; }
      if (e.altKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectChildren(); return; }
      if (e.altKey && e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectLeaves(); return; }
      if (e.altKey && e.key.toLowerCase() === 'u' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectAncestors(); return; }
      if (e.altKey && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectTopLevel(); return; }
      if (e.altKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectGeneration(); return; }
      if (e.altKey && e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); clearSelectionSet(); return; }
      if (e.altKey && e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); expandSelectionToNeighbors(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); alignSelection('x'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'y' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); alignSelection('y'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'h' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); distributeSelection('x'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); distributeSelection('y'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); layoutSelection('row'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); layoutSelection('column'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); snapSelectionToGrid(20); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); mirrorSelection('x'); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'w' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); mirrorSelection('y'); return; }
      if (e.altKey && e.key.toLowerCase() === '[' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); stackSelection('x'); return; }
      if (e.altKey && e.key.toLowerCase() === ']' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); stackSelection('y'); return; }
      if (e.altKey && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectSubtree(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onCopyPath(); return; }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); selectParent(); return; }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onFocusPrevious(); return; }
      if (e.altKey && e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); onVersionHistory(); return; }
      if (e.altKey && e.shiftKey && e.key === 'Home' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onFocusHistoryStart(); return; }
      if (e.altKey && e.shiftKey && e.key === 'End' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onFocusHistoryEnd(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'q' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onResetFocusHistory(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onFitSubtree(); return; }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onFitSelection(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onCenterSubtree(); return; }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onCenterSelection(); return; }
      if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onZoomIn(); return; }
      if (e.key === '-' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onZoomOut(); return; }
      if (e.key === '0' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onResetView(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleGrid(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleMiniMap(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleAdvanced(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleTheme(); return; }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) { onFit(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onCenterRoot(); return; }
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) { onCenterFocus(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusForward(); return; }
      if (!e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusRoot(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusParent(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusChild(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'h' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusPrevSibling(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusNextSibling(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusSubtreeFirstLeaf(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusSubtreeLastLeaf(); return; }
      if (e.shiftKey && (e.key === '<' || e.key === ',') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusPrevLeaf(); return; }
      if (e.shiftKey && (e.key === '>' || e.key === '.') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onFocusNextLeaf(); return; }
      const modes: LayoutMode[] = ['tree', 'radial', 'force'];
      const current = useMindMapStore.getState().layoutMode;
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      setLayoutMode(next); autoLayout(focusId); return;
      if (e.key.toLowerCase() === 'e') { startEditing(focusId); return; }
      if (isHelpToggleEvent(e, typingTarget)) { e.preventDefault(); onHelp(); return; }
      if (e.key === 'Enter') { e.preventDefault(); addSibling(focusId); return; }
      if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? promoteNode(focusId) : addChild(focusId); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !e.shiftKey) { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-export="json"]')?.click(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); document.querySelector<HTMLButtonElement>('button[data-export="png"]')?.click(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') { e.preventDefault(); onExportMarkdown(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); onCopySelection(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); onCopySubtree(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); deleteSelected(); return; }
      if (e.altKey && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 10;
        if (e.key === 'ArrowLeft') nudgeSelected(-step, 0);
        if (e.key === 'ArrowRight') nudgeSelected(step, 0);
        if (e.key === 'ArrowUp') nudgeSelected(0, -step);
        if (e.key === 'ArrowDown') nudgeSelected(0, step);
        return;
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus('left'); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus('right'); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus('up'); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus('down'); return; }
      if (e.key === 'Escape') { setFocus('n_root'); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus,
    selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves,
    selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors,
    selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection,
    snapSelectionToGrid, mirrorSelection, autoLayoutChildren, autoLayout, setLayoutMode, nudgeSelected, editingId, startEditing,
    setSelectedStyle, selectedIds,
    onSearch, onFit, onFitSelection, onFitSubtree, onZoomIn, onZoomOut, onResetView,
    onCenterFocus, onCenterSelection, onCenterSubtree, onFocusParent, onFocusChild,
    onFocusPrevSibling, onFocusNextSibling, onFocusSubtreeFirstLeaf, onFocusSubtreeLastLeaf,
    onFocusPrevLeaf, onFocusNextLeaf, onFocusRoot, onFocusPrevious, onFocusForward,
    onFocusHistoryStart, onFocusHistoryEnd, onResetFocusHistory,
    onToggleGrid, onToggleMiniMap, onToggleAdvanced, onToggleTheme, onHelp,
    onUndo, onRedo, onExportMarkdown, onCopySelection, onCopySubtree, onCopyPath, onCenterRoot,
    onVersionHistory,
    suspended,
  ]);
}

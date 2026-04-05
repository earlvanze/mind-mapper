import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { loadShortcutsPrefs, checkCustomBinding, getHandlerNameForAction, type ShortcutAction } from '../utils/keyboardShortcuts';
import { isTypingTarget } from '../utils/keyboardTarget';
import { isHelpToggleEvent } from '../utils/helpToggle';
import { LayoutMode } from '../utils/treeLayout';
import { isSearchToggleEvent } from '../utils/searchToggle';
import { getKeyboardPref } from '../utils/uiPrefs';
import { COLOR_PRESETS } from '../utils/nodeStyles';

type Props = {
  onSearch: () => void;
  onFit: () => void;
  onFitSelection: () => void;
  onFitSubtree: () => void;
  onTagPicker: () => void;
  onTagFilter: () => void;
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


  onToggleCollapse: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onVersionHistory: () => void;
  onPresentation: () => void;
  suspended?: boolean;
  /** Map of handler callback props, e.g. { onSearch: fn, onFit: fn } */
  handlers?: Partial<Record<string, () => void>>;
};

export function useKeyboard({ onSearch, onFit, onFitSelection, onFitSubtree, onTagPicker, onTagFilter, onZoomIn, onZoomOut, onResetView, onCenterFocus, onCenterSelection, onCenterSubtree, onFocusParent, onFocusChild, onFocusPrevSibling, onFocusNextSibling, onFocusSubtreeFirstLeaf, onFocusSubtreeLastLeaf, onFocusPrevLeaf, onFocusNextLeaf, onFocusRoot, onFocusPrevious, onFocusForward, onFocusHistoryStart, onFocusHistoryEnd, onResetFocusHistory, onToggleGrid, onToggleMiniMap, onToggleAdvanced, onToggleTheme, onHelp, onUndo, onRedo, onExportMarkdown, onCopySelection, onCopySubtree, onCopyPath, onCenterRoot, onToggleCollapse, onCollapseAll, onExpandAll, onVersionHistory, onPresentation, suspended = false, handlers = {} }: Props) {
  const { focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, autoLayoutChildren, autoLayout, setLayoutMode, nudgeSelected, editingId, startEditing, setSelectedStyle, selectedIds, toggleNodeCollapsed, collapseAll, expandAll } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typingTarget = isTypingTarget(e.target);

      // Check custom bindings first — if matched, dispatch to the registered handler
      const prefs = loadShortcutsPrefs();
      const matchedAction = checkCustomBinding(e, prefs);
      if (matchedAction) {
        const handlerName = getHandlerNameForAction(matchedAction);
        const handler = (handlers as any)[handlerName];
        if (handler) {
          e.preventDefault();
          handler();
          return;
        }
      }

      if (suspended) {
        if (isSearchToggleEvent(e)) { e.preventDefault(); onSearch(); }
        if (isHelpToggleEvent(e, typingTarget)) { e.preventDefault(); onHelp(); }
        return;
      }

      // Cmd/Ctrl+Shift+T — open tag picker dialog
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        onTagPicker();
        return;
      }

      // Cmd/Ctrl+Shift+F — toggle tag filter panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onTagFilter();
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
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !typingTarget) { e.preventDefault(); onPresentation(); return; }
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
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onFit(); return; }
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onCenterFocus(); return; }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onToggleGrid(); return; }
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onToggleMiniMap(); return; }
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { 
        e.preventDefault(); 
        const modes: LayoutMode[] = ['tree', 'radial', 'force'];
        const currentIdx = modes.indexOf(useMindMapStore.getState().layoutMode);
        const nextIdx = (currentIdx + 1) % modes.length;
        setLayoutMode(modes[nextIdx]);
        autoLayout();
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) { 
        e.preventDefault(); 
        autoLayoutChildren(focusId);
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleTheme(); return; }
      if (e.shiftKey && e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleAdvanced(); return; }
      if (e.key === 'Home' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onFocusRoot(); return; }
      if (e.key === 'End' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); onCenterRoot(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') { e.preventDefault(); onExportMarkdown(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); onCopySelection(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); onCopySubtree(); return; }
      if (isSearchToggleEvent(e)) { e.preventDefault(); onSearch(); return; }
      if (isHelpToggleEvent(e, typingTarget)) { e.preventDefault(); onHelp(); return; }

      // Collapse/expand focused node (/) — only when not typing
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onToggleCollapse();
        return;
      }

      if (editingId || typingTarget) return;

      if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus('up'); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus('down'); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onFocusParent(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); onFocusChild(); return; }
      if (e.key === 'PageUp') { e.preventDefault(); onFocusPrevSibling(); return; }
      if (e.key === 'PageDown') { e.preventDefault(); onFocusNextSibling(); return; }
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); addSibling(); return; }
      if (e.key === 'Enter') { e.preventDefault(); addChild(); return; }
      if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); promoteNode(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
      if (e.key === 'F2') { e.preventDefault(); if (focusId) startEditing(focusId); return; }
      if (e.key === '[') { e.preventDefault(); onFocusPrevLeaf(); return; }
      if (e.key === ']') { e.preventDefault(); onFocusNextLeaf(); return; }
      if (e.key === '{') { e.preventDefault(); onFocusSubtreeFirstLeaf(); return; }
      if (e.key === '}') { e.preventDefault(); onFocusSubtreeLastLeaf(); return; }
      if (e.key === '<') { e.preventDefault(); onFocusPrevious(); return; }
      if (e.key === '>') { e.preventDefault(); onFocusForward(); return; }

      // Arrow nudging (Shift+Arrow)
      if (e.shiftKey && e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -getKeyboardPref('nudge')); return; }
      if (e.shiftKey && e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, getKeyboardPref('nudge')); return; }
      if (e.shiftKey && e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-getKeyboardPref('nudge'), 0); return; }
      if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(getKeyboardPref('nudge'), 0); return; }
      // Large arrow nudging (Shift+Alt+Arrow)
      if (e.shiftKey && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -getKeyboardPref('nudgeLarge')); return; }
      if (e.shiftKey && e.altKey && e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, getKeyboardPref('nudgeLarge')); return; }
      if (e.shiftKey && e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-getKeyboardPref('nudgeLarge'), 0); return; }
      if (e.shiftKey && e.altKey && e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(getKeyboardPref('nudgeLarge'), 0); return; }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focusId, editingId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, onSearch, onFit, onFitSelection, onFitSubtree, onTagPicker, onTagFilter, onZoomIn, onZoomOut, onResetView, onCenterFocus, onCenterSelection, onCenterSubtree, onFocusParent, onFocusChild, onFocusPrevSibling, onFocusNextSibling, onFocusSubtreeFirstLeaf, onFocusSubtreeLastLeaf, onFocusPrevLeaf, onFocusNextLeaf, onFocusRoot, onFocusPrevious, onFocusForward, onFocusHistoryStart, onFocusHistoryEnd, onResetFocusHistory, onToggleGrid, onToggleMiniMap, onToggleAdvanced, onToggleTheme, onHelp, onUndo, onRedo, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, autoLayoutChildren, autoLayout, setLayoutMode, nudgeSelected, startEditing, setSelectedStyle, selectedIds, onExportMarkdown, onCopySelection, onCopySubtree, onCopyPath, onCenterRoot, onToggleCollapse, onCollapseAll, onExpandAll, onPresentation, suspended, handlers]);
}

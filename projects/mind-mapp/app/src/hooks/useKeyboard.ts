import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { isTypingTarget } from '../utils/keyboardTarget';
import { isHelpToggleEvent } from '../utils/helpToggle';
import { isSearchToggleEvent } from '../utils/searchToggle';

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
  suspended?: boolean;
};

export function useKeyboard({ onSearch, onFit, onFitSelection, onFitSubtree, onZoomIn, onZoomOut, onResetView, onCenterFocus, onCenterSelection, onCenterSubtree, onFocusParent, onFocusChild, onFocusPrevSibling, onFocusNextSibling, onFocusSubtreeFirstLeaf, onFocusSubtreeLastLeaf, onFocusPrevLeaf, onFocusNextLeaf, onFocusRoot, onFocusPrevious, onFocusForward, onFocusHistoryStart, onFocusHistoryEnd, onResetFocusHistory, onToggleGrid, onToggleMiniMap, onToggleAdvanced, onToggleTheme, onHelp, onUndo, onRedo, onExportMarkdown, onCopySelection, onCopySubtree, onCopyPath, onCenterRoot, suspended = false }: Props) {
  const { focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, autoLayoutChildren, nudgeSelected, editingId, startEditing } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typingTarget = isTypingTarget(e.target);

      if (suspended) {
        if (isSearchToggleEvent(e)) {
          e.preventDefault();
          onSearch();
        }
        if (isHelpToggleEvent(e, typingTarget)) {
          e.preventDefault();
          onHelp();
        }
        return;
      }

      if (editingId) return;
      if (isSearchToggleEvent(e)) {
        e.preventDefault();
        onSearch();
        return;
      }
      if (typingTarget) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        onRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      }
      if (e.altKey && e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        invertSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      if (e.altKey && e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectSiblings();
      }
      if (e.altKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectChildren();
      }
      if (e.altKey && e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectLeaves();
      }
      if (e.altKey && e.key.toLowerCase() === 'u' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectAncestors();
      }
      if (e.altKey && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectTopLevel();
      }
      if (e.altKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectGeneration();
      }
      if (e.altKey && e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        clearSelectionSet();
      }
      if (e.altKey && e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        expandSelectionToNeighbors();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        alignSelection('x');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'y' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        alignSelection('y');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'h' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        distributeSelection('x');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        distributeSelection('y');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        layoutSelection('row');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        layoutSelection('column');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        snapSelectionToGrid(20);
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        mirrorSelection('x');
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'w' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        mirrorSelection('y');
      }
      if (e.altKey && e.key.toLowerCase() === '[' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        stackSelection('x');
      }
      if (e.altKey && e.key.toLowerCase() === ']' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        stackSelection('y');
      }
      if (e.altKey && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectSubtree();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onCopyPath();
      }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectParent();
      }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFocusPrevious();
      }
      if (e.altKey && e.shiftKey && e.key === 'Home' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFocusHistoryStart();
      }
      if (e.altKey && e.shiftKey && e.key === 'End' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFocusHistoryEnd();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'q' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onResetFocusHistory();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFitSubtree();
      }
      if (e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFitSelection();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onCenterSubtree();
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onCenterSelection();
      }
      if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onZoomIn();
      }
      if (e.key === '-' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onZoomOut();
      }
      if (e.key === '0' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onResetView();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleGrid();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleMiniMap();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleAdvanced();
      }
      if (e.shiftKey && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleTheme();
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        onFit();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onCenterRoot();
      }
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        onCenterFocus();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusForward();
      }
      if (!e.shiftKey && e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusRoot();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusParent();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusChild();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'h' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusPrevSibling();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusNextSibling();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusSubtreeFirstLeaf();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusSubtreeLastLeaf();
      }
      if (e.shiftKey && (e.key === '<' || e.key === ',') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusPrevLeaf();
      }
      if (e.shiftKey && (e.key === '>' || e.key === '.') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onFocusNextLeaf();
      }
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        autoLayoutChildren(focusId);
      }
      if (e.key.toLowerCase() === 'e') {
        startEditing(focusId);
      }
      if (isHelpToggleEvent(e, typingTarget)) {
        e.preventDefault();
        onHelp();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        addSibling(focusId);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          promoteNode(focusId);
        } else {
          addChild(focusId);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        const btn = document.querySelector('button[data-export="json"]') as HTMLButtonElement | null;
        btn?.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const btn = document.querySelector('button[data-export="png"]') as HTMLButtonElement | null;
        btn?.click();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onExportMarkdown();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCopySelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onCopySubtree();
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.altKey && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 10;
        if (e.key === 'ArrowLeft') nudgeSelected(-step, 0);
        if (e.key === 'ArrowRight') nudgeSelected(step, 0);
        if (e.key === 'ArrowUp') nudgeSelected(0, -step);
        if (e.key === 'ArrowDown') nudgeSelected(0, step);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveFocus('left');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveFocus('right');
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus('up');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus('down');
      }
      if (e.key === 'Escape') {
        setFocus('n_root');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    focusId,
    addSibling,
    addChild,
    promoteNode,
    deleteSelected,
    duplicateSelected,
    moveFocus,
    selectParent,
    setFocus,
    selectAll,
    invertSelection,
    selectSiblings,
    selectChildren,
    selectLeaves,
    selectAncestors,
    selectTopLevel,
    selectGeneration,
    clearSelectionSet,
    expandSelectionToNeighbors,
    selectSubtree,
    alignSelection,
    distributeSelection,
    layoutSelection,
    stackSelection,
    snapSelectionToGrid,
    mirrorSelection,
    autoLayoutChildren,
    nudgeSelected,
    editingId,
    startEditing,
    onSearch,
    onFit,
    onFitSelection,
    onFitSubtree,
    onZoomIn,
    onZoomOut,
    onResetView,
    onCenterFocus,
    onCenterSelection,
    onCenterSubtree,
    onFocusParent,
    onFocusChild,
    onFocusPrevSibling,
    onFocusNextSibling,
    onFocusSubtreeFirstLeaf,
    onFocusSubtreeLastLeaf,
    onFocusPrevLeaf,
    onFocusNextLeaf,
    onFocusRoot,
    onFocusPrevious,
    onFocusForward,
    onFocusHistoryStart,
    onFocusHistoryEnd,
    onResetFocusHistory,
    onToggleGrid,
    onToggleMiniMap,
    onToggleAdvanced,
    onToggleTheme,
    onHelp,
    onUndo,
    onRedo,
    onExportMarkdown,
    onCopySelection,
    onCopySubtree,
    onCopyPath,
    onCenterRoot,
    suspended,
  ]);
}

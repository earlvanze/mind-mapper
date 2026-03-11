import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

type Props = {
  onSearch: () => void;
  onFit: () => void;
  onFitSelection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterFocus: () => void;
  onToggleGrid: () => void;
  onToggleMiniMap: () => void;
  onToggleAdvanced: () => void;
  onHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportMarkdown: () => void;
};

export function useKeyboard({ onSearch, onFit, onFitSelection, onZoomIn, onZoomOut, onCenterFocus, onToggleGrid, onToggleMiniMap, onToggleAdvanced, onHelp, onUndo, onRedo, onExportMarkdown }: Props) {
  const { focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectLeaves, selectAncestors, selectTopLevel, selectGeneration, clearSelectionSet, expandSelectionToNeighbors, selectSubtree, alignSelection, distributeSelection, layoutSelection, stackSelection, snapSelectionToGrid, mirrorSelection, autoLayoutChildren, nudgeSelected, editingId, startEditing } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
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
      if (e.altKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectParent();
      }
      if (e.altKey && e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onFitSelection();
      }
      if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onZoomIn();
      }
      if (e.key === '-' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onZoomOut();
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
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        onFit();
      }
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        onCenterFocus();
      }
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey) {
        autoLayoutChildren(focusId);
      }
      if (e.key.toLowerCase() === 'e') {
        startEditing(focusId);
      }
      if (e.key === '?') {
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
    onZoomIn,
    onZoomOut,
    onCenterFocus,
    onToggleGrid,
    onToggleMiniMap,
    onToggleAdvanced,
    onHelp,
    onUndo,
    onRedo,
    onExportMarkdown,
  ]);
}

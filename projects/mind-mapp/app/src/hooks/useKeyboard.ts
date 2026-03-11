import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

type Props = {
  onSearch: () => void;
  onFit: () => void;
  onCenterFocus: () => void;
  onHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportMarkdown: () => void;
};

export function useKeyboard({ onSearch, onFit, onCenterFocus, onHelp, onUndo, onRedo, onExportMarkdown }: Props) {
  const { focusId, addSibling, addChild, promoteNode, deleteSelected, duplicateSelected, moveFocus, selectParent, setFocus, selectAll, invertSelection, selectSiblings, selectChildren, selectSubtree, autoLayoutChildren, nudgeSelected, editingId, startEditing } = useMindMapStore();

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
      if (e.altKey && e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectSubtree();
      }
      if (e.altKey && e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectParent();
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
    selectSubtree,
    autoLayoutChildren,
    nudgeSelected,
    editingId,
    startEditing,
    onSearch,
    onFit,
    onCenterFocus,
    onHelp,
    onUndo,
    onRedo,
    onExportMarkdown,
  ]);
}

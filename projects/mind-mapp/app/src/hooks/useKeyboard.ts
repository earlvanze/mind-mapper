import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

type Props = { onSearch: () => void; onFit: () => void; onHelp: () => void };

export function useKeyboard({ onSearch, onFit, onHelp }: Props) {
  const { focusId, addSibling, addChild, deleteNode, moveFocus, setFocus, autoLayoutChildren, editingId, startEditing } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        onFit();
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
        addChild(focusId);
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteNode(focusId);
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
  }, [focusId, addSibling, addChild, onSearch]);
}

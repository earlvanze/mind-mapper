import { useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

type Props = { onSearch: () => void };

export function useKeyboard({ onSearch }: Props) {
  const { focusId, addSibling, addChild, deleteNode } = useMindMapStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusId, addSibling, addChild, onSearch]);
}

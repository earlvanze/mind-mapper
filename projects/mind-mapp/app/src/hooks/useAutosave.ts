import { useEffect } from 'react';

export function useAutosave(onSave: () => void, delay = 500) {
  useEffect(() => {
    let t: number | undefined;
    const handler = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => onSave(), delay);
    };
    window.addEventListener('keyup', handler);
    window.addEventListener('mouseup', handler);
    return () => {
      window.removeEventListener('keyup', handler);
      window.removeEventListener('mouseup', handler);
      if (t) window.clearTimeout(t);
    };
  }, [onSave, delay]);
}

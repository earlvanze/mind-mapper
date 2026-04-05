import { Node } from '../store/useMindMapStore';

export function exportJsonData(nodes: Record<string, Node>) {
  const data = { version: 1, exportedAt: new Date().toISOString(), nodes };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmapp.json';
  a.click();
  URL.revokeObjectURL(url);
}

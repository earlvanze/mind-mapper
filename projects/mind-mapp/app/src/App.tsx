import { useState } from 'react';
import { useMindMapStore } from './store/useMindMapStore';
import Node from './components/Node';
import { useKeyboard } from './hooks/useKeyboard';
import { exportPng } from './utils/exportPng';
import SearchDialog from './components/SearchDialog';

export default function App() {
  const { nodes, importState } = useMindMapStore();
  const [searchOpen, setSearchOpen] = useState(false);
  useKeyboard({ onSearch: () => setSearchOpen(true) });

  const exportJson = () => {
    const data = { nodes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmapp.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPngClick = async () => {
    const el = document.querySelector('.canvas') as HTMLElement | null;
    if (!el) return;
    await exportPng(el);
  };

  const importJson = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed?.nodes) importState(parsed.nodes);
  };

  return (
    <div className="app">
      <div className="toolbar">
        <strong>Mind Mapp</strong>
        <span style={{ color: '#666' }}>MVP scaffold</span>
        <div className="toolbar-actions">
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
          <button onClick={exportJson}>Export JSON</button>
          <button onClick={exportPngClick}>Export PNG</button>
        </div>
      </div>
      <div className="canvas">
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

import { useState } from 'react';
import { useMindMapStore } from './store/useMindMapStore';
import Node from './components/Node';
import Edges from './components/Edges';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanZoom } from './hooks/usePanZoom';
import { exportPng } from './utils/exportPng';
import { fitToView } from './utils/fitToView';
import SearchDialog from './components/SearchDialog';
import HelpDialog from './components/HelpDialog';

export default function App() {
  const { nodes, importState } = useMindMapStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboard({ onSearch: () => setSearchOpen(true), onFit: () => fitToView(), onHelp: () => setHelpOpen(true) });
  usePanZoom({ selector: '.canvas' });

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
        <Edges nodes={nodes} />
        {Object.values(nodes).map(n => (
          <Node key={n.id} node={n} />
        ))}
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

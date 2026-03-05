import { useState } from 'react';
import { useMindMapStore, saveState } from './store/useMindMapStore';
import Node from './components/Node';
import Edges from './components/Edges';
import { useKeyboard } from './hooks/useKeyboard';
import { usePanZoom } from './hooks/usePanZoom';
import { useAutosave } from './hooks/useAutosave';
import { exportPng } from './utils/exportPng';
import { exportJsonData } from './utils/exportJson';
import { fitToView } from './utils/fitToView';
import { confirmAction } from './utils/confirm';
import { sampleMap } from './utils/sampleMap';
import { APP_VERSION } from './utils/version';
import SearchDialog from './components/SearchDialog';
import HelpDialog from './components/HelpDialog';

export default function App() {
  const { nodes, importState, resetMap } = useMindMapStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboard({ onSearch: () => setSearchOpen(true), onFit: () => fitToView(), onHelp: () => setHelpOpen(true) });
  usePanZoom({ selector: '.canvas' });
  useAutosave(() => saveState(), 600);

  const exportJson = () => exportJsonData(nodes);

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
        <span style={{ color: '#666' }}>v{APP_VERSION}</span>
        <span style={{ color: '#666' }}>{Object.keys(nodes).length} nodes</span>
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
          <button title="Fit to view" onClick={() => fitToView()}>Fit</button>
          <button title="Show shortcuts" onClick={() => setHelpOpen(true)}>Help</button>
          <button
            title="Clear map"
            onClick={() => {
              if (confirmAction('Clear the entire map?')) resetMap();
            }}
          >
            Clear
          </button>
          <button title="Load sample map" onClick={() => importState(sampleMap())}>Sample</button>
          <button title="Export JSON" data-export="json" onClick={exportJson}>Export JSON</button>
          <button title="Export PNG" onClick={exportPngClick}>Export PNG</button>
          <button title="Reset pan/zoom" onClick={() => (window as any).__mindmappResetView?.()}>Reset View</button>
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

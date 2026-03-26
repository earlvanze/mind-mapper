import { useState, useRef, useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { COLOR_PRESETS, SHAPE_OPTIONS, FONT_SIZE_OPTIONS, resolveStyle, type ColorPresetName, type Shape } from '../utils/nodeStyles';
import type { Theme } from '../utils/theme';

type Props = {
  theme: Theme;
};

const PRESET_COLORS: Array<{ name: ColorPresetName; hex: string }> = [
  { name: 'default',  hex: '#ffffff' },
  { name: 'primary',  hex: '#3b82f6' },
  { name: 'success',  hex: '#10b981' },
  { name: 'warning',  hex: '#f59e0b' },
  { name: 'danger',   hex: '#ef4444' },
  { name: 'info',     hex: '#06b6d4' },
  { name: 'muted',    hex: '#9ca3af' },
];

const SHORTCUT_LABELS = ['1','2','3','4','5','6','7'] as const;

export default function StyleToolbar({ theme }: Props) {
  const { selectedIds, setSelectedStyle, nodes } = useMindMapStore();
  const [openPicker, setOpenPicker] = useState<'color' | 'shape' | 'icon' | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedIds.length > 0;

  // Close picker on outside click
  useEffect(() => {
    if (!openPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenPicker(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPicker]);

  const applyPreset = (name: ColorPresetName) => {
    if (!hasSelection) return;
    setSelectedStyle({ backgroundColor: name, textColor: name, borderColor: name });
    setOpenPicker(null);
  };

  const applyShape = (shape: Shape) => {
    if (!hasSelection) return;
    setSelectedStyle({ shape });
    setOpenPicker(null);
  };

  const applyFontSize = (fontSize: string) => {
    if (!hasSelection) return;
    setSelectedStyle({ fontSize: fontSize as 'small' | 'medium' | 'large' });
    setOpenPicker(null);
  };

  const applyColor = (which: 'backgroundColor' | 'textColor' | 'borderColor', value: string) => {
    if (!hasSelection) return;
    setSelectedStyle({ [which]: value });
  };

  const applyIcon = (icon: string) => {
    if (!hasSelection) return;
    setSelectedStyle({ icon });
    setOpenPicker(null);
  };

  const resetStyle = () => {
    if (!hasSelection) return;
    setSelectedStyle(undefined);
    setOpenPicker(null);
  };

  // Get current style of focused node for preview
  const focusedNode = nodes[selectedIds[0]];
  const currentStyle = focusedNode?.style;

  const renderColorPicker = () => (
    <div className="style-picker-content">
      <div className="style-picker-section">
        <span className="style-picker-label">Preset</span>
        <div className="style-preset-grid">
          {PRESET_COLORS.map((p, i) => (
            <button
              key={p.name}
              className="style-preset-btn"
              title={`${p.name} (Cmd+${i+1})`}
              style={{ backgroundColor: p.hex, border: '2px solid ' + (p.hex === '#ffffff' ? '#ccc' : p.hex) }}
              onClick={() => applyPreset(p.name)}
              aria-label={`${p.name} preset`}
            >
              {currentStyle?.backgroundColor === p.name ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">Background</span>
        <input
          type="color"
          className="style-color-input"
          defaultValue={currentStyle?.backgroundColor && !COLOR_PRESETS.find(p=>p.name===currentStyle.backgroundColor) ? currentStyle.backgroundColor : (theme === 'dark' ? '#1f2937' : '#ffffff')}
          onChange={e => applyColor('backgroundColor', e.target.value)}
          aria-label="Background color"
        />
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">Text</span>
        <input
          type="color"
          className="style-color-input"
          defaultValue={currentStyle?.textColor && !COLOR_PRESETS.find(p=>p.name===currentStyle.textColor) ? currentStyle.textColor : (theme === 'dark' ? '#f9fafb' : '#111827')}
          onChange={e => applyColor('textColor', e.target.value)}
          aria-label="Text color"
        />
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">Border</span>
        <input
          type="color"
          className="style-color-input"
          defaultValue={currentStyle?.borderColor && !COLOR_PRESETS.find(p=>p.name===currentStyle.borderColor) ? currentStyle.borderColor : (theme === 'dark' ? '#4b5563' : '#d1d5db')}
          onChange={e => applyColor('borderColor', e.target.value)}
          aria-label="Border color"
        />
      </div>
    </div>
  );

  const renderShapePicker = () => (
    <div className="style-picker-content">
      <div className="style-picker-section">
        <span className="style-picker-label">Shape</span>
        <div className="style-shape-grid">
          {SHAPE_OPTIONS.map(s => (
            <button
              key={s.value}
              className={`style-shape-btn ${currentStyle?.shape === s.value ? 'active' : ''}`}
              title={s.label}
              onClick={() => applyShape(s.value)}
              aria-label={`Shape: ${s.label}`}
            >
              <ShapePreview shape={s.value} />
            </button>
          ))}
        </div>
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">Border Width</span>
        <input
          type="range"
          min={1}
          max={5}
          defaultValue={currentStyle?.borderWidth ?? 1}
          onChange={e => setSelectedStyle({ borderWidth: Number(e.target.value) })}
          aria-label="Border width"
        />
      </div>
    </div>
  );

  const EMOJI_OPTIONS = ['🔥','⭐','💡','✅','❌','⚠️','📌','📝','🎯','🚀','💰','🏠','📊','🔧','🌟','💬','📈','🛠️','🎨','✨'];

  const renderIconPicker = () => (
    <div className="style-picker-content">
      <div className="style-picker-section">
        <span className="style-picker-label">Emoji</span>
        <div className="style-emoji-grid">
          {EMOJI_OPTIONS.map(e => (
            <button
              key={e}
              className={`style-emoji-btn ${currentStyle?.icon === e ? 'active' : ''}`}
              title={e}
              onClick={() => applyIcon(e)}
              aria-label={`Icon: ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="style-picker-section">
        <button className="style-action-btn" onClick={() => applyIcon('')}>Remove Icon</button>
      </div>
    </div>
  );

  return (
    <div className="style-toolbar" ref={pickerRef} role="toolbar" aria-label="Node styling">
      {/* Color */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'color' ? 'active' : ''}`}
          title="Color presets (Alt+Shift+C)"
          aria-haspopup="true"
          aria-expanded={openPicker === 'color'}
          onClick={() => setOpenPicker(o => o === 'color' ? null : 'color')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">🎨</span> Color
        </button>
        {openPicker === 'color' && (
          <div className="style-picker" role="dialog" aria-label="Color picker">
            {renderColorPicker()}
          </div>
        )}
      </div>

      {/* Shape */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'shape' ? 'active' : ''}`}
          title="Shape picker"
          aria-haspopup="true"
          aria-expanded={openPicker === 'shape'}
          onClick={() => setOpenPicker(o => o === 'shape' ? null : 'shape')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">⬜</span> Shape
        </button>
        {openPicker === 'shape' && (
          <div className="style-picker" role="dialog" aria-label="Shape picker">
            {renderShapePicker()}
          </div>
        )}
      </div>

      {/* Icon */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'icon' ? 'active' : ''}`}
          title="Icon picker"
          aria-haspopup="true"
          aria-expanded={openPicker === 'icon'}
          onClick={() => setOpenPicker(o => o === 'icon' ? null : 'icon')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">😀</span> Icon
        </button>
        {openPicker === 'icon' && (
          <div className="style-picker" role="dialog" aria-label="Icon picker">
            {renderIconPicker()}
          </div>
        )}
      </div>


      {/* Reset */}
      <button
        className="style-toolbar-btn style-reset-btn"
        title="Reset style (Cmd+Shift+R)"
        onClick={resetStyle}
        disabled={!hasSelection}
      >
        Reset
      </button>
    </div>
  );
}

function ShapePreview({ shape }: { shape: Shape }) {
  const size = 24;
  if (shape === 'ellipse') {
    return <svg width={size} height={size} viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/></svg>;
  }
  if (shape === 'diamond') {
    return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/></svg>;
  }
  if (shape === 'rounded') {
    return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/></svg>;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

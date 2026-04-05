import { useState, useRef, useEffect, useId } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { COLOR_PRESETS, SHAPE_OPTIONS, FONT_SIZE_OPTIONS, resolveStyle, type ColorPresetName, type Shape } from '../utils/nodeStyles';
import type { Attachment } from '../store/useMindMapStore';
import { validateAttachment, buildAttachment, downloadAttachment, formatFileSize, fileToBase64 } from '../utils/attachments';
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

const PICKER_IDS = {
  color: 'style-picker-color',
  shape: 'style-picker-shape',
  icon: 'style-picker-icon',
  image: 'style-picker-image',
  link: 'style-picker-link',
  file: 'style-picker-file',
} as const;

export default function StyleToolbar({ theme }: Props) {
  const { selectedIds, setSelectedStyle, nodes } = useMindMapStore();
  const [openPicker, setOpenPicker] = useState<'color' | 'shape' | 'icon' | 'image' | 'link' | 'file' | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const hasSelection = selectedIds.length > 0;
  const pickerId = openPicker ? PICKER_IDS[openPicker] : null;

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

  // Focus trap: Tab/Shift+Tab cycle within open picker; Escape closes
  useEffect(() => {
    if (!openPicker || !pickerId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpenPicker(null);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;

      const picker = document.getElementById(pickerId);
      if (!picker) return;

      const focusable = Array.from(
        picker.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
        )
      ).filter(el => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [openPicker, pickerId]);

  const openPickerPanel = (picker: typeof openPicker) => {
    setOpenPicker(p => p === picker ? null : picker);
  };

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

  const applyImage = (imageUrl: string) => {
    if (!hasSelection) return;
    setSelectedStyle({ imageUrl });
    setOpenPicker(null);
  };

  const removeImage = () => {
    if (!hasSelection) return;
    setSelectedStyle({ imageUrl: undefined });
    setOpenPicker(null);
  };

  const applyLink = (linkUrl: string) => {
    if (!hasSelection) return;
    setSelectedStyle({ linkUrl });
    setOpenPicker(null);
  };

  const removeLink = () => {
    if (!hasSelection) return;
    setSelectedStyle({ linkUrl: undefined });
    setOpenPicker(null);
  };

  const applyAttachment = (attachment: Attachment) => {
    if (!hasSelection) return;
    setSelectedStyle({ attachment });
    setOpenPicker(null);
  };

  const removeAttachment = () => {
    if (!hasSelection) return;
    setSelectedStyle({ attachment: undefined });
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

  const renderImagePicker = () => (
    <div className="style-picker-content">
      <div className="style-picker-section">
        <span className="style-picker-label">Embed Image</span>
        <p style={{ fontSize: 12, color: 'inherit', opacity: 0.7, margin: '4px 0 8px' }}>
          Paste an image URL or upload from your device.
        </p>
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">URL</span>
        <input
          type="url"
          className="style-text-input"
          placeholder="https://..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value;
              if (val) applyImage(val);
            }
          }}
          aria-label="Image URL"
        />
        <button
          className="style-action-btn"
          style={{ marginTop: 6 }}
          onClick={(e) => {
            const picker = (e.currentTarget as HTMLElement).closest('.style-picker-content');
            const input = picker?.querySelector('input[type=url]') as HTMLInputElement | null;
            if (input?.value) applyImage(input.value);
          }}
        >
          Apply URL
        </button>
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">Upload</span>
        <input
          type="file"
          accept="image/*"
          className="style-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              if (dataUrl) applyImage(dataUrl);
            };
            reader.readAsDataURL(file);
          }}
          aria-label="Upload image"
        />
      </div>
      {currentStyle?.imageUrl && (
        <div className="style-picker-section">
          <span className="style-picker-label">Current</span>
          <img
            src={currentStyle.imageUrl}
            alt="Current"
            style={{ maxWidth: '100%', maxHeight: 80, borderRadius: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            className="style-action-btn"
            style={{ marginTop: 6, background: '#ef4444', color: '#fff' }}
            onClick={removeImage}
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );

  const renderLinkPicker = () => (
    <div className="style-picker-content">
      <div className="style-picker-section">
        <span className="style-picker-label">External Link</span>
        <p style={{ fontSize: 12, color: 'inherit', opacity: 0.7, margin: '4px 0 8px' }}>
          Attach a URL to this node — click the 🔗 indicator to open it.
        </p>
      </div>
      <div className="style-picker-section">
        <span className="style-picker-label">URL</span>
        <input
          type="url"
          className="style-text-input"
          placeholder="https://..."
          defaultValue={currentStyle?.linkUrl || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value;
              if (val) applyLink(val);
            }
          }}
          aria-label="Link URL"
        />
        <button
          className="style-action-btn"
          style={{ marginTop: 6 }}
          onClick={(e) => {
            const picker = (e.currentTarget as HTMLElement).closest('.style-picker-content');
            const input = picker?.querySelector('input[type=url]') as HTMLInputElement | null;
            if (input?.value) applyLink(input.value);
          }}
        >
          Apply Link
        </button>
      </div>
      {currentStyle?.linkUrl && (
        <div className="style-picker-section">
          <span className="style-picker-label">Current</span>
          <a
            href={currentStyle.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, wordBreak: 'break-all', color: '#3b82f6' }}
            onClick={(e) => e.stopPropagation()}
          >
            {currentStyle.linkUrl}
          </a>
          <button
            className="style-action-btn"
            style={{ marginTop: 6, background: '#ef4444', color: '#fff' }}
            onClick={removeLink}
          >
            Remove Link
          </button>
        </div>
      )}
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

  const renderFilePicker = () => {
    const currentAttachment = currentStyle?.attachment;
    return (
      <div className="style-picker-content">
        <div className="style-picker-section">
          <span className="style-picker-label">Attach File</span>
          <p style={{ fontSize: 12, color: 'inherit', opacity: 0.7, margin: '4px 0 8px' }}>
            Attach a file (PDF, DOCX, XLSX, etc.) to this node. Max 5MB.
          </p>
        </div>
        <div className="style-picker-section">
          <span className="style-picker-label">Upload</span>
          <input
            type="file"
            className="style-file-input"
            accept={Array.from(ALLOWED_MIME_TYPES).join(',')}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const error = validateAttachment(file);
              if (!error.ok) {
                alert(error.error);
                return;
              }
              const dataUrl = await fileToBase64(file);
              applyAttachment(buildAttachment(file, dataUrl));
            }}
            aria-label="Upload file attachment"
          />
        </div>
        {currentAttachment && (
          <div className="style-picker-section">
            <span className="style-picker-label">Current</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12 }}>{currentAttachment.name}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>({formatFileSize(currentAttachment.size)})</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                className="style-action-btn"
                style={{ background: '#3b82f6', color: '#fff' }}
                onClick={() => downloadAttachment(currentAttachment)}
              >
                Download
              </button>
              <button
                className="style-action-btn"
                style={{ background: '#ef4444', color: '#fff' }}
                onClick={removeAttachment}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderPicker = (picker: typeof openPicker, ariaLabel: string, renderFn: () => JSX.Element) => {
    if (openPicker !== picker) return null;
    const id = PICKER_IDS[picker];
    return (
      <div
        id={id}
        className="style-picker"
        role="dialog"
        aria-label={ariaLabel}
      >
        {renderFn()}
      </div>
    );
  };

  return (
    <div className="style-toolbar" ref={pickerRef} role="toolbar" aria-label="Node styling">
      {/* Color */}
      <div className="style-toolbar-group">
        <button
          ref={triggerRef}
          className={`style-toolbar-btn ${openPicker === 'color' ? 'active' : ''}`}
          title="Color presets (Alt+Shift+C) — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'color'}
          aria-controls={openPicker === 'color' ? PICKER_IDS.color : undefined}
          onClick={() => openPickerPanel('color')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">🎨</span> Color
        </button>
        {renderPicker('color', 'Color picker', renderColorPicker)}
      </div>

      {/* Shape */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'shape' ? 'active' : ''}`}
          title="Shape picker — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'shape'}
          aria-controls={openPicker === 'shape' ? PICKER_IDS.shape : undefined}
          onClick={() => openPickerPanel('shape')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">⬜</span> Shape
        </button>
        {renderPicker('shape', 'Shape picker', renderShapePicker)}
      </div>

      {/* Icon */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'icon' ? 'active' : ''}`}
          title="Icon picker — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'icon'}
          aria-controls={openPicker === 'icon' ? PICKER_IDS.icon : undefined}
          onClick={() => openPickerPanel('icon')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">😀</span> Icon
        </button>
        {renderPicker('icon', 'Icon picker', renderIconPicker)}
      </div>

      {/* Image */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'image' ? 'active' : ''}`}
          title="Embed image — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'image'}
          aria-controls={openPicker === 'image' ? PICKER_IDS.image : undefined}
          onClick={() => openPickerPanel('image')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">🖼️</span> Image
        </button>
        {renderPicker('image', 'Image picker', renderImagePicker)}
      </div>

      {/* Link */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'link' ? 'active' : ''}`}
          title="Attach link — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'link'}
          aria-controls={openPicker === 'link' ? PICKER_IDS.link : undefined}
          onClick={() => openPickerPanel('link')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">🔗</span> Link
        </button>
        {renderPicker('link', 'Link picker', renderLinkPicker)}
      </div>

      {/* File */}
      <div className="style-toolbar-group">
        <button
          className={`style-toolbar-btn ${openPicker === 'file' ? 'active' : ''}`}
          title="Attach file — Escape to close"
          aria-haspopup="true"
          aria-expanded={openPicker === 'file'}
          aria-controls={openPicker === 'file' ? PICKER_IDS.file : undefined}
          onClick={() => openPickerPanel('file')}
          disabled={!hasSelection}
        >
          <span aria-hidden="true">📎</span> File
        </button>
        {renderPicker('file', 'File attachment picker', renderFilePicker)}
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

import { describe, it, expect } from 'vitest';
import { COLOR_PRESETS, FONT_SIZE_MAP, FONT_SIZE_OPTIONS, resolvePreset, resolveStyle, SHAPE_OPTIONS } from './nodeStyles';

describe('nodeStyles', () => {
  describe('COLOR_PRESETS', () => {
    it('has 7 color presets', () => {
      expect(COLOR_PRESETS).toHaveLength(7);
    });

    it('every preset has light and dark colors', () => {
      for (const preset of COLOR_PRESETS) {
        expect(preset.light).toHaveProperty('bg');
        expect(preset.light).toHaveProperty('text');
        expect(preset.light).toHaveProperty('border');
        expect(preset.dark).toHaveProperty('bg');
        expect(preset.dark).toHaveProperty('text');
        expect(preset.dark).toHaveProperty('border');
      }
    });

    it('every preset name is unique', () => {
      const names = COLOR_PRESETS.map(p => p.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('every preset has valid hex-like bg colors', () => {
      for (const preset of COLOR_PRESETS) {
        expect(preset.light.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(preset.dark.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe('resolvePreset', () => {
    const fallback = { bg: '#ffffff', text: '#000000', border: '#cccccc' };

    it('returns light colors in light theme', () => {
      const result = resolvePreset('primary', 'light', fallback);
      expect(result.bg).toBe('#3b82f6');
      expect(result.text).toBe('#ffffff');
    });

    it('returns dark colors in dark theme', () => {
      const result = resolvePreset('primary', 'dark', fallback);
      expect(result.bg).toBe('#1d4ed8');
      expect(result.text).toBe('#ffffff');
    });

    it('returns fallback for unknown preset name', () => {
      const result = resolvePreset('nonexistent', 'light', fallback);
      expect(result).toEqual(fallback);
    });

    it('returns fallback for undefined preset name', () => {
      const result = resolvePreset(undefined, 'light', fallback);
      expect(result).toEqual(fallback);
    });

    it('danger preset returns correct colors', () => {
      expect(resolvePreset('danger', 'light', fallback).bg).toBe('#ef4444');
      expect(resolvePreset('danger', 'dark', fallback).bg).toBe('#b91c1c');
    });
  });

  describe('resolveStyle', () => {
    const lightFallback = { bg: '#ffffff', text: '#111827', border: '#d1d5db' };
    const darkFallback = { bg: '#1f2937', text: '#f9fafb', border: '#4b5563' };

    it('returns default shape rounded', () => {
      const result = resolveStyle(undefined, 'light');
      expect(result.shape).toBe('rounded');
    });

    it('returns default fontSize 13', () => {
      const result = resolveStyle(undefined, 'light');
      expect(result.fontSize).toBe(13);
    });

    it('returns bold and italic false by default', () => {
      const result = resolveStyle(undefined, 'light');
      expect(result.bold).toBe(false);
      expect(result.italic).toBe(false);
    });

    it('returns borderWidth 1 by default', () => {
      const result = resolveStyle(undefined, 'light');
      expect(result.borderWidth).toBe(1);
    });

    it('returns empty icon by default', () => {
      const result = resolveStyle(undefined, 'light');
      expect(result.icon).toBe('');
    });

    it('resolves backgroundColor to preset light bg', () => {
      const result = resolveStyle({ backgroundColor: 'primary' }, 'light');
      expect(result.bg).toBe('#3b82f6');
    });

    it('resolves textColor to preset light text', () => {
      const result = resolveStyle({ textColor: 'success' }, 'light');
      expect(result.text).toBe('#ffffff');
    });

    it('resolves borderColor to preset light border', () => {
      const result = resolveStyle({ borderColor: 'info' }, 'light');
      expect(result.border).toBe('#0891b2');
    });

    it('applies custom shape', () => {
      const result = resolveStyle({ shape: 'diamond' }, 'light');
      expect(result.shape).toBe('diamond');
    });

    it('applies custom fontSize small', () => {
      const result = resolveStyle({ fontSize: 'small' }, 'light');
      expect(result.fontSize).toBe(11);
    });

    it('applies custom fontSize large', () => {
      const result = resolveStyle({ fontSize: 'large' }, 'light');
      expect(result.fontSize).toBe(16);
    });

    it('applies bold and italic', () => {
      const result = resolveStyle({ bold: true, italic: true }, 'light');
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(true);
    });

    it('uses dark theme fallback for dark theme', () => {
      const result = resolveStyle(undefined, 'dark');
      expect(result.bg).toBe('#1f2937');
      expect(result.text).toBe('#f9fafb');
      expect(result.border).toBe('#4b5563');
    });

    it('applies custom borderWidth', () => {
      const result = resolveStyle({ borderWidth: 3 }, 'light');
      expect(result.borderWidth).toBe(3);
    });

    it('applies custom icon', () => {
      const result = resolveStyle({ icon: '🚀' }, 'light');
      expect(result.icon).toBe('🚀');
    });
  });

  describe('FONT_SIZE_MAP', () => {
    it('maps small to 11', () => {
      expect(FONT_SIZE_MAP.small).toBe(11);
    });

    it('maps medium to 13', () => {
      expect(FONT_SIZE_MAP.medium).toBe(13);
    });

    it('maps large to 16', () => {
      expect(FONT_SIZE_MAP.large).toBe(16);
    });
  });

  describe('SHAPE_OPTIONS', () => {
    it('has 4 shape options', () => {
      expect(SHAPE_OPTIONS).toHaveLength(4);
    });

    it('includes rectangle, rounded, ellipse, diamond', () => {
      const values = SHAPE_OPTIONS.map(s => s.value);
      expect(values).toContain('rectangle');
      expect(values).toContain('rounded');
      expect(values).toContain('ellipse');
      expect(values).toContain('diamond');
    });

    it('every shape has value, label, cssClass', () => {
      for (const shape of SHAPE_OPTIONS) {
        expect(shape.value).toBeTruthy();
        expect(shape.label).toBeTruthy();
        expect(shape.cssClass).toBeTruthy();
        expect(shape.cssClass).toMatch(/^shape-/);
      }
    });
  });

  describe('FONT_SIZE_OPTIONS', () => {
    it('has 3 options', () => {
      expect(FONT_SIZE_OPTIONS).toHaveLength(3);
    });

    it('contains small, medium, large', () => {
      expect(FONT_SIZE_OPTIONS).toContain('small');
      expect(FONT_SIZE_OPTIONS).toContain('medium');
      expect(FONT_SIZE_OPTIONS).toContain('large');
    });
  });
});

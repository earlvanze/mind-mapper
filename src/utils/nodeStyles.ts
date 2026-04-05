// Node Styling — color presets, shape constants, theme-aware palette resolution

export type Shape = 'rectangle' | 'rounded' | 'ellipse' | 'diamond';

export type ColorPresetName =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

export interface ColorPreset {
  name: ColorPresetName;
  label: string;
  light: { bg: string; text: string; border: string };
  dark: { bg: string; text: string; border: string };
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'default',  label: 'Default',  light: { bg: '#ffffff', text: '#111827', border: '#d1d5db' }, dark: { bg: '#1f2937', text: '#f9fafb', border: '#4b5563' } },
  { name: 'primary',  label: 'Primary',  light: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }, dark: { bg: '#1d4ed8', text: '#ffffff', border: '#3b82f6' } },
  { name: 'success',  label: 'Success',  light: { bg: '#10b981', text: '#ffffff', border: '#059669' }, dark: { bg: '#047857', text: '#ffffff', border: '#10b981' } },
  { name: 'warning',  label: 'Warning',  light: { bg: '#f59e0b', text: '#1f2937', border: '#d97706' }, dark: { bg: '#b45309', text: '#ffffff', border: '#f59e0b' } },
  { name: 'danger',   label: 'Danger',   light: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' }, dark: { bg: '#b91c1c', text: '#ffffff', border: '#ef4444' } },
  { name: 'info',     label: 'Info',     light: { bg: '#06b6d4', text: '#ffffff', border: '#0891b2' }, dark: { bg: '#0e7490', text: '#ffffff', border: '#06b6d4' } },
  { name: 'muted',    label: 'Muted',    light: { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' }, dark: { bg: '#4b5563', text: '#f9fafb', border: '#9ca3af' } },
];

export const FONT_SIZE_MAP: Record<string, number> = {
  small: 11,
  medium: 13,
  large: 16,
};

export const FONT_SIZE_OPTIONS = ['small', 'medium', 'large'] as const;
export type FontSizeOption = typeof FONT_SIZE_OPTIONS[number];

export const SHAPE_OPTIONS: { value: Shape; label: string; cssClass: string }[] = [
  { value: 'rectangle', label: 'Rectangle', cssClass: 'shape-rectangle' },
  { value: 'rounded',   label: 'Rounded',   cssClass: 'shape-rounded'   },
  { value: 'ellipse',   label: 'Ellipse',   cssClass: 'shape-ellipse'   },
  { value: 'diamond',   label: 'Diamond',   cssClass: 'shape-diamond'   },
];

/** Resolve a preset name + theme to actual hex values */
export function resolvePreset(
  presetName: string | undefined,
  theme: 'light' | 'dark',
  fallback: { bg: string; text: string; border: string },
): { bg: string; text: string; border: string } {
  if (!presetName) return fallback;
  const preset = COLOR_PRESETS.find(p => p.name === presetName);
  if (!preset) return fallback;
  return theme === 'dark' ? preset.dark : preset.light;
}

/** Resolve a full NodeStyle into resolved color values for a given theme */
export function resolveStyle(
  style: { backgroundColor?: string; textColor?: string; borderColor?: string; borderWidth?: number; shape?: Shape; icon?: string; fontSize?: string; bold?: boolean; italic?: boolean } | undefined,
  theme: 'light' | 'dark',
): {
  bg: string;
  text: string;
  border: string;
  borderWidth: number;
  shape: Shape;
  icon: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
} {
  const fallback = resolvePreset(undefined, theme, {
    bg: theme === 'dark' ? '#1f2937' : '#ffffff',
    text: theme === 'dark' ? '#f9fafb' : '#111827',
    border: theme === 'dark' ? '#4b5563' : '#d1d5db',
  });

  const presetBg = resolvePreset(style?.backgroundColor, theme, fallback);
  const presetText = resolvePreset(style?.textColor, theme, fallback);
  const presetBorder = resolvePreset(style?.borderColor, theme, fallback);

  return {
    bg: style?.backgroundColor ? presetBg.bg : fallback.bg,
    text: style?.textColor ? presetText.text : fallback.text,
    border: style?.borderColor ? presetBorder.border : fallback.border,
    borderWidth: style?.borderWidth ?? 1,
    shape: style?.shape ?? 'rounded',
    icon: style?.icon ?? '',
    fontSize: FONT_SIZE_MAP[style?.fontSize ?? 'medium'] ?? 13,
    bold: style?.bold ?? false,
    italic: style?.italic ?? false,
  };
}

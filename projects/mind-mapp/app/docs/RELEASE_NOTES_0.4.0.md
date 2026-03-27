# Mind Mapp v0.4.0 - Node Styling

**Released**: March 25, 2026

## Overview
Rich visual customization for nodes with colors, shapes, and icons.

## Key Features

### Color Presets (7 presets)
- **default** — white/dark-neutral
- **primary** — blue accent
- **success** — green
- **warning** — amber
- **danger** — red
- **info** — cyan
- **muted** — gray

Theme-aware: presets resolve to light/dark variants automatically.

### Custom Colors
- Background, text, and border color pickers
- Individual fine-grained control

### Node Shapes
- Rectangle (default)
- Rounded (8px radius)
- Ellipse (50% border-radius)
- Diamond (rotated 45°)

### Icon Support
- Emoji picker with 20 quick-access icons
- Icons render inline before node text

### Style Toolbar
- Color, Shape, and Icon toolbar buttons
- Popup pickers for each style dimension
- Border width slider
- Reset style action

### Keyboard Shortcuts
- `Cmd/Ctrl+1-7` apply color presets
- `Alt+Shift+C` open color picker
- `Cmd+Shift+R` reset style

## Technical Details
- `nodeStyles.ts` — color presets, shape constants, `resolveStyle()` theme resolution
- `StyleToolbar.tsx` — style picker UI
- `NodeStyle` type added to store data model
- `setNodeStyle(id, style)` and `setSelectedStyle(style)` actions
- Style preserved in JSON import/export
- `Node` component uses `resolveStyle()` for border-radius/transform per shape
- Rich text (bold/italic/lists) available via formatting toolbar in edit mode

## Breaking Changes
None.

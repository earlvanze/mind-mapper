# Node Styling Specification (v0.4)

## Overview
Add visual customization options for nodes: colors, shapes, and icons.

## Goals
- Quick styling via toolbar for selected nodes
- Style presets for common use cases
- Per-node style persistence
- Theme-aware color palettes
- Keyboard shortcuts for common styles

## Data Model Extension

```typescript
interface NodeStyle {
  backgroundColor?: string;  // hex or preset name
  textColor?: string;        // hex or preset name
  borderColor?: string;      // hex or preset name
  borderWidth?: number;      // 1-5px
  shape?: 'rectangle' | 'rounded' | 'ellipse' | 'diamond';
  icon?: string;             // emoji or icon name
  fontSize?: 'small' | 'medium' | 'large';
}

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  style?: NodeStyle;  // NEW: optional styling
}
```

## Color Presets

### Light Theme
- **Default**: white bg, black text, gray border
- **Primary**: blue bg, white text
- **Success**: green bg, white text
- **Warning**: yellow bg, black text
- **Danger**: red bg, white text
- **Info**: cyan bg, white text
- **Muted**: gray bg, white text

### Dark Theme
- **Default**: dark gray bg, white text, lighter gray border
- **Primary**: dark blue bg, white text
- **Success**: dark green bg, white text
- **Warning**: dark yellow bg, black text
- **Danger**: dark red bg, white text
- **Info**: dark cyan bg, white text
- **Muted**: medium gray bg, white text

## Shape Options
1. **Rectangle**: Current default (sharp corners)
2. **Rounded**: Rounded corners (border-radius: 8px)
3. **Ellipse**: Fully rounded (border-radius: 50%)
4. **Diamond**: Rotated square (45deg transform)

## Icon Options
- **Emoji picker**: Quick emoji selection (🔥, ⭐, 💡, etc.)
- **No icon library initially** (keep bundle small)
- Icon displayed before text in node

## UI Components

### Style Toolbar (New)
- **Color picker**: dropdown with presets + custom color
- **Shape picker**: 4 shape buttons
- **Icon picker**: emoji dropdown or input
- **Reset style**: button to clear all styling

### Keyboard Shortcuts (Proposed)
- `Cmd/Ctrl+1-7`: Apply color presets 1-7
- `Cmd/Ctrl+Shift+R`: Reset style to default
- `Alt+Shift+C`: Open color picker
- `Alt+Shift+I`: Open icon picker

## Implementation Plan

### Phase 1: Data Model (1 commit)
- [ ] Add `style` field to Node interface
- [ ] Update store to handle node styles
- [ ] Update import/export to preserve styles
- [ ] Add migration for existing maps (backward compatible)

### Phase 2: Shape Rendering (1 commit)
- [ ] Create ShapeNode component (wraps current Node)
- [ ] Implement rectangle, rounded, ellipse, diamond rendering
- [ ] Update SVG renderer to handle shapes
- [ ] Update Canvas renderer to handle shapes

### Phase 3: Color System (1 commit)
- [ ] Define color preset constants (light/dark themes)
- [ ] Create color picker component
- [ ] Apply colors to node background, text, border
- [ ] Ensure theme switching updates styled nodes

### Phase 4: Icons (1 commit)
- [ ] Create emoji picker component
- [ ] Render emoji before node text
- [ ] Handle emoji in PNG export
- [ ] Test emoji rendering in Canvas mode

### Phase 5: Style Toolbar (1 commit)
- [ ] Create StyleToolbar component
- [ ] Add color, shape, icon pickers
- [ ] Wire up to store actions
- [ ] Add keyboard shortcuts

### Phase 6: Tests & Polish (1 commit)
- [ ] Unit tests for styling logic
- [ ] Visual regression tests
- [ ] Update help dialog with new shortcuts
- [ ] Update documentation

## Edge Cases
- **Multi-select styling**: Apply style to all selected nodes
- **Export**: PNG should render styled nodes correctly
- **Import**: Handle missing or invalid style properties gracefully
- **Theme switch**: Re-map colors if using preset names
- **Canvas rendering**: Ensure shapes render efficiently at scale

## Non-Goals (defer to later)
- Rich text formatting (bold, italic, etc.)
- Custom fonts
- Gradient backgrounds
- Shadow effects
- Animations
- Style inheritance from parent nodes

## Success Criteria
- Users can apply colors, shapes, and icons to nodes
- Styling persists across sessions
- Export preserves visual appearance
- Performance remains smooth (1000+ nodes with styles)
- Keyboard shortcuts work as expected
- Documentation and help updated

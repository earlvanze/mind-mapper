# Mind Mapp v0.9.0 - Embedded Images

**Released**: March 26, 2026

## Overview
Embed images directly inside nodes via URL or file upload. Images display above the node text, are preserved in JSON/PNG/SVG/PDF exports, and work in both SVG and Canvas renderers.

## Key Features

### Image Embedding
- **URL input**: paste any image URL directly
- **File upload**: select image files from device (converted to data URL for localStorage persistence)
- **Preview**: current image shown in picker before applying
- **Remove**: one-click removal via the image picker
- **Undo/redo**: image changes are fully undoable
- **Persistence**: stored as data URL in localStorage via JSON export

### Rendering
- SVG renderer: `<img>` inside the node `div`, max 160×112px, `object-fit: contain`, centered at top
- Canvas renderer: `drawImage()` inside node bounds at top, text reflowed below
- Column flex layout when image present; row layout otherwise
- Error handling: broken images gracefully hidden

### Style Toolbar Integration
- New **Image** button in style toolbar (🖼️ icon)
- Works alongside color, shape, and icon pickers
- Requires node selection to activate

## Technical Details
- `NodeStyle.imageUrl?: string` — data URL or remote URL
- File uploads use `FileReader.readAsDataURL()` for localStorage compatibility
- Clone function deep-copies `node.style` preserving `imageUrl`
- Node memo comparison includes `imageUrl` to avoid stale renders

## Breaking Changes
None.

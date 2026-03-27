# Mind Mapp v0.5.0 - Enhanced Exports

**Released**: March 25, 2026

## Overview
Comprehensive export options including PDF, SVG, and FreeMind XML format for interoperability.

## Key Features

### PDF Export
- **Page layouts**: A4 and Letter size
- **Orientation**: Portrait and Landscape
- **Fit modes**: Fit-to-content or custom scaling
- Uses `jsPDF` library
- Full styled node rendering

### SVG Export
- **Vector format** — infinitely scalable
- Uses `html-to-image` library
- Preserves all node styling

### FreeMind XML Export
- **`.mm` format** — opens in FreeMind, MindMaster, and other mind map tools
- Preserves node text, colors, icons, and shapes as FreeMind attributes
- Properly nests children as map branches

## Technical Details
- `exportPdf.ts` — PDF generation with layout/orientation options
- `exportSvg.ts` — SVG rasterization via html-to-image
- `exportFreemind.ts` — FreeMind XML builder with style mapping
- Export actions wired in toolbar + keyboard shortcuts
- Style toolbar `backgroundColor` field doubles as FreeMind node BG color
- Export preserves custom node colors and icons

## Breaking Changes
None.

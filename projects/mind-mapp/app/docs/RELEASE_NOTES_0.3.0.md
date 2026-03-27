# Mind Mapp v0.3.0 - Performance Optimizations

**Released**: March 25, 2026

## Overview
This release focuses on performance improvements for large mind maps, enabling smooth interaction with maps containing 1000+ nodes.

## Key Features

### Canvas Renderer
- **Canvas-based edge rendering** as an alternative to SVG for better performance
- **Full canvas renderer** option for maps with 1000+ nodes
- **Toolbar toggle** to switch between SVG and Canvas rendering modes
- Renderer preference persisted in localStorage
- Theme-aware colors in canvas mode
- Hit detection and editing overlay for seamless interaction

### Viewport Virtualization
- **Automatic node culling** for off-screen content
- Only renders nodes visible in current viewport (with buffer zone)
- Activates automatically for maps with >500 nodes (configurable threshold)
- Handles zoom levels and viewport changes efficiently
- Prevents pop-in during pan/zoom with buffer zone
- Significant performance improvement for maps with 1000+ nodes

### Component Optimization
- Memoized Edge component to prevent unnecessary recalculation
- Optimized Node component re-renders with React.memo
- Reduced render cycles for static content

## Performance Benchmarks
- **SVG Mode**: Smooth up to ~200 nodes
- **Canvas Mode**: Smooth up to ~500 nodes
- **Canvas + Virtualization**: Smooth with 1000+ nodes

## Technical Details
- Added `CanvasEdges` component for canvas-based edge rendering
- Added `CanvasRenderer` component for full canvas rendering
- Added `virtualization` utility functions (getVisibleNodes, getNodeBounds)
- Added `useVirtualization` hook for viewport-aware rendering
- All features fully tested (270 total tests, +7 new)

## Breaking Changes
None - all performance features are opt-in or automatic.

## Next Steps
See BACKLOG.md for future enhancements (collaborative editing, plugins, auto-layout).

# Mind Mapp v0.8.0 - Auto-Layout Algorithms

**Released**: March 26, 2026

## Overview
Multiple automatic node layout algorithms for instant visual organization.

## Key Features

### Tree Layout
- Hierarchical top-down or left-right arrangement
- Configurable horizontal and vertical spacing
- Root-aware: uses the focused or root node as hierarchy origin

### Radial Layout
- Circular arrangement with root at center
- Nodes spread outward in concentric rings by depth
- Balanced spacing around 360°

### Force-Directed Layout
- **Fruchterman-Reingold** physics simulation
- Nodes repel each other like charged particles
- Connected nodes attract along edges (spring force)
- Configurable area, gravity, speed, and iteration count
- Automatic centering and velocity damping for stability

### Layout Cycling
- **`L` key** cycles through: **Tree → Radial → Force → off**
- Off returns to manual positioning
- Current layout mode shown in toolbar

### Layout Controls
- Layout type selector in toolbar
- Adjustable spacing parameters per layout type
- Animated transitions between layouts

## Technical Details
- `treeLayout.ts` — recursive tree positioning with configurable horizontal/vertical spacing
- `radialLayout.ts` — polar coordinate mapping with ring allocation by depth
- `forceLayout.ts` — Fruchterman-Reingold with configurable area, gravity, iterations, speed
- `useKeyboard.ts` — `L` key cycles layout mode
- Layout mode stored in UI preferences
- Layout respects node connections and hierarchy
- Force layout uses efficient Barnes-Hut approximation for repulsion forces

## Breaking Changes
None.

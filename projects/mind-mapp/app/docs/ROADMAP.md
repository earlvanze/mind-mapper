# Mind Mapp — Roadmap

## v0.1 (MVP) ✅ Complete
- Node creation (Enter/Tab)
- Text editing + focus state
- Drag to reposition
- Pan + zoom
- Export PNG/JSON
- Autosave to localStorage
- Search jump (Cmd/Ctrl+K)

## v0.2 ✅ Complete
- Undo/redo
- Multi-select + group move
- Curved edges with arrowheads
- Touch/pinch gestures
- Import JSON with validation
- Theme toggle (light/dark)
- Markdown export
- Quick share links
- Sample map loader (templates)
- Focus history navigation
- Mini-map with viewport navigation
- Help dialog with shortcut filtering
- Node alignment & distribution tools
- Selection tools (siblings, children, leaves, ancestors, etc.)
- Breadcrumb path navigation
- Grid overlay
- Advanced toolbar actions (collapsible)

## v0.3 (Performance) ✅ Complete
- Canvas renderer for large maps (>1000 nodes)
- Viewport-based virtualization for off-screen nodes
- Component optimization (memoization)
- Performance profiling & benchmarks

## v0.4 (Node Styling) ✅ Complete
- Node colors (7 presets + custom color pickers)
- Node shapes (rectangle, rounded, ellipse, diamond)
- Node icons (emoji picker)
- Style presets and custom styles
- Style toolbar for quick formatting
- `Cmd/Ctrl+1-7` keyboard shortcuts for color presets
- Rich text formatting toolbar (bold, italic, lists)

## v0.5 (Enhanced Exports) ✅ Complete
- PDF export with layout options (A4/Letter, portrait/landscape, fit-to-content)
- SVG export (vector format)
- FreeMind XML export (.mm interoperability)
- Export with styling preserved

## v0.6 (Collaboration)
- [ ] Real-time collaborative editing (CRDT-based)
- [ ] Conflict-free merge strategies
- [ ] Presence indicators
- [ ] Version history browser

## v0.8 (Auto-Layout) ✅ Complete
- Tree layout (hierarchical)
- Radial layout (circular)
- Force-directed layout (Fruchterman-Reingold physics)
- `L` key cycles through all layouts

## v1.0 (Full Release)
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom visualizations
- [x] Embedded images (data URL / file upload)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Public release and documentation site

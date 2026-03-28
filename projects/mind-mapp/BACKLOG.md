# Mind Mapp — Backlog

## Must‑Do (MVP) ✅ Complete
- [x] Implement node creation: Enter/Tab
- [x] Text editing + focus state
- [x] Drag to reposition
- [x] Pan + zoom
- [x] Export PNG
- [x] Export JSON
- [x] Autosave to localStorage
- [x] Search jump (Cmd/Ctrl+K)

## Should‑Do (v0.2) ✅ Complete
- [x] Import JSON
- [x] Multi‑select nodes
- [x] Undo/redo
- [x] Theme toggle (light/dark) — Shift+T

## Could‑Do (v0.2) ✅ Complete
- [x] Markdown export
- [x] Quick share link (no auth)
- [x] Templates (meeting notes, project map) — via sample map loader

## Bonus (v0.2) ✅ Complete
- [x] Mini-map with navigation
- [x] Help dialog with shortcut filtering
- [x] Focus history (back/forward navigation)
- [x] Node alignment & distribution tools
- [x] Subtree centering & fit-to-view
- [x] Selection tools (siblings, children, leaves, ancestors, generation)
- [x] Grid overlay
- [x] Breadcrumb path navigation
- [x] Promote node (Shift+Tab)
- [x] Duplicate nodes
- [x] Copy selection text / subtree outline / path
- [x] Touch/pinch zoom support
- [x] Sample map loader

## Performance Optimizations (v0.3) ✅ Complete
- [x] Canvas renderer for larger maps
- [x] Virtualization for very large maps (>500 nodes)
- [x] Canvas + virtualization handles 1000+ nodes efficiently
- [x] Component optimization (React.memo)

## v0.4 Node Styling 🎨 ✅ Complete
- [x] Color presets (7 presets: default, primary, success, warning, danger, info, muted)
- [x] Custom colors (background, text, border)
- [x] Node shapes (rectangle, rounded, ellipse, diamond)
- [x] Icon support (emoji picker)
- [x] Style toolbar
- [x] Keyboard shortcuts (Cmd/Ctrl+1-7 for presets)
- [x] Theme-aware color palettes
- [x] Export with styling preserved

## v0.5 Enhanced Exports ✅ Complete
- [x] PDF export with page layout options (A4/Letter, portrait/landscape, fit-to-content)
- [x] SVG export (vector format via html-to-image)
- [x] FreeMind XML export (interoperability — .mm format with styles/colors/icons)

## v0.8 Auto-Layout ✅ Complete
- [x] Auto-layout algorithms (tree, radial, force) — L key cycles tree ↔ radial ↔ force

## v0.9 Embedded Images ✅ Complete
- [x] Attachments (images via URL or file upload)
- [x] Rich text editing (bold, italic) — bold/italic toolbar + Cmd+B/I shortcuts

## v0.10 Version History ✅ Complete
- [x] Version history and branching — named snapshots with save/load/rename/delete

## v0.11 Accessibility ✅ Complete
- [x] Skip navigation link
- [x] `:focus-visible` ring discrimination
- [x] `prefers-reduced-motion` support
- [x] Dedicated `aria-live` status region
- [x] Style picker focus trap + Escape handler

## v1.0 (MVP Complete) ✅ Complete
- [x] WCAG 2.1 AA color contrast audit — all text/bg pairs meet 4.5:1 threshold
- [x] WCAG 2.1 AA keyboard navigation audit — verify all interactive elements accessible via keyboard
- [x] WCAG 2.1 AA error message audit — all form errors have proper `aria-describedby` associations
- [x] Performance benchmarks documented (1000+ nodes, memory usage, render time)
- [x] Public documentation site — comprehensive docs/ with index.html + all markdown files
- [x] Production deployment guide — enhanced DEPLOY.md with Netlify, Vercel, AWS, Docker, self-hosted options

## Future (Post-v1.0)
- [ ] Collaborative editing (CRDT-based)
- [ ] Plugin system for custom visualizations
- [ ] Mobile app (React Native)
- [ ] File attachments (non-image binary files)
- [ ] Node tags/categories
- [ ] Advanced search (regex, wildcards)
- [ ] Export templates (custom styling presets)
- [ ] Import from other formats (XMind, MindManager, Obsidian)
- [ ] Cloud sync (optional backend)
- [ ] Presentation mode (slideshow through branches)
- [ ] Node comments and annotations
- [ ] Custom themes and color schemes
- [ ] Keyboard shortcut customization
- [ ] Node animations and transitions
- [ ] Advanced filters (by style, date, properties)

## v1.1 Node Tags & Categories (In Progress)
Branch: feature/node-tags

### Phase 1: Data Model & Basic UI
- [x] Add `tags` field to Node interface
- [x] Create TagBadge component
- [x] Feature specification document
- [x] Update localStorage schema (auto-serialized)
- [x] Display tags below node text
- [x] Add tag to sample maps

### Phase 2: Tag Input & Editing ✅ Complete
- [x] Create TagInput component with autocomplete
- [x] Add tag edit mode (via TagInput)
- [x] Keyboard shortcuts for tag operations (Cmd+T)
- [x] Bulk tag for multi-select (addTagToSelected)

### Phase 3: Tag Picker Dialog ✅ Complete
- [x] Create TagPickerDialog component
- [x] Show all existing tags with counts
- [x] Click to toggle tag on selected nodes

### Phase 4: Filtering & Visualization ✅ Complete
- [x] Tag filter panel component
- [x] Filter logic (match any/all modes)
- [x] Fade non-matching nodes

### Phase 5: Export/Import ✅ Complete (Partial)
- [x] Include tags in JSON export (already works — tags field serializes natively)
- [x] Preserve tags in FreeMind export (tags as <note> elements with 🏷️ prefix)
- [x] Import tags from JSON (existing parseImportPayload already handles tags field)

### Phase 6: Testing & Documentation
- [x] Unit tests for tag operations
- [x] Integration tests for filtering
- [x] Update keyboard shortcuts doc
- [x] Add tag tutorial to help dialog
- [x] Filter tags by search
- [x] Keyboard shortcut (Cmd/Ctrl+Shift+T)
- [x] Tag utility functions (getAllTagsWithCounts, getSortedTags, nodeHasTag, allNodesHaveTag)
- [x] Indeterminate checkbox state for partial selection

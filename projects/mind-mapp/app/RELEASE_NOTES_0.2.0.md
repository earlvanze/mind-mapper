# Mind Mapp v0.2.0 Release Notes

Released: March 25, 2026

## 🎉 Major Milestone: All MVP and Could-Do Features Complete!

This release marks the completion of all planned MVP and v0.2 features. Mind Mapp is now a fully-featured mind mapping application with comprehensive editing, navigation, and export capabilities.

## ✨ What's New in v0.2.0

### Core Features
- ✅ **Share Links**: Generate shareable URLs with your mind map embedded (no auth required)
- ✅ **Sample Maps**: Load pre-built templates for common use cases
- ✅ **Markdown Export**: Export your mind maps as hierarchical markdown
- ✅ **Theme Toggle**: Switch between light and dark modes (Shift+T)

### Navigation & Selection
- ✅ **Focus History**: Navigate back/forward through your focus path
- ✅ **Mini-map**: Bird's-eye view with drag-to-pan viewport
- ✅ **Selection Tools**: Select siblings, children, leaves, ancestors, generations
- ✅ **Breadcrumb Navigation**: Click to jump to parent nodes

### Editing Enhancements
- ✅ **Node Alignment**: Align and distribute selected nodes
- ✅ **Grid Overlay**: Visual alignment guides
- ✅ **Duplicate Nodes**: Quickly copy nodes with Cmd/Ctrl+D
- ✅ **Node Promotion**: Move nodes up the hierarchy with Shift+Tab

### UI Improvements
- ✅ **Help Dialog**: Searchable keyboard shortcut reference (? or Cmd/Ctrl+/)
- ✅ **Advanced Actions**: Collapsible toolbar to reduce clutter (Shift+A)
- ✅ **Touch Support**: Full touch and pinch-zoom gesture support

### Developer Experience
- ✅ **Test Suite**: 261 tests across 32 test files, all passing
- ✅ **Import Validation**: Robust JSON import with schema validation
- ✅ **Undo/Redo**: Full history management with pruning

## 📊 By the Numbers

- **261 tests** passing
- **32 test files** covering core functionality
- **~75KB** total gzipped bundle size
- **0 console.log** statements (clean production code)
- **0 TypeScript any** types (full type safety)

## 🚀 What's Next?

Version 0.3 will focus on **performance optimizations** for large mind maps:
- Canvas renderer for maps with >1000 nodes
- Virtualization for off-screen nodes
- Lazy rendering optimizations

## 🐛 Known Issues

- Large maps (>1000 nodes) may experience lag (canvas renderer planned for v0.3)
- No virtualization yet (all nodes render even when off-screen)

## 🙏 Acknowledgments

Built with:
- React 18.2
- Vite 5.1
- TypeScript 5.4
- Zustand 4.5 (state management)
- Vitest 4.0 (testing)
- html-to-image 1.11 (PNG export)

---

**Full Changelog**: https://github.com/yourusername/mind-mapp/compare/v0.1.2...v0.2.0

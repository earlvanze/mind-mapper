# Mind Mapp — Collaborative Mind Mapping for Teams

A fast, keyboard-first mind mapping tool built for individuals and teams. Create, organize, and share visual maps directly in your browser — no account required.

**[Live Demo](https://mind-mapp.example.com)** · [Documentation](docs/) · [Changelog](docs/CHANGELOG.md)

## Features

### Core
- **Keyboard-first** — Tab/Enter to create nodes, Cmd+K to search, L to cycle layouts
- **Rich node styling** — Colors, shapes, emoji icons, custom backgrounds
- **Multiple layouts** — Tree, radial, and force-directed auto-layout
- **Version history** — Save named snapshots, branch and restore
- **Import/Export** — JSON, PNG, SVG, PDF, Markdown, FreeMind, XMind, Obsidian vault

### Collaboration
- Share maps via URL (no account needed)
- Full offline support with localStorage autosave

### Export Formats
| Format | Use Case |
|--------|----------|
| PNG/SVG | Sharing, presentations |
| PDF | Print-ready documents |
| JSON | Backup, automation pipelines |
| Markdown | Obsidian/Notion integration |
| FreeMind (.mm) | MindManager, Freeplane |
| XMind | XMind 8/9 compatibility |

## Quick Start

```bash
cd app
npm install
npm run dev      # Development server
npm test         # Run tests
npm run build    # Production build
```

Or open `app/dist/index.html` directly in a browser.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | New child node |
| `Enter` | New sibling node |
| `Delete` | Delete node |
| `F2` | Edit node label |
| `Cmd/Ctrl+K` | Search & jump |
| `L` | Cycle layout (tree → radial → force) |
| `Shift+T` | Toggle theme |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl+E` | Export dialog |
| `Cmd/Ctrl+I` | Import dialog |
| `?` | Help dialog |

See [KEYS.md](docs/KEYS.md) for the full shortcut reference.

## Architecture

- **React** + **TypeScript** — Component-based UI
- **Zustand** — Lightweight state management
- **SVG + Canvas** — Hybrid rendering (SVG for <500 nodes, Canvas for large maps)
- **Vite** — Build tooling
- **Vitest** — Unit and component testing

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |

See [BROWSER_COMPATIBILITY.md](docs/BROWSER_COMPATIBILITY.md) for the full compatibility matrix and known issues.

## Deployment

See [DEPLOY.md](docs/DEPLOY.md) for deployment to Netlify, Vercel, AWS, or self-hosted.

## Version History

| Version | Status | Date |
|---------|--------|------|
| v1.2 | ✅ Complete | 2026-04-02 |
| v1.1 | ✅ Complete | 2026-03-30 |
| v1.0 | ✅ Complete | 2026-03-25 |
| v0.14 | ✅ Complete | 2026-03-20 |

Full changelog in [docs/CHANGELOG.md](docs/CHANGELOG.md).

## License

MIT

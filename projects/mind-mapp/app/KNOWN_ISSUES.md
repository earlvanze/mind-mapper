# Known Issues

## Security
- Vite/esbuild moderate advisory (see AUDIT.md) — build-time only, no runtime impact

## Performance ✅ Resolved in v0.3.0
- ~~Large maps (>1000 nodes) may experience lag~~ — Canvas renderer + virtualization now handles 1000+ nodes smoothly
- ~~No virtualization yet~~ — Viewport-based virtualization implemented

## Browser Compatibility
- Tested primarily on modern Chrome/Firefox/Safari
- IE11 not supported (uses modern JS features)
- Touch gestures work on mobile browsers

## Mobile
- Touch gestures implemented (pinch zoom, pan)
- Mobile UX could be improved for small screens (future v0.x)
- No dedicated mobile app yet (planned for v1.0)

## Feature Gaps (Planned)
- No node styling (colors, shapes, icons) — planned for v0.4
- No PDF/SVG export — planned for v0.5
- No collaborative editing — planned for v0.6+
- No auto-layout algorithms — future enhancement

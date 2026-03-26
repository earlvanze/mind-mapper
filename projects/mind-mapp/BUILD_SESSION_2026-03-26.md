# Mind Mapp Build Session - March 26, 2026 (Evening)

## Status Check
✅ All tests passing (290 tests, 37 files)
✅ Build succeeds cleanly
✅ Version mismatch fixed
✅ .gitignore added with proper exclusions

## Issues Fixed

### 1. Version Mismatch Bug
**Issue**: `package.json` had `"version": "0.8.0"` but `src/utils/version.ts` had `APP_VERSION = '0.2.0'`.

**Fix**: Updated `version.ts` to export `APP_VERSION = '0.8.0'` to match package.json.

### 2. Build Artifacts in Git
**Issue**: `app/dist/` was tracked by git, causing noisy diffs on every build.

**Fix**: Created `.gitignore` in project root:
```
node_modules/
dist/
.e2e/
test-results/
*.log
.DS_Store
.env
.env.local
```
Removed `app/dist/` from git tracking via `git rm -r --cached`.

### 3. Test Results (Pre-existing)
vitest.config.ts properly excludes e2e tests.

## Test Results
```
Test Files: 37 passed (37)
Tests: 290 passed (290)
Duration: 2.88s
```

## Build Output
```
dist/index.html                    0.41 kB │ gzip:  0.28 kB
dist/assets/index-CiWzqkQ9.css    11.19 kB │ gzip:  2.67 kB
dist/assets/index.es-*.js        150.69 kB │ gzip: 51.55 kB
dist/assets/html2canvas.esm-*.js 201.42 kB │ gzip: 48.03 kB
dist/assets/index-*.js           647.26 kB │ gzip: 209.38 kB
Build time: 4.17s
```

## Git Commits
```
49f8f8f fix: Sync APP_VERSION to 0.8.0, add .gitignore, ignore dist/ and test artifacts
253e94b fix: Add vitest.config.ts to exclude e2e tests from unit test run
```

Note: No remote configured — commits are local only.

## Remaining Backlog Items (v0.6+)
- Collaborative editing (CRDT-based)
- Plugin system
- Mobile app (React Native)
- Accessibility audit (WCAG 2.1 AA)
- Embedded images/attachments

These are substantial features requiring design/planning before implementation.

## Build Session - March 26, 2026 (Evening) — Embedded Images

### Status Check
✅ All 290 tests passing (37 files)
✅ Build succeeds cleanly (0.9.0)
✅ Embedded images feature implemented

### What Was Built

**v0.9.0 — Embedded Images in Nodes**

Users can now embed images directly in any node via the style toolbar:

1. **Image picker** in style toolbar (🖼️ button, activates when node selected)
   - Paste any image URL
   - Upload images from device (converted to data URL for localStorage persistence)
   - Preview current image
   - One-click remove

2. **SVG renderer** (Node.tsx)
   - Column flex layout when image present
   - `<img>` element above text, max 160×112px, object-fit contain
   - Error handling: broken images hidden gracefully
   - Memo comparison updated for `imageUrl`

3. **Canvas renderer** (CanvasRenderer.tsx)
   - `drawImage()` inside node bounding box at top
   - Text reflowed below image
   - Error handling: silent failure on draw errors

4. **Data model**
   - `NodeStyle.imageUrl?: string` — stores data URL or remote URL
   - Existing clone/undo machinery preserves `imageUrl` automatically

5. **CSS** — new `.style-text-input` and `.style-file-input` classes

### Changes
```
src/store/useMindMapStore.ts |  1 +   — imageUrl field in NodeStyle type
src/components/Node.tsx     | +29      — image rendering in SVG mode
src/components/CanvasRenderer.tsx | +27  — image rendering in Canvas mode
src/components/StyleToolbar.tsx | +107  — Image picker with URL/upload
src/styles.css              |  +33      — form input styles
```

### Test Results
```
Test Files: 37 passed (37)
Tests: 290 passed (290)
Duration: 2.36s
```

### Build Output
```
dist/index.html                    0.41 kB │ gzip: 0.27 kB
dist/assets/index-*.css           11.65 kB │ gzip: 2.74 kB
dist/assets/index-*.js           650.11 kB │ gzip: 210.06 kB
Build time: 2.43s
```

### Git Commits
```
0bcf1b3 docs: Bump version to 0.9.0, add release notes, mark embedded images complete
ff6ced6 feat: Embedded images in nodes — data URL or file upload via Image picker
```

### Backlog After This Session
- [x] Embedded images/attachments — ✅ Done (v0.9.0)
- [ ] Collaborative editing (CRDT-based) — v0.6
- [ ] Plugin system — v1.0
- [ ] Mobile app (React Native) — v1.0
- [ ] Accessibility audit (WCAG 2.1 AA) — v1.0

### Notes
- Images stored as data URLs in localStorage — keep in mind localStorage size limits (~5MB)
- PNG/PDF/SVG export all preserve images via html-to-image/jsPDF
- Canvas renderer: large data URL images may slow down renders on low-end devices

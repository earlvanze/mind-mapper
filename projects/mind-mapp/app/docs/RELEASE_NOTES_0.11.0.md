# Mind Mapp v0.11.0 - Accessibility Improvements

**Released**: March 27, 2026

## Overview
Four targeted accessibility fixes targeting WCAG 2.1 AA compliance.

## Key Features

### 1. Skip Navigation Link
- Visually hidden "Skip to canvas" link at top of app
- Becomes visible on focus — keyboard users jump directly to canvas
- Target: `#mindmap-canvas` on the canvas div

### 2. `:focus-visible` Ring (Keyboard vs Mouse Discrimination)
- `.node:focus-visible` — visible 3px accent ring for keyboard focus
- `.node:focus:not(:focus-visible)` — removes ring for mouse/pointer clicks
- Most impactful WCAG fix — distinguishes keyboard from mouse interaction

### 3. `prefers-reduced-motion` Support
- Added `--motion-duration: 0ms` CSS custom property in `:root`
- Any `transition: ... var(--motion-duration)` collapses to 0ms
- Honors operating system reduced-motion preference

### 4. Dedicated `aria-live` Status Region
- Added visually hidden `<div id="mindmapp-status" aria-live="polite" aria-atomic="true">`
- Toolbar notices now have `aria-describedby="mindmapp-status"`
- Ensures screen readers properly announce dynamic status updates

### 5. Canvas Skip Target
- Canvas div now has `id="mindmap-canvas"` as skip link target
- `aria-label` already descriptive; `id` enables reliable skip link

## Breaking Changes
None.

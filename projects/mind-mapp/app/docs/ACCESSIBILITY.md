# Mind Mapp — Accessibility

## Keyboard Navigation
- Full keyboard navigation (arrows, Enter/Tab, search)
- Explicit edit mode to avoid shortcut conflicts
- **Enter** or **Space** on focused node triggers edit mode (keyboard users don't need mouse)
- **Tab** cycles focus through nodes in DOM order
- All toolbar buttons keyboard-accessible

## ARIA Roles & Attributes
- Node elements: `role="treeitem"` with `aria-selected` state
- Nodes use `tabIndex={0/-1}` pattern (focused node = 0, others = -1)
- Canvas container: `role="application"` for proper keyboard handling
- Mini-map: `role="region"` with `aria-label`
- Mini-map SVG: `aria-label` describes keyboard navigation
- Mini-map title `<div>`: `aria-hidden="true"` (visual label only, SVG has its own label)
- Toolbar: `role="toolbar"` with `aria-orientation="horizontal"`
- Style pickers: `role="dialog"` with `aria-label`
- Search/Help dialogs: `role="dialog"` with `aria-label`, `aria-haspopup`, `aria-expanded`
- All icon-only buttons: `aria-label` or visible text
- All toggle buttons: `aria-pressed`
- All controls with keyboard shortcuts: `aria-keyshortcuts`

## Focus Management
- Focused node highlighted with accent border
- Focus moves predictably with arrow keys
- Focused node is tabbable (tabIndex=0); other nodes are not
- Search/Help dialogs: focus trapped within, restored on close

## Color & Contrast
- Dark theme with high-contrast text
- Light theme available (Shift+T toggle)
- Color is never the only indicator (focus/selection uses border + background)

## Screen Reader Support
- Node text content is readable by screen readers
- `aria-live` regions for status/error notices (toolbar notices)
- `aria-busy` on search results while pending
- `aria-disabled` on pending search rows (visible but non-interactive)
- Breadcrumb path uses `aria-current="page"` on current segment

## Standards
- WCAG 2.1 Level A compliance target
- Follows WAI-ARIA tree pattern for node hierarchy
- Keyboard interactions follow common mind-map conventions

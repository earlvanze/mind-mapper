# Node Tags & Categories Specification

## Overview
Add tagging system to Mind Mapp nodes for better organization, filtering, and visualization.

## User Stories
- As a user, I want to tag nodes with categories (e.g., "priority", "done", "idea")
- As a user, I want to filter the map to show only nodes with specific tags
- As a user, I want to see tag statistics (count per tag)
- As a user, I want to export/import tags with the map data

## Features

### 1. Tag Management
- Each node can have 0+ tags
- Tags are simple strings (e.g., "urgent", "done", "idea")
- Tag autocomplete from existing tags in the map
- Tag UI: small colored badges below node text
- Quick tag operations via keyboard shortcuts

### 2. Tag UI Components
- **Tag input**: Inline tag editing (similar to text editing)
- **Tag badges**: Visual indicators on nodes
- **Tag picker dialog**: Browse/select existing tags (Cmd/Ctrl+T)
- **Tag filter panel**: Toggle visibility by tag
- **Tag legend**: Show all tags with counts

### 3. Tag Operations
- Add tag: Type tag name + Enter
- Remove tag: Click X on badge or Backspace in tag input
- Bulk tag: Add tag to all selected nodes
- Filter by tag: Show/hide nodes by tag
- Clear filters: Reset to show all nodes

### 4. Tag Visualization
- Color-coded tag badges (auto-assign from palette)
- Tag count in legend
- Filter indicator when tags are filtered
- Fade non-matching nodes when filtering

### 5. Keyboard Shortcuts
- `Cmd/Ctrl+T`: Open tag picker dialog
- `Cmd/Ctrl+Shift+T`: Toggle tag filter panel
- `#` while editing: Quick tag input mode
- `Escape`: Close tag dialogs

### 6. Data Model
```typescript
interface Node {
  // ... existing fields
  tags?: string[];
}

interface TagStats {
  tag: string;
  count: number;
  color: string; // auto-assigned
}

interface TagFilter {
  enabled: boolean;
  activeTags: Set<string>; // empty = show all
  mode: 'any' | 'all'; // match any tag or all tags
}
```

### 7. Storage
- Tags stored in node data (localStorage + JSON export)
- Tag colors stored in map metadata
- Filter state NOT persisted (reset on reload)

## Implementation Plan

### Phase 1: Data Model & Basic UI
- [ ] Add `tags` field to Node interface
- [ ] Update localStorage schema
- [ ] Create TagBadge component
- [ ] Display tags below node text
- [ ] Add tag to sample maps

### Phase 2: Tag Input & Editing
- [ ] Create TagInput component with autocomplete
- [ ] Add tag edit mode (click tag area to edit)
- [ ] Keyboard shortcuts for tag operations
- [ ] Bulk tag for multi-select

### Phase 3: Tag Picker Dialog
- [ ] Create TagPickerDialog component
- [ ] Show all existing tags with counts
- [ ] Click to toggle tag on selected nodes
- [ ] Create new tags inline

### Phase 4: Filtering & Visualization
- [ ] Tag filter panel component
- [ ] Filter logic (match any/all modes)
- [ ] Fade non-matching nodes
- [ ] Filter indicator in UI
- [ ] Clear filters button

### Phase 5: Export/Import
- [ ] Include tags in JSON export
- [ ] Preserve tags in FreeMind export (node attributes)
- [ ] Import tags from JSON
- [ ] Tag migration for existing maps

### Phase 6: Testing & Documentation
- [ ] Unit tests for tag operations
- [ ] Integration tests for filtering
- [ ] Update keyboard shortcuts doc
- [ ] Add tag tutorial to help dialog
- [ ] Update CHANGELOG

## Non-Goals (v1.1)
- Tag hierarchies (parent/child tags)
- Tag permissions/visibility
- Tag search/autocomplete in search dialog
- Predefined tag templates
- Tag analytics/reports

## UX Considerations
- Tags should not clutter the visual map
- Filtering should be instant (no lag on 1000+ nodes)
- Tag colors should be theme-aware (light/dark)
- Tag input should feel natural (like hashtags)

## Testing Strategy
- Unit tests for tag CRUD operations
- Filter logic tests (match any/all, empty filters)
- Export/import with tags
- Performance test with 100+ unique tags

## Success Metrics
- User can tag nodes in <2 clicks
- Filtering 1000 nodes by tag takes <100ms
- Tags preserved in all export formats
- Zero visual clutter when tags not used

## Related Issues
- Integrates with existing multi-select
- Works with search (future: filter by tag in search)
- Compatible with version history (tags in snapshots)

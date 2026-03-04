# Mind Mapp — MVP Spec (v0.1)

## Situation
We need a lightweight mind map app focused on speed and execution. The user wants “Automate Everything” and the app should feel like frictionless external cognition.

## Analysis
Most mind map tools are heavy (accounts, collaboration, templates). The MVP should prioritize:
- ultra-fast node creation
- zero setup
- export/share
- local persistence

## Recommendation
Build a browser-first MVP with local storage. Focus on keyboard-first UX. Add export + JSON for future automation pipelines.

## Core Jobs-to-be-Done
1. **Capture and structure** ideas rapidly without breaking flow.
2. **Rearrange** nodes to clarify relationships.
3. **Export** to share or archive.

## MVP Features
### 1) Node Operations
- Create root node (auto on open)
- Add child node: **Tab**
- Add sibling node: **Enter**
- Delete node: **Backspace/Delete**
- Edit label: double-click or **F2**

### 2) Layout & Navigation
- Drag node to reposition
- Pan (space + drag)
- Zoom (trackpad or ctrl+wheel)
- Auto-fit to view

### 3) Search & Jump
- **Cmd/Ctrl+K** opens search
- Type to filter nodes by label
- Enter to jump + focus

### 4) Persistence
- Autosave to localStorage (debounced)
- Manual save to JSON

### 5) Export
- Export PNG (current map)
- Export JSON (data model)

## Data Model (JSON)
```json
{
  "id": "map_001",
  "title": "Untitled",
  "nodes": [
    {
      "id": "n_root",
      "text": "Root",
      "x": 0,
      "y": 0,
      "parentId": null,
      "children": ["n_1", "n_2"]
    }
  ]
}
```

## UX Flow (Core)
1. Open app → root node focused
2. Type → label set
3. Tab → child created
4. Enter → sibling created
5. Cmd/Ctrl+K → search & jump

## Stack Proposal
- **Frontend:** React + TypeScript
- **Rendering:** SVG (simple) or Canvas (performance)
- **State:** Zustand or plain React state
- **Persistence:** localStorage + export/import JSON

## Risks
- Keyboard UX complexity on mobile
- Large maps performance if SVG only

## Next Actions
- Decide rendering method (SVG vs Canvas)
- Create wireframes for keyboard flow
- Prototype node creation + drag


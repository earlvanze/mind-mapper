# Mind Mapp — Imports

## Supported Formats

| Format | Extension | Detection |
|--------|-----------|-----------|
| MindMapp JSON | `.json` | Content or file extension |
| XMind | `.xmind` | Content or file extension |
| FreeMind | `.mm` | Content or file extension |
| Obsidian | `.md` | Content or file extension |

---

## MindMapp JSON

- Button: **Import JSON**
- Accepts: JSON export from Mind Mapp (versioned)
- Validates: JSON root, node shape, non-empty payload, and supported version (`1`)
- Validates graph integrity: root existence, parent/child consistency, duplicates, cycles, unreachable nodes
- Preserves: all node properties (position, style, tags, collapse state, images, children order)
- Shows import result notice in toolbar (success/error)

### Versioned Format
```json
{
  "version": 1,
  "nodes": {
    "n_root": { "id": "n_root", "text": "Root", "x": 400, "y": 300, "children": ["n_child"], "parentId": null }
  }
}
```

### Legacy Format (backward compatible)
```json
{
  "n_root": { "id": "n_root", "text": "Root", "x": 400, "y": 300, "children": ["n_child"], "parentId": null }
}
```

---

## XMind (.xmind)

- Button: **Import** → select `.xmind` file
- Supports: XMind 8 and XMind 9 XML format
- Preserves: node text, hierarchy, collapse state (via `<topic>` structure)
- Detected by: `<workbook>` root element or `.xmind` file extension

### XMind XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<workbook>
  <sheet>
    <title>Map Title</title>
    <root-topic>
      <title>Root Node</title>
      <children>
        <topics>
          <topic><title>Child 1</title></topic>
          <topic><title>Child 2</title></topic>
        </topics>
      </children>
    </root-topic>
  </sheet>
</workbook>
```

---

## FreeMind (.mm)

- Button: **Import** → select `.mm` file
- Supports: FreeMind 0.7.x - 0.9.x format
- Preserves: node text, hierarchy, collapse state (via `FOLDED="true"` attribute)
- Detected by: `<map version="...">` root element with `<node TEXT="...">` children or `.mm` extension

### FreeMind XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root">
    <node TEXT="Child 1"></node>
    <node TEXT="Collapsed Node" FOLDED="true">
      <node TEXT="Hidden"></node>
    </node>
  </node>
</map>
```

---

## Obsidian (.md)

- Button: **Import** → select `.md` file
- Supports: single markdown files or entire Obsidian vaults (as `.zip` archive)
- Parses:
  - **YAML frontmatter** → tags on root node
  - **Headings** (`#`, `##`, `###`) → child nodes
  - **Wiki-links** `[[note]]` → preserved as-is in text
  - **Task lists** `- [ ]` / `- [x]` → included in text
  - **Bullet lists** → child nodes
  - **Nested folders** → folder nodes in tree hierarchy

### Single File Example
```markdown
---
tags: [project, important]
---

# Main Topic

See [[Other Note]] for details.

## Section A

Content here.

### Subsection

More content.
```

### Vault Import (.zip)

When importing an Obsidian vault as a ZIP archive:
1. Extracts all `.md` files preserving folder structure
2. Creates folder nodes for each directory level
3. Collects all unique tags from frontmatter across files
4. Imports wiki-links as plain text (cross-reference links not hyperlinked)

---

## Sample Map

- Button: **Sample**
- Loads a built-in demo map (no file needed)
- Demonstrates: node creation, styling, connections, images

---

## Format Detection Priority

1. **File extension** (if provided) takes highest priority
2. **Content-based detection** as fallback:
   - MindMapp JSON: `{"nodes":...}` or `{"n_root":...}`
   - XMind: `<workbook>` or `<sheet>` + `<root-topic>`
   - FreeMind: `<map version=...>` + `<node TEXT=...>`
   - Obsidian: YAML frontmatter (`---`), wiki-links (`[[...]]`), or markdown headings

---

## Error Handling

Invalid files show an error notice in the toolbar with a descriptive message:

- **Invalid JSON**: "Invalid JSON: parse error"
- **Missing root**: "Invalid MindMapp JSON: missing root node"
- **Graph integrity**: "Invalid MindMapp JSON: parent mismatch" / "orphan/unreachable nodes"
- **Unsupported format**: "Unsupported file format. Supported formats: MindMapp JSON (.json), XMind (.xmind), FreeMind (.mm), Obsidian (.md)"

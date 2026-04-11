/**
 * Customizable keyboard shortcuts system.
 * 
 * Defines rebindable shortcuts with their default bindings.
 * Users can remap actions in ShortcutSettingsDialog.
 * Bindings are stored in localStorage.
 */

export type ShortcutAction = 
  | 'search'
  | 'help'
  | 'fit'
  | 'fitSelection'
  | 'fitSubtree'
  | 'centerFocus'
  | 'centerSelection'
  | 'centerSubtree'
  | 'centerRoot'
  | 'focusRoot'
  | 'focusParent'
  | 'focusChild'
  | 'focusPrevSibling'
  | 'focusNextSibling'
  | 'focusPrevLeaf'
  | 'focusNextLeaf'
  | 'focusSubtreeFirstLeaf'
  | 'focusSubtreeLastLeaf'
  | 'focusPrevious'
  | 'focusForward'
  | 'focusHistoryStart'
  | 'focusHistoryEnd'
  | 'toggleGrid'
  | 'toggleMiniMap'
  | 'toggleAdvanced'
  | 'toggleTheme'
  | 'toggleCollapse'
  | 'collapseAll'
  | 'expandAll'
  | 'layout'
  | 'layoutSubtree'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetView'
  | 'zoomInto'
  | 'exportPng'
  | 'exportMarkdown'
  | 'exportJson'
  | 'copySelection'
  | 'copySubtree'
  | 'copyPath'
  | 'addChild'
  | 'addSibling'
  | 'promoteNode'
  | 'deleteSelected'
  | 'duplicateSelected'
  | 'editNode'
  | 'tagPicker'
  | 'tagFilter'
  | 'versionHistory'
  | 'presentation'
  | 'focusMode'
  | 'undo'
  | 'redo';

export type ShortcutBinding = {
  action: ShortcutAction;
  desc: string;
  defaultKey: string;      // e.g. 'F', 'Cmd+K', 'Alt+R'
  defaultModifiers?: {
    meta?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
};

function parseKey(key: string): { key: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean } {
  const parts = key.split('+');
  const result = { key: '', meta: false, ctrl: false, alt: false, shift: false };
  for (const part of parts) {
    const p = part.trim();
    if (p === 'Cmd' || p === 'Meta' || p === 'Super') { result.meta = true; }
    else if (p === 'Ctrl' || p === 'Control') { result.ctrl = true; }
    else if (p === 'Alt' || p === 'Option') { result.alt = true; }
    else if (p === 'Shift') { result.shift = true; }
    else { result.key = p; }
  }
  return result;
}

function buildKey({ key, meta, ctrl, alt, shift }: ReturnType<typeof parseKey>): string {
  const parts: string[] = [];
  if (meta || ctrl) parts.push(ctrl ? 'Ctrl' : 'Cmd');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

export const DEFAULT_SHORTCUT_BINDINGS: ShortcutBinding[] = [
  // Core navigation
  { action: 'search',              desc: 'Open search dialog',               defaultKey: 'Cmd+K',        defaultModifiers: { meta: true } },
  { action: 'help',               desc: 'Toggle shortcuts help',             defaultKey: '?',           defaultModifiers: {} },
  { action: 'fit',               desc: 'Fit all nodes to view',             defaultKey: 'F',            defaultModifiers: {} },
  { action: 'fitSelection',       desc: 'Fit selected nodes to view',        defaultKey: 'Alt+F',        defaultModifiers: { alt: true } },
  { action: 'fitSubtree',         desc: 'Fit focused subtree to view',       defaultKey: 'Alt+Shift+F',  defaultModifiers: { alt: true, shift: true } },
  { action: 'centerFocus',        desc: 'Center focused node',                defaultKey: 'C',            defaultModifiers: {} },
  { action: 'centerSelection',    desc: 'Center selected nodes',              defaultKey: 'Alt+Shift+C',  defaultModifiers: { alt: true, shift: true } },
  { action: 'centerSubtree',      desc: 'Center focused subtree',              defaultKey: 'Alt+Shift+B',  defaultModifiers: { alt: true, shift: true } },
  { action: 'centerRoot',         desc: 'Center root node',                   defaultKey: 'Shift+C',      defaultModifiers: { shift: true } },
  { action: 'focusRoot',           desc: 'Focus root node',                    defaultKey: 'R',            defaultModifiers: {} },
  { action: 'focusParent',        desc: 'Focus parent node',                  defaultKey: 'Shift+P',      defaultModifiers: { shift: true } },
  { action: 'focusChild',         desc: 'Focus first child',                  defaultKey: 'Shift+N',      defaultModifiers: { shift: true } },
  { action: 'focusPrevSibling',   desc: 'Focus previous sibling',            defaultKey: 'Shift+H',      defaultModifiers: { shift: true } },
  { action: 'focusNextSibling',   desc: 'Focus next sibling',                defaultKey: 'Shift+J',      defaultModifiers: { shift: true } },
  { action: 'focusPrevLeaf',      desc: 'Focus previous leaf',               defaultKey: 'Shift+,',      defaultModifiers: { shift: true } },
  { action: 'focusNextLeaf',      desc: 'Focus next leaf',                   defaultKey: 'Shift+.',      defaultModifiers: { shift: true } },
  { action: 'focusSubtreeFirstLeaf', desc: 'Focus first leaf in subtree',    defaultKey: 'Shift+L',      defaultModifiers: { shift: true } },
  { action: 'focusSubtreeLastLeaf',  desc: 'Focus last leaf in subtree',     defaultKey: 'Shift+K',      defaultModifiers: { shift: true } },
  { action: 'focusPrevious',      desc: 'Jump back in focus history',        defaultKey: 'Alt+R',        defaultModifiers: { alt: true } },
  { action: 'focusForward',       desc: 'Jump forward in focus history',     defaultKey: 'Shift+R',      defaultModifiers: { shift: true } },
  { action: 'focusHistoryStart',  desc: 'Jump to oldest focus history',      defaultKey: 'Alt+Shift+Home', defaultModifiers: { alt: true, shift: true } },
  { action: 'focusHistoryEnd',    desc: 'Jump to newest focus history',      defaultKey: 'Alt+Shift+End', defaultModifiers: { alt: true, shift: true } },
  // Toggles & panels
  { action: 'toggleGrid',         desc: 'Toggle grid overlay',                defaultKey: 'Shift+G',      defaultModifiers: { shift: true } },
  { action: 'toggleMiniMap',     desc: 'Toggle mini-map',                     defaultKey: 'Shift+M',      defaultModifiers: { shift: true } },
  { action: 'toggleAdvanced',    desc: 'Toggle advanced toolbar',             defaultKey: 'Shift+A',      defaultModifiers: { shift: true } },
  { action: 'toggleTheme',       desc: 'Open theme dialog',                  defaultKey: 'Shift+T',      defaultModifiers: { shift: true } },
  { action: 'toggleCollapse',    desc: 'Toggle collapse on focused node',     defaultKey: '/',            defaultModifiers: {} },
  { action: 'collapseAll',       desc: 'Collapse all nodes',                 defaultKey: '',             defaultModifiers: {} },
  { action: 'expandAll',         desc: 'Expand all nodes',                    defaultKey: '',             defaultModifiers: {} },
  // Layout
  { action: 'layout',             desc: 'Cycle auto-layout mode',             defaultKey: 'L',            defaultModifiers: {} },
  { action: 'layoutSubtree',     desc: 'Auto-layout focused subtree',         defaultKey: 'Shift+L',      defaultModifiers: { shift: true } },
  // View
  { action: 'zoomIn',            desc: 'Zoom in',                              defaultKey: '=',            defaultModifiers: {} },
  { action: 'zoomOut',          desc: 'Zoom out',                             defaultKey: '-',            defaultModifiers: {} },
  { action: 'resetView',         desc: 'Reset pan/zoom',                      defaultKey: '0',            defaultModifiers: {} },
  { action: 'zoomInto',          desc: 'Zoom into focused node (Prezi-style)',   defaultKey: 'Z',            defaultModifiers: {} },
  // Export
  { action: 'exportPng',         desc: 'Export PNG',                           defaultKey: 'Cmd+Shift+S',  defaultModifiers: { meta: true, shift: true } },
  { action: 'exportMarkdown',   desc: 'Export Markdown',                    defaultKey: 'Cmd+Shift+M',  defaultModifiers: { meta: true, shift: true } },
  { action: 'exportJson',       desc: 'Export JSON (autosave)',               defaultKey: 'Cmd+S',        defaultModifiers: { meta: true } },
  // Copy
  { action: 'copySelection',     desc: 'Copy selected nodes text',             defaultKey: 'Cmd+Shift+C',  defaultModifiers: { meta: true, shift: true } },
  { action: 'copySubtree',      desc: 'Copy subtree outline',               defaultKey: 'Cmd+Shift+L',  defaultModifiers: { meta: true, shift: true } },
  { action: 'copyPath',         desc: 'Copy focused node path',              defaultKey: 'Alt+Shift+P',  defaultModifiers: { alt: true, shift: true } },
  // Node editing
  { action: 'addChild',         desc: 'Add child node',                      defaultKey: 'Enter',        defaultModifiers: {} },
  { action: 'addSibling',       desc: 'Add sibling node',                    defaultKey: 'Tab',          defaultModifiers: {} },
  { action: 'promoteNode',      desc: 'Promote node (make sibling of parent)',defaultKey: 'Shift+Tab',     defaultModifiers: { shift: true } },
  { action: 'deleteSelected',   desc: 'Delete selected nodes',               defaultKey: 'Delete',        defaultModifiers: {} },
  { action: 'duplicateSelected', desc: 'Duplicate selected nodes',            defaultKey: 'Cmd+D',        defaultModifiers: { meta: true } },
  { action: 'editNode',         desc: 'Edit focused node',                   defaultKey: 'E',             defaultModifiers: {} },
  // Tags
  { action: 'tagPicker',        desc: 'Open tag picker dialog',             defaultKey: 'Cmd+T',         defaultModifiers: { meta: true } },
  { action: 'tagFilter',        desc: 'Toggle tag filter panel',             defaultKey: 'Cmd+Shift+F',  defaultModifiers: { meta: true, shift: true } },
  { action: 'versionHistory',   desc: 'Open version history',               defaultKey: 'Alt+V',         defaultModifiers: { alt: true } },
  { action: 'focusMode',        desc: 'Toggle focus mode (dim non-subtree)',  defaultKey: 'F',             defaultModifiers: { shift: true } },
  { action: 'presentation',     desc: 'Start presentation mode',             defaultKey: 'P',             defaultModifiers: {} },
  // Undo/Redo
  { action: 'undo',              desc: 'Undo',                                defaultKey: 'Cmd+Z',         defaultModifiers: { meta: true } },
  { action: 'redo',             desc: 'Redo',                                 defaultKey: 'Cmd+Shift+Z',  defaultModifiers: { meta: true, shift: true } },
];

const SHORTCUTS_STORAGE_KEY = 'mindmapp.v0.2.shortcuts';

export type ShortcutsPrefs = Partial<Record<ShortcutAction, string>>; // action → key string

export function loadShortcutsPrefs(): ShortcutsPrefs {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ShortcutsPrefs;
  } catch {
    return {};
  }
}

export function saveShortcutsPrefs(prefs: ShortcutsPrefs) {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function getBindingForAction(action: ShortcutAction): string {
  const prefs = loadShortcutsPrefs();
  if (prefs[action] !== undefined) return prefs[action]!;
  const def = DEFAULT_SHORTCUT_BINDINGS.find(b => b.action === action);
  return def?.defaultKey ?? '';
}

export function getEffectiveBinding(binding: ShortcutBinding): string {
  const prefs = loadShortcutsPrefs();
  return prefs[binding.action] ?? binding.defaultKey;
}

/**
 * Parse a keyboard event and a key string, return whether they match.
 */
export function matchesBinding(
  e: KeyboardEvent,
  bindingKey: string,
): boolean {
  if (!bindingKey) return false;
  const { key, meta, ctrl, alt, shift } = parseKey(bindingKey);
  
  // Normalize the event key
  const eventKey = e.key;
  const eventKeyLower = eventKey.toLowerCase();
  const targetKey = key.toLowerCase();
  
  // Check if the base key matches
  let keyMatches = eventKeyLower === targetKey || eventKey === key;
  
  // Special cases for equals/plus
  if (key === '=' && (eventKey === '=' || eventKey === '+')) keyMatches = true;
  
  if (!keyMatches) return false;
  
  // Check modifiers
  const metaMatch = (e.metaKey || e.ctrlKey) === (meta || ctrl);
  const altMatch = e.altKey === alt;
  const shiftMatch = e.shiftKey === shift;
  
  return metaMatch && altMatch && shiftMatch;
}

/**
 * Check if a new key binding conflicts with any existing binding.
 */
export function findConflicts(
  action: ShortcutAction,
  newKey: string,
  prefs: ShortcutsPrefs
): ShortcutBinding | null {
  if (!newKey) return null;
  for (const binding of DEFAULT_SHORTCUT_BINDINGS) {
    if (binding.action === action) continue;
    const existingKey = prefs[binding.action] ?? binding.defaultKey;
    if (existingKey === newKey) return binding;
  }
  return null;
}

/**
 * Build a Shortcut[] array for the HelpDialog, using effective (custom or default) bindings.
 */
export function getEffectiveShortcuts(): { key: string; desc: string }[] {
  const prefs = loadShortcutsPrefs();
  return DEFAULT_SHORTCUT_BINDINGS
    .filter(b => {
      const key = prefs[b.action] ?? b.defaultKey;
      return !!key;
    })
    .map(b => ({
      key: prefs[b.action] ?? b.defaultKey,
      desc: b.desc,
    }));
}

/**
 * Reset all custom bindings to defaults.
 */
export function resetAllBindings() {
  saveShortcutsPrefs({});
}

/**
 * Dispatch map — maps ShortcutAction to its callback name in useKeyboard.
 * This lets us route custom bindings to the right handler.
 */
export type ShortcutHandlerMap = Partial<Record<ShortcutAction, () => void>>;

/**
 * Check if a keyboard event matches a custom binding.
 * Returns the action if matched, null otherwise.
 */
export function checkCustomBinding(
  e: KeyboardEvent,
  prefs: ShortcutsPrefs,
): ShortcutAction | null {
  for (const binding of DEFAULT_SHORTCUT_BINDINGS) {
    const effectiveKey = prefs[binding.action] ?? binding.defaultKey;
    if (!effectiveKey) continue;
    if (matchesBinding(e, effectiveKey)) {
      // If this is a custom binding (not default), return the action
      if (prefs[binding.action] !== undefined) {
        return binding.action;
      }
    }
  }
  return null;
}


/**
 * Maps ShortcutAction → useKeyboard callback prop name.
 * Must stay in sync with useKeyboard Props interface.
 */
export const ACTION_TO_HANDLER: Record<ShortcutAction, string> = {
  search:              'onSearch',
  help:                'onHelp',
  fit:                 'onFit',
  fitSelection:        'onFitSelection',
  fitSubtree:          'onFitSubtree',
  centerFocus:         'onCenterFocus',
  centerSelection:     'onCenterSelection',
  centerSubtree:       'onCenterSubtree',
  centerRoot:          'onCenterRoot',
  focusRoot:           'onFocusRoot',
  focusParent:         'onFocusParent',
  focusChild:          'onFocusChild',
  focusPrevSibling:    'onFocusPrevSibling',
  focusNextSibling:    'onFocusNextSibling',
  focusPrevLeaf:       'onFocusPrevLeaf',
  focusNextLeaf:       'onFocusNextLeaf',
  focusSubtreeFirstLeaf: 'onFocusSubtreeFirstLeaf',
  focusSubtreeLastLeaf:  'onFocusSubtreeLastLeaf',
  focusPrevious:       'onFocusPrevious',
  focusForward:        'onFocusForward',
  focusHistoryStart:   'onFocusHistoryStart',
  focusHistoryEnd:     'onFocusHistoryEnd',
  toggleGrid:          'onToggleGrid',
  toggleMiniMap:       'onToggleMiniMap',
  toggleAdvanced:      'onToggleAdvanced',
  toggleTheme:         'onToggleTheme',
  toggleCollapse:      'onToggleCollapse',
  collapseAll:         'onCollapseAll',
  expandAll:           'onExpandAll',
  layout:              'onLayout',
  layoutSubtree:        'onLayoutSubtree',
  zoomIn:              'onZoomIn',
  zoomOut:             'onZoomOut',
  resetView:           'onResetView',
  zoomInto:            'onZoomInto',
  exportPng:           'onExportPng',
  exportMarkdown:      'onExportMarkdown',
  exportJson:          'onExportJson',
  copySelection:       'onCopySelection',
  copySubtree:         'onCopySubtree',
  copyPath:            'onCopyPath',
  addChild:            'onAddChild',
  addSibling:          'onAddSibling',
  promoteNode:         'onPromoteNode',
  deleteSelected:      'onDeleteSelected',
  duplicateSelected:   'onDuplicateSelected',
  editNode:            'onEditNode',
  tagPicker:           'onTagPicker',
  tagFilter:           'onTagFilter',
  versionHistory:      'onVersionHistory',
  presentation:        'onPresentation',
  focusMode:           'onFocusMode',
  undo:                'onUndo',
  redo:                'onRedo',
};

export function getHandlerNameForAction(action: ShortcutAction): string {
  return ACTION_TO_HANDLER[action] ?? action;
}

// ── Import / Export ──────────────────────────────────────────────────────────

const EXPORT_VERSION = 1;

export interface ShortcutsExport {
  version: number;
  exportedAt: number;
  shortcuts: ShortcutsPrefs;
  numericPrefs?: import('./uiPrefs').KeyboardPrefs;
}

/**
 * Export current shortcuts as a JSON string, optionally including numeric prefs.
 */
export function exportShortcutsAsJson(numericPrefs?: import('./uiPrefs').KeyboardPrefs): string {
  const exp: ShortcutsExport = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    shortcuts: loadShortcutsPrefs(),
    numericPrefs,
  };
  return JSON.stringify(exp, null, 2);
}

/**
 * Validate and apply imported shortcuts JSON.
 * Returns an error message string on failure, null on success.
 */
export function importShortcutsFromJson(json: string): string | null {
  let data: ShortcutsExport;
  try {
    data = JSON.parse(json) as ShortcutsExport;
  } catch {
    return 'Invalid JSON — could not parse file.';
  }
  if (typeof data.version !== 'number') return 'Missing version field.';
  if (typeof data.shortcuts !== 'object' || data.shortcuts === null) return 'Missing shortcuts object.';
  // Validate each key is a known action
  const validActions = new Set(DEFAULT_SHORTCUT_BINDINGS.map(b => b.action));
  for (const action of Object.keys(data.shortcuts)) {
    if (!validActions.has(action as ShortcutAction)) {
      return `Unknown action "${action}" in imported shortcuts.`;
    }
  }
  saveShortcutsPrefs(data.shortcuts);
  // Numeric prefs are validated by uiPrefs.saveKeyboardPrefs
  if (data.numericPrefs) {
    try {
      const { saveKeyboardPrefs } = require('./uiPrefs');
      saveKeyboardPrefs(data.numericPrefs);
    } catch {
      // numeric prefs are optional — ignore if uiPrefs not available
    }
  }
  return null;
}

/**
 * Trigger a file download of the current shortcuts.
 */
export function downloadShortcuts() {
  const json = exportShortcutsAsJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmapp-shortcuts.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy shortcuts JSON to clipboard.
 * Returns a promise that resolves on success.
 */
export async function copyShortcutsToClipboard(): Promise<void> {
  const json = exportShortcutsAsJson();
  await navigator.clipboard.writeText(json);
}

/**
 * Read shortcuts from a File object.
 * Returns a promise resolving to the JSON string.
 */
export function readShortcutsFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

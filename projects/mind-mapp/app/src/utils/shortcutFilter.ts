import type { Shortcut } from './shortcuts';

function normalizeShortcutText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bcmd\/ctrl\b/g, 'cmd ctrl')
    .replace(/\bctrl\/cmd\b/g, 'cmd ctrl')
    .replace(/\//g, ' slash ')
    .replace(/\+/g, ' plus ')
    .replace(/\?/g, ' question ')
    .replace(/</g, ' less ')
    .replace(/>/g, ' greater ')
    .replace(/,/g, ' comma ')
    .replace(/\./g, ' dot ')
    .replace(/\bcontrol\b/g, 'ctrl')
    .replace(/\bcommand\b/g, 'cmd')
    .replace(/\bescape\b/g, 'esc')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterShortcuts(shortcuts: Shortcut[], query: string): Shortcut[] {
  const normalizedQuery = normalizeShortcutText(query);
  if (!normalizedQuery) return shortcuts;

  const terms = normalizedQuery.split(' ');

  return shortcuts.filter((shortcut) => {
    const haystack = normalizeShortcutText(`${shortcut.key} ${shortcut.desc}`);
    return terms.every(term => haystack.includes(term));
  });
}

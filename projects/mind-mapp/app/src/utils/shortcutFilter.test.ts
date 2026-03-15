import { describe, expect, it } from 'vitest';
import type { Shortcut } from './shortcuts';
import { filterShortcuts, tokenizeShortcutQuery } from './shortcutFilter';

const SAMPLE: Shortcut[] = [
  { key: 'Cmd/Ctrl+F', desc: 'focus search input' },
  { key: 'Cmd/Ctrl+/', desc: 'toggle help dialog' },
  { key: 'Shift+PageUp', desc: 'pan mini-map horizontally' },
  { key: 'Alt+Shift+Q', desc: 'reset focus history' },
];

describe('tokenizeShortcutQuery', () => {
  it('returns empty terms for blank input', () => {
    expect(tokenizeShortcutQuery('   ')).toEqual([]);
  });

  it('normalizes symbol/alias words into searchable terms', () => {
    expect(tokenizeShortcutQuery('Cmd/Ctrl+/')).toEqual(['cmd', 'ctrl', 'plus', 'slash']);
    expect(tokenizeShortcutQuery('forward slash')).toEqual(['slash']);
    expect(tokenizeShortcutQuery('???')).toEqual(['question']);
  });

  it('deduplicates repeated normalized query terms', () => {
    expect(tokenizeShortcutQuery('ctrl ctrl slash slash')).toEqual(['ctrl', 'slash']);
    expect(tokenizeShortcutQuery('plus plus plus')).toEqual(['plus']);
  });

  it('reuses frozen token arrays for equivalent normalized queries', () => {
    const first = tokenizeShortcutQuery('ctrl slash');
    const second = tokenizeShortcutQuery('CTRL   SLASH');

    expect(first).toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
  });
});

describe('filterShortcuts', () => {
  it('returns all shortcuts for empty query', () => {
    const result = filterShortcuts(SAMPLE, '   ');
    expect(result).toEqual(SAMPLE);
    expect(result).toBe(SAMPLE);
  });

  it('returns a filtered array instance for non-empty queries', () => {
    const result = filterShortcuts(SAMPLE, 'cmd');
    expect(result).not.toBe(SAMPLE);
  });

  it('treats repeated punctuation-only query as repeated normalized terms', () => {
    expect(filterShortcuts(SAMPLE, '???')).toEqual([]);
  });

  it('matches punctuation-agnostic shortcut queries', () => {
    const result = filterShortcuts(SAMPLE, 'cmd f');
    expect(result.map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+F']);
  });

  it('matches single-term shortcut queries', () => {
    const result = filterShortcuts(SAMPLE, 'mini');
    expect(result.map(shortcut => shortcut.key)).toEqual(['Shift+PageUp']);
  });

  it('matches multi-term queries across key + description', () => {
    const result = filterShortcuts(SAMPLE, 'mini map pageup');
    expect(result.map(shortcut => shortcut.key)).toEqual(['Shift+PageUp']);
  });

  it('requires all terms to match', () => {
    const result = filterShortcuts(SAMPLE, 'focus history reset');
    expect(result.map(shortcut => shortcut.key)).toEqual(['Alt+Shift+Q']);
  });

  it('matches symbol/alias words in query text', () => {
    expect(filterShortcuts(SAMPLE, 'ctrl slash').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+/']);
    expect(filterShortcuts(SAMPLE, 'command slash').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+/']);
    expect(filterShortcuts(SAMPLE, 'forward slash').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+/']);
    expect(filterShortcuts(SAMPLE, 'question mark').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+/']);
  });

  it('matches plus-separated key names as words', () => {
    expect(filterShortcuts(SAMPLE, 'shift plus pageup').map(shortcut => shortcut.key)).toEqual(['Shift+PageUp']);
  });

  it('matches repeated query terms after tokenizer dedupe', () => {
    expect(filterShortcuts(SAMPLE, 'ctrl ctrl slash slash').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+/']);
  });

  it('refreshes cached haystack when shortcut text changes', () => {
    const dynamic: Shortcut[] = [
      { key: 'Cmd/Ctrl+F', desc: 'focus search input' },
    ];

    expect(filterShortcuts(dynamic, 'focus').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+F']);

    dynamic[0].desc = 'toggle help dialog';

    expect(filterShortcuts(dynamic, 'focus')).toEqual([]);
    expect(filterShortcuts(dynamic, 'toggle').map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+F']);
  });
});

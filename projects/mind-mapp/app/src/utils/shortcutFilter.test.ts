import { describe, expect, it } from 'vitest';
import type { Shortcut } from './shortcuts';
import { filterShortcuts } from './shortcutFilter';

const SAMPLE: Shortcut[] = [
  { key: 'Cmd/Ctrl+F', desc: 'focus search input' },
  { key: 'Cmd/Ctrl+/', desc: 'toggle help dialog' },
  { key: 'Shift+PageUp', desc: 'pan mini-map horizontally' },
  { key: 'Alt+Shift+Q', desc: 'reset focus history' },
];

describe('filterShortcuts', () => {
  it('returns all shortcuts for empty query', () => {
    expect(filterShortcuts(SAMPLE, '   ')).toEqual(SAMPLE);
  });

  it('matches punctuation-agnostic shortcut queries', () => {
    const result = filterShortcuts(SAMPLE, 'cmd f');
    expect(result.map(shortcut => shortcut.key)).toEqual(['Cmd/Ctrl+F']);
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
  });

  it('matches plus-separated key names as words', () => {
    expect(filterShortcuts(SAMPLE, 'shift plus pageup').map(shortcut => shortcut.key)).toEqual(['Shift+PageUp']);
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HelpDialog from './HelpDialog';

// Mock the store so HelpDialog tests don't pull in the full store
vi.mock('../store/useMindMapStore', () => ({
  useMindMapStore: vi.fn(() => ({
    nodes: {},
    focusId: 'root',
  })),
}));

describe('HelpDialog', () => {
  const onClose = vi.fn();
  const onOpenShortcutSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when open is false', () => {
    const el = createElement(HelpDialog, { open: false, onClose });
    expect(renderToStaticMarkup(el)).toBe('');
  });

  it('renders dialog with correct role and aria attributes when open', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('renders Shortcuts heading', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('Shortcuts');
  });

  it('renders filter input with placeholder', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('Filter shortcuts');
  });

  it('renders Focus Navigation & History section', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('Focus Navigation');
  });

  it('renders Tags Tutorial toggle button', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('Tags Tutorial');
  });

  it('renders Customize Shortcuts button when onOpenShortcutSettings is provided', () => {
    const el = createElement(HelpDialog, { open: true, onClose, onOpenShortcutSettings });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('Customize');
    expect(html).toContain('aria-label="Customize keyboard shortcuts"');
  });

  it('does NOT render Customize Shortcuts button when onOpenShortcutSettings is not provided', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).not.toContain('Customize');
  });

  it('close button has correct aria attributes', () => {
    const el = createElement(HelpDialog, { open: true, onClose });
    const html = renderToStaticMarkup(el);
    expect(html).toContain('aria-label="Close shortcuts dialog"');
  });
});

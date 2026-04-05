import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpDialog from './HelpDialog';

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
    const { container } = render(<HelpDialog open={false} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog with correct role and aria attributes when open', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders Shortcuts heading', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByText('Shortcuts')).toBeInTheDocument();
  });

  it('renders filter input with placeholder', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByPlaceholderText(/filter shortcuts/i)).toBeInTheDocument();
  });

  it('renders Focus Navigation & History section', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByText(/focus navigation/i)).toBeInTheDocument();
  });

  it('renders Tags Tutorial toggle button', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByText(/tags tutorial/i)).toBeInTheDocument();
  });

  it('renders Customize Shortcuts button when onOpenShortcutSettings is provided', () => {
    render(<HelpDialog open={true} onClose={onClose} onOpenShortcutSettings={onOpenShortcutSettings} />);
    expect(screen.getByRole('button', { name: /customize keyboard shortcuts/i })).toBeInTheDocument();
  });

  it('does NOT render Customize Shortcuts button when onOpenShortcutSettings is not provided', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.queryByRole('button', { name: /customize/i })).not.toBeInTheDocument();
  });

  it('close button has correct aria attributes', () => {
    render(<HelpDialog open={true} onClose={onClose} />);
    expect(screen.getByRole('button', { name: /close shortcuts dialog/i })).toBeInTheDocument();
  });
});

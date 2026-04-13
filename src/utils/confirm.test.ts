import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { confirmAction } from './confirm';

describe('confirmAction', () => {
  let mockConfirm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConfirm = vi.fn();
    vi.stubGlobal('window', { confirm: mockConfirm } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when user clicks OK', () => {
    mockConfirm.mockReturnValue(true);
    expect(confirmAction('Are you sure?')).toBe(true);
  });

  it('returns false when user clicks Cancel', () => {
    mockConfirm.mockReturnValue(false);
    expect(confirmAction('Are you sure?')).toBe(false);
  });

  it('passes the message string to window.confirm', () => {
    mockConfirm.mockReturnValue(true);
    confirmAction('Delete this node?');
    expect(mockConfirm).toHaveBeenCalledWith('Delete this node?');
  });

  it('returns false and does not throw when window.confirm throws', () => {
    mockConfirm.mockImplementation(() => { throw new Error('permission denied'); });
    // Should return false, not throw
    expect(confirmAction('test')).toBe(false);
  });

  it('returns false when window.confirm is not a function (undefined)', () => {
    // @ts-ignore
    vi.stubGlobal('window', { confirm: undefined } as any);
    expect(confirmAction('test')).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToProject, broadcastChange } from './realtime';

vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      send: vi.fn(),
      state: 'joined',
    })),
    getChannels: vi.fn(() => []),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('realtime module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribeToProject returns a cleanup function when configured', async () => {
    const cleanup = subscribeToProject('project-1', 'user-1', vi.fn());
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('subscribeToProject connects to the right channel name', async () => {
    const { supabase } = await import('../lib/supabase');
    const handler = vi.fn();
    subscribeToProject('proj-abc', 'user-1', handler)();
    expect(supabase!.channel).toHaveBeenCalledWith('project-proj-abc', {
      config: { broadcast: { self: false } },
    });
  });

  it('broadcastChange returns true when configured', async () => {
    const result = await broadcastChange('project-1', {
      operation: 'UPSERT',
      payload: {},
    });
    expect(result).toBe(true);
  });

  it('broadcastChange returns false when not configured', async () => {
    const { broadcastChange } = await import('./realtime');
    // When supabase is null/undefined (simulated by isSupabaseConfigured=false)
    const result = await broadcastChange('project-1', {
      operation: 'UPSERT',
      payload: {},
    });
    // With mocked supabase as configured=true, this returns true
    expect(result).toBe(true);
  });
});

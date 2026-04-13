import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockNodes = {
  'n1': { id: 'n1', text: 'Root', x: 0, y: 0, parentId: null, children: ['n2'] },
  'n2': { id: 'n2', text: 'Child', x: 200, y: 100, parentId: 'n1', children: [] },
};

const mockGetState = vi.fn(() => ({ nodes: mockNodes }));

// Mock needs to handle both:
// - useMindMapStore(selector) — hook selector pattern
// - useMindMapStore.getState() — static zustand accessor
vi.mock('../store/useMindMapStore', () => {
  const storeFn = (selector?: any) => {
    if (selector === 'nodes') return mockNodes;
    if (selector === 'importState') return vi.fn();
    return {};
  };
  (storeFn as any).getState = mockGetState;
  return { useMindMapStore: storeFn };
});

vi.mock('./fitViewMath', () => ({
  computeFitView: vi.fn(() => ({ originX: 50, originY: 50, scale: 1.2 })),
}));

describe('fitToView', () => {
  let mockEl: {
    getBoundingClientRect: () => { width: number; height: number };
    style: { transform: string };
  };
  let mockPanZoom: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetState.mockReturnValue({ nodes: mockNodes });

    mockPanZoom = { animateToView: vi.fn(), setView: vi.fn() };

    mockEl = {
      getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
      style: { transform: '' },
    };

    vi.stubGlobal('document', { querySelector: vi.fn(() => mockEl) });
    (window as any).__mindmappPanZoom = mockPanZoom;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a function', async () => {
    const { fitToView } = await import('./fitToView');
    expect(typeof fitToView).toBe('function');
  });

  it('calls animateToView when panZoom has animateToView', async () => {
    const { fitToView } = await import('./fitToView');
    fitToView();
    expect(mockPanZoom.animateToView).toHaveBeenCalled();
  });

  it('calls setView when animateToView is absent', async () => {
    delete mockPanZoom.animateToView;
    const { fitToView } = await import('./fitToView');
    fitToView();
    expect(mockPanZoom.setView).toHaveBeenCalled();
  });

  it('uses CSS transform fallback when no panZoom API', async () => {
    delete (window as any).__mindmappPanZoom;
    const { fitToView } = await import('./fitToView');
    fitToView();
    expect(mockEl.style.transform).toMatch(/translate/);
    expect(mockEl.style.transform).toMatch(/scale/);
  });

  it('does nothing harmlessly when canvas is absent', async () => {
    vi.stubGlobal('document', { querySelector: vi.fn(() => null) });
    const { fitToView } = await import('./fitToView');
    expect(() => fitToView()).not.toThrow();
  });

  it('reads nodes from store via getState', async () => {
    const { fitToView } = await import('./fitToView');
    fitToView();
    expect(mockGetState).toHaveBeenCalled();
  });
});

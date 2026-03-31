import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  prefersReducedMotion,
  opacityTransition,
  transformTransition,
  layoutTransition,
  getNodeAnimationStyle,
  interpolateEdgePath,
} from './nodeAnimations';

describe('nodeAnimations', () => {
  describe('prefersReducedMotion', () => {
    it('returns false when window is undefined', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - testing undefined case
      delete (globalThis as any).window;
      expect(prefersReducedMotion()).toBe(false);
      globalThis.window = originalWindow;
    });
  });

  describe('opacityTransition', () => {
    it('returns transition string by default', () => {
      const result = opacityTransition(200);
      expect(result).toContain('opacity');
      expect(result).toContain('200ms');
    });

    it('returns none when prefersReducedMotion', () => {
      const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any);
      expect(opacityTransition()).toBe('none');
      matchMedia.mockRestore();
    });
  });

  describe('transformTransition', () => {
    it('returns spring-like transition by default', () => {
      const result = transformTransition(250);
      expect(result).toContain('transform');
      expect(result).toContain('250ms');
      expect(result).toContain('cubic-bezier');
    });

    it('returns none when prefersReducedMotion', () => {
      const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any);
      expect(transformTransition()).toBe('none');
      matchMedia.mockRestore();
    });
  });

  describe('layoutTransition', () => {
    it('returns position transition by default', () => {
      const result = layoutTransition(300);
      expect(result).toContain('left');
      expect(result).toContain('300ms');
    });

    it('returns none when prefersReducedMotion', () => {
      const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any);
      expect(layoutTransition()).toBe('none');
      matchMedia.mockRestore();
    });
  });

  describe('getNodeAnimationStyle', () => {
    beforeEach(() => {
      // Force no reduced motion preference for most tests
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns entry animation for new node', () => {
      const now = Date.now();
      const style = getNodeAnimationStyle(now, true, false);
      expect(style).toHaveProperty('animation');
      expect((style.animation as string).toString()).toContain('nodeEntry');
    });

    it('returns exit animation for deleting node', () => {
      const style = getNodeAnimationStyle(Date.now(), false, true);
      expect(style).toHaveProperty('animation');
      expect((style.animation as string)).toContain('nodeExit');
    });

    it('returns empty for node that has settled (old enough)', () => {
      const oldTimestamp = Date.now() - 1000; // 1 second ago
      const style = getNodeAnimationStyle(oldTimestamp, false, false);
      expect(style).toEqual({});
    });

    it('returns empty when prefersReducedMotion', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as any);
      const style = getNodeAnimationStyle(Date.now(), true, false);
      expect(style).toEqual({});
    });
  });

  describe('interpolateEdgePath', () => {
    it('returns start position at progress 0', () => {
      const path = interpolateEdgePath(0, 0, 100, 50, 0);
      expect(path).toContain('M0,0');
    });

    it('returns end position at progress 1', () => {
      const path = interpolateEdgePath(0, 0, 100, 50, 1);
      expect(path).toContain('100,50');
      expect(path).toContain('C');
    });

    it('returns intermediate position at progress 0.5', () => {
      const path = interpolateEdgePath(0, 0, 100, 50, 0.5);
      expect(path).toContain('M0,0');
    });

    it('handles vertical edges', () => {
      const path = interpolateEdgePath(50, 0, 50, 100, 0.5);
      expect(path).toContain('M50,0');
    });

    it('handles horizontal edges', () => {
      const path = interpolateEdgePath(0, 50, 100, 50, 0.5);
      expect(path).toContain('M0,50');
    });
  });
});

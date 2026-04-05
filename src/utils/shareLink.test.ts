import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encodeShareLink, decodeShareLink, hasShareLink, loadSharedMap, clearShareLink } from './shareLink';
import type { Node } from '../store/useMindMapStore';

describe('shareLink', () => {
  const sampleNodes: Record<string, Node> = {
    n_root: {
      id: 'n_root',
      text: 'Root',
      x: 320,
      y: 180,
      parentId: null,
      children: ['n_1'],
    },
    n_1: {
      id: 'n_1',
      text: 'Child',
      x: 450,
      y: 180,
      parentId: 'n_root',
      children: [],
    },
  };

  let mockLocation: { origin: string; pathname: string; hash: string };
  let mockHistory: { replaceState: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLocation = { origin: 'http://localhost:3000', pathname: '/', hash: '' };
    mockHistory = { replaceState: vi.fn() };
    
    // Create a proper mock for window.location that returns mockLocation values
    Object.defineProperty(globalThis, 'window', {
      value: {
        get location() {
          return mockLocation;
        },
        history: mockHistory,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('encodeShareLink', () => {
    it('creates a valid share link', () => {
      const link = encodeShareLink(sampleNodes);
      expect(link).toMatch(/^http:\/\/localhost:3000\/#share=[A-Za-z0-9_-]+$/);
    });

    it('encodes different maps to different links', () => {
      const link1 = encodeShareLink(sampleNodes);
      const link2 = encodeShareLink({
        ...sampleNodes,
        n_root: { ...sampleNodes.n_root, text: 'Different' },
      });
      expect(link1).not.toBe(link2);
    });
  });

  describe('decodeShareLink', () => {
    it('decodes a valid share link', () => {
      const link = encodeShareLink(sampleNodes);
      const hash = '#' + link.split('#')[1];
      const decoded = decodeShareLink(hash);
      expect(decoded).toEqual(sampleNodes);
    });

    it('returns null for invalid hash format', () => {
      expect(decodeShareLink('#invalid')).toBeNull();
      expect(decodeShareLink('#share=')).toBeNull();
      expect(decodeShareLink('')).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      expect(decodeShareLink('#share=invalid-base64')).toBeNull();
    });

    it('returns null for invalid node structure', () => {
      const invalidNodes = { n_1: { text: 'Missing required fields' } };
      const json = JSON.stringify(invalidNodes);
      const encoded = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      expect(decodeShareLink(`#share=${encoded}`)).toBeNull();
    });
  });

  describe('hasShareLink', () => {
    it('returns true when hash starts with #share=', () => {
      mockLocation.hash = '#share=abc123';
      expect(hasShareLink()).toBe(true);
    });

    it('returns false for other hashes', () => {
      mockLocation.hash = '#other';
      expect(hasShareLink()).toBe(false);
      mockLocation.hash = '';
      expect(hasShareLink()).toBe(false);
    });
  });

  describe('loadSharedMap', () => {
    it('loads map from valid share link', () => {
      const link = encodeShareLink(sampleNodes);
      const hash = '#' + link.split('#')[1];
      mockLocation.hash = hash;
      const loaded = loadSharedMap();
      expect(loaded).toEqual(sampleNodes);
    });

    it('returns null when no share link present', () => {
      mockLocation.hash = '';
      expect(loadSharedMap()).toBeNull();
    });
  });

  describe('clearShareLink', () => {
    it('clears share link from URL', () => {
      mockLocation.hash = '#share=abc123';
      clearShareLink();
      expect(mockHistory.replaceState).toHaveBeenCalledWith(null, '', '/');
    });

    it('does nothing when no share link present', () => {
      mockLocation.hash = '#other';
      clearShareLink();
      expect(mockHistory.replaceState).not.toHaveBeenCalled();
    });
  });
});

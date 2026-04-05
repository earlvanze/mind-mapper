// URL share link utilities
import type { Node } from '../store/useMindMapStore';

/**
 * Compress and encode map state into URL-safe hash
 */
export function encodeShareLink(nodes: Record<string, Node>): string {
  try {
    const json = JSON.stringify(nodes);
    // Use base64url encoding (URL-safe)
    const encoded = btoa(json)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
  } catch (err) {
    console.error('Failed to encode share link:', err);
    throw new Error('Failed to create share link');
  }
}

/**
 * Decode map state from URL hash
 */
export function decodeShareLink(hash: string): Record<string, Node> | null {
  try {
    const match = hash.match(/^#share=(.+)$/);
    if (!match) return null;
    
    // Decode base64url
    const encoded = match[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
    
    const json = atob(padded);
    const nodes = JSON.parse(json);
    
    // Basic validation
    if (typeof nodes !== 'object' || !nodes || Array.isArray(nodes)) {
      return null;
    }
    
    // Validate node structure
    for (const [id, node] of Object.entries(nodes)) {
      if (typeof node !== 'object' || !node) return null;
      const n = node as Record<string, unknown>;
      if (typeof n.text !== 'string') return null;
      if (typeof n.x !== 'number') return null;
      if (typeof n.y !== 'number') return null;
      if (n.parentId !== null && typeof n.parentId !== 'string') return null;
      if (!Array.isArray(n.children)) return null;
    }
    
    return nodes as Record<string, Node>;
  } catch (err) {
    console.error('Failed to decode share link:', err);
    return null;
  }
}

/**
 * Check if current URL contains a share link
 */
export function hasShareLink(): boolean {
  return window.location.hash.startsWith('#share=');
}

/**
 * Load shared map from URL if present
 */
export function loadSharedMap(): Record<string, Node> | null {
  if (!hasShareLink()) return null;
  return decodeShareLink(window.location.hash);
}

/**
 * Clear share link from URL
 */
export function clearShareLink(): void {
  if (hasShareLink()) {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

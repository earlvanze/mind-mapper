import { useMindMapStore } from '../store/useMindMapStore';

/**
 * Animation utilities for nodes.
 * Supports entry/exit animations and respects prefers-reduced-motion.
 */

export interface AnimationState {
  isNew: boolean;
  isDeleting: boolean;
  createdAt: number;
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns CSS transition value for opacity.
 */
export function opacityTransition(durationMs = 200): string {
  return prefersReducedMotion() ? 'none' : `opacity ${durationMs}ms ease`;
}

/**
 * Returns CSS transition value for transform (scale + translate).
 */
export function transformTransition(durationMs = 250): string {
  if (prefersReducedMotion()) return 'none';
  return `transform ${durationMs}ms cubic-bezier(0.34, 1.56, 0.64, 1)`; // spring-like
}

/**
 * Returns CSS transition for layout position changes.
 */
export function layoutTransition(durationMs = 300): string {
  if (prefersReducedMotion()) return 'none';
  return `left ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), top ${durationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
}

/**
 * Node animation states based on timestamps.
 * Returns animation style properties for a node.
 */
export function getNodeAnimationStyle(
  createdAt: number,
  isNew: boolean,
  isDeleting: boolean,
  durationMs = 250
): React.CSSProperties {
  if (prefersReducedMotion()) return {};

  const elapsed = Date.now() - createdAt;
  
  // If node is older than double the animation duration, no special styling needed
  if (elapsed > durationMs * 3 && !isDeleting) return {};

  if (isNew && !isDeleting) {
    // Entry: scale from 0.5 + fade in
    return {
      animation: `nodeEntry ${durationMs}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
    };
  }

  if (isDeleting) {
    // Exit: scale down + fade out
    return {
      animation: `nodeExit ${durationMs}ms ease-out forwards`,
    };
  }

  return {};
}

/**
 * Inject keyframe CSS for node animations into the document head.
 * Call once on app init.
 */
export function injectNodeAnimationCSS(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('node-animation-css')) return;

  const style = document.createElement('style');
  style.id = 'node-animation-css';
  style.textContent = `
@keyframes nodeEntry {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes nodeExit {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
  `;
  document.head.appendChild(style);
}

/**
 * Animate edge path from old to new position using interpolation.
 * Returns the interpolated path at a given progress (0-1).
 * Uses cubic bezier interpolation.
 */
export function interpolateEdgePath(
  x1: number, y1: number,
  x2: number, y2: number,
  progress: number
): string {
  // Control points for cubic bezier
  const cp1x = x1 + (x2 - x1) * 0.5;
  const cp1y = y1;
  const cp2x = x1 + (x2 - x1) * 0.5;
  const cp2y = y2;

  // Interpolate control points
  const ip1x = x1 + (cp1x - x1) * progress;
  const ip1y = y1 + (cp1y - y1) * progress;
  const ip2x = x1 + (cp2x - x1) * progress;
  const ip2y = y1 + (cp2y - y1) * progress;
  const ix2 = x1 + (x2 - x1) * progress;
  const iy2 = y1 + (y2 - y1) * progress;

  return `M${x1},${y1} C${ip1x},${ip1y} ${ip2x},${ip2y} ${ix2},${iy2}`;
}

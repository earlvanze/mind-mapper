import { useState, useCallback, useRef, useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

const TRANSITION_DURATION = 300; // ms — must match CSS transition duration

/**
 * Hook to manage smooth layout transitions.
 * When triggered, sets a transitioning flag that enables CSS transitions on nodes.
 * Auto-removes after TRANSITION_DURATION to allow free movement afterwards.
 */
export function useLayoutTransitions() {
  const isTransitioning = useMindMapStore(s => s.isTransitioning);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTransition = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Set transitioning — nodes will use CSS transitions
    useMindMapStore.getState().setIsTransitioning(true);
    // Auto-disable after duration
    timerRef.current = setTimeout(() => {
      useMindMapStore.getState().setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isTransitioning, startTransition };
}

/**
 * Read the user's motion preference.
 * Returns true if they prefer reduced motion (animations should be disabled or minimal).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns a CSS transition value for position changes.
 * Respects prefers-reduced-motion.
 * 
 * Usage: transition: getPositionTransition(transitioning);
 */
export function getPositionTransition(transitioning: boolean): string {
  if (transitioning && !prefersReducedMotion()) {
    return 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }
  return 'none';
}

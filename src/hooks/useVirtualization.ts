import { useEffect, useState } from 'react';
import { Node } from '../store/useMindMapStore';
import { getVisibleNodes, type Viewport } from '../utils/virtualization';

/**
 * Hook for viewport-based virtualization
 * Filters nodes to only those visible in current viewport
 */
export function useVirtualization(
  nodes: Record<string, Node>,
  enabled: boolean,
  threshold = 500 // Only enable virtualization for maps with >500 nodes
) {
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(
    new Set(Object.keys(nodes))
  );

  // Listen for viewport changes
  useEffect(() => {
    const handleViewChange = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number; scale: number }>).detail;
      if (detail) {
        setViewport((prev) => ({
          ...prev,
          x: detail.x ?? prev.x,
          y: detail.y ?? prev.y,
          scale: detail.scale ?? prev.scale,
        }));
      }
    };

    const handleResize = () => {
      setViewport((prev) => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener('mindmapp:viewchange', handleViewChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mindmapp:viewchange', handleViewChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update visible nodes when viewport or nodes change
  useEffect(() => {
    const nodeCount = Object.keys(nodes).length;
    
    // Only virtualize for large maps
    if (!enabled || nodeCount < threshold) {
      setVisibleNodeIds(new Set(Object.keys(nodes)));
      return;
    }

    const { visibleNodes } = getVisibleNodes(nodes, viewport, 1.3);
    setVisibleNodeIds(new Set(visibleNodes));
  }, [nodes, viewport, enabled, threshold]);

  return {
    visibleNodeIds,
    shouldVirtualize: enabled && Object.keys(nodes).length >= threshold,
  };
}

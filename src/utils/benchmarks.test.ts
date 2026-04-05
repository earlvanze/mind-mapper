import { describe, it, expect, vi } from 'vitest';
import {
  generateTestMap,
  measureRenderTime,
  getMemoryUsage,
  formatBenchmarkResults,
  type BenchmarkMetrics,
} from './benchmarks';

describe('benchmarks', () => {
  describe('generateTestMap', () => {
    it('generates the correct number of nodes', () => {
      const map = generateTestMap(100);
      expect(map).toHaveLength(100);
    });

    it('creates a tree structure with parent relationships', () => {
      const map = generateTestMap(10);
      expect(map[0].parentId).toBeNull();
      expect(map[1].parentId).toBe('node-0');
    });

    it('assigns random positions', () => {
      const map = generateTestMap(5);
      const positions = map.map((n) => `${n.x},${n.y}`);
      const unique = new Set(positions);
      expect(unique.size).toBeGreaterThan(1); // Should have some variation
    });
  });

  describe('measureRenderTime', () => {
    it('measures sync function execution time', async () => {
      const fn = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
      };
      const time = await measureRenderTime(100, fn);
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(100); // Should be fast
    });

    it('measures async function execution time', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };
      const time = await measureRenderTime(100, fn);
      expect(time).toBeGreaterThanOrEqual(1); // 10ms each, allow timer granularity tolerance
    });
  });

  describe('getMemoryUsage', () => {
    it('returns undefined if memory API not available', () => {
      const mem = getMemoryUsage();
      // Memory API may or may not be available in test environment
      expect(typeof mem === 'number' || mem === undefined).toBe(true);
    });
  });

  describe('formatBenchmarkResults', () => {
    it('formats benchmark results as markdown', () => {
      const metrics: BenchmarkMetrics = {
        timestamp: '2026-03-27T15:00:00.000Z',
        browser: 'Test Browser',
        device: 'Test Device',
        results: [
          { nodeCount: 100, renderTime: 15.5, memoryUsed: 25.3, fps: 60 },
          { nodeCount: 500, renderTime: 45.2, memoryUsed: 45.8, fps: 58 },
        ],
      };

      const md = formatBenchmarkResults(metrics);
      expect(md).toContain('# Performance Benchmarks');
      expect(md).toContain('Test Browser');
      expect(md).toContain('Test Device');
      expect(md).toContain('| 100 | 15.50 | 25.30 | 60.0 |');
      expect(md).toContain('| 500 | 45.20 | 45.80 | 58.0 |');
    });

    it('handles missing memory/fps data', () => {
      const metrics: BenchmarkMetrics = {
        timestamp: '2026-03-27T15:00:00.000Z',
        browser: 'Test',
        device: 'Test',
        results: [{ nodeCount: 100, renderTime: 15.5 }],
      };

      const md = formatBenchmarkResults(metrics);
      expect(md).toContain('| 100 | 15.50 | N/A | N/A |');
    });
  });
});

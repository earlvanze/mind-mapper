/**
 * Performance benchmarking utilities for Mind Mapp
 * Measures render time, memory usage, and interaction performance
 */

export interface BenchmarkResult {
  nodeCount: number;
  renderTime: number; // ms
  memoryUsed?: number; // MB
  fps?: number;
  interactionLatency?: number; // ms
}

export interface BenchmarkMetrics {
  timestamp: string;
  results: BenchmarkResult[];
  browser: string;
  device: string;
}

/**
 * Measure render time for a given node count
 */
export async function measureRenderTime(
  nodeCount: number,
  renderFn: () => Promise<void> | void
): Promise<number> {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): number | undefined {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    return mem.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }
  return undefined;
}

/**
 * Measure FPS over a duration
 */
export async function measureFPS(durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    
    const countFrame = () => {
      frames++;
      const elapsed = performance.now() - start;
      if (elapsed < durationMs) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frames / elapsed) * 1000;
        resolve(fps);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
}

/**
 * Generate a large test map
 */
export function generateTestMap(nodeCount: number) {
  const nodes = [];
  const branchingFactor = 3;
  
  for (let i = 0; i < nodeCount; i++) {
    const parentId = i === 0 ? null : `node-${Math.floor((i - 1) / branchingFactor)}`;
    nodes.push({
      id: `node-${i}`,
      text: `Node ${i}`,
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 2000 - 1000,
      parentId,
      style: {
        preset: i % 2 === 0 ? 'default' : 'primary',
        shape: 'rounded',
      },
    });
  }
  
  return nodes;
}

/**
 * Run full benchmark suite
 */
export async function runBenchmarks(
  nodeCounts: number[] = [100, 500, 1000, 2000, 5000]
): Promise<BenchmarkMetrics> {
  const results: BenchmarkResult[] = [];
  
  for (const count of nodeCounts) {
    const nodes = generateTestMap(count);
    
    // Measure render time
    const renderTime = await measureRenderTime(count, async () => {
      // Simulate render by creating DOM nodes
      const container = document.createElement('div');
      nodes.forEach((node) => {
        const el = document.createElement('div');
        el.textContent = node.text;
        container.appendChild(el);
      });
      container.remove();
    });
    
    const memoryUsed = getMemoryUsage();
    const fps = await measureFPS(500);
    
    results.push({
      nodeCount: count,
      renderTime,
      memoryUsed,
      fps,
    });
  }
  
  return {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    device: navigator.platform,
    results,
  };
}

/**
 * Format benchmark results as markdown table
 */
export function formatBenchmarkResults(metrics: BenchmarkMetrics): string {
  let md = `# Performance Benchmarks\n\n`;
  md += `**Date:** ${new Date(metrics.timestamp).toLocaleString()}\n`;
  md += `**Browser:** ${metrics.browser}\n`;
  md += `**Device:** ${metrics.device}\n\n`;
  md += `## Results\n\n`;
  md += `| Nodes | Render Time (ms) | Memory (MB) | FPS |\n`;
  md += `|-------|------------------|-------------|-----|\n`;
  
  metrics.results.forEach((r) => {
    const mem = r.memoryUsed ? r.memoryUsed.toFixed(2) : 'N/A';
    const fps = r.fps ? r.fps.toFixed(1) : 'N/A';
    md += `| ${r.nodeCount} | ${r.renderTime.toFixed(2)} | ${mem} | ${fps} |\n`;
  });
  
  return md;
}

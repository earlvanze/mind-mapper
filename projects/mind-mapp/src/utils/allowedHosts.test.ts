import { describe, expect, it } from 'vitest';
import { DEFAULT_ALLOWED_HOSTS, parseAllowedHosts, resolveAllowedHosts } from './allowedHosts';

describe('parseAllowedHosts', () => {
  it('parses comma/space separated host strings', () => {
    expect(parseAllowedHosts('a.com, b.com  c.com')).toEqual(['a.com', 'b.com', 'c.com']);
  });

  it('deduplicates hosts', () => {
    expect(parseAllowedHosts('a.com,a.com b.com')).toEqual(['a.com', 'b.com']);
  });

  it('normalizes url-like host values', () => {
    expect(parseAllowedHosts('https://A.COM/path, http://b.com:5173?q=1')).toEqual(['a.com', 'b.com:5173']);
  });

  it('deduplicates hosts case-insensitively after normalization', () => {
    expect(parseAllowedHosts('HTTPS://EXAMPLE.COM,example.com')).toEqual(['example.com']);
  });

  it('returns empty list for blank input', () => {
    expect(parseAllowedHosts('   ')).toEqual([]);
    expect(parseAllowedHosts(undefined)).toEqual([]);
  });
});

describe('resolveAllowedHosts', () => {
  it('uses parsed hosts when provided', () => {
    expect(resolveAllowedHosts('x.com,y.com')).toEqual(['x.com', 'y.com']);
  });

  it('falls back to defaults when no hosts are provided', () => {
    expect(resolveAllowedHosts('')).toEqual([...DEFAULT_ALLOWED_HOSTS]);
  });
});

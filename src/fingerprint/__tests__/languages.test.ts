import { describe, it, expect } from 'vitest';
import { detectLanguages } from '../languages.js';

describe('detectLanguages', () => {
  it('detects TypeScript from .ts and .tsx extensions', () => {
    const result = detectLanguages(['app.ts', 'component.tsx']);
    expect(result).toEqual(['TypeScript']);
  });

  it('detects multiple languages', () => {
    const result = detectLanguages(['main.py', 'server.ts', 'main.go']);
    expect(result).toContain('Python');
    expect(result).toContain('TypeScript');
    expect(result).toContain('Go');
    expect(result).toHaveLength(3);
  });

  it('deduplicates languages from related extensions', () => {
    const result = detectLanguages(['a.ts', 'b.tsx', 'c.js', 'd.jsx']);
    expect(result).toContain('TypeScript');
    expect(result).toContain('JavaScript');
    expect(result).toHaveLength(2);
  });

  it('returns empty array for unknown extensions', () => {
    const result = detectLanguages(['readme.md', 'config.yaml', 'data.json']);
    expect(result).toEqual([]);
  });

  it('handles empty file tree', () => {
    expect(detectLanguages([])).toEqual([]);
  });

  it('handles case insensitivity for extensions', () => {
    const result = detectLanguages(['main.PY', 'script.Ts']);
    // path.extname preserves case, toLowerCase handles it
    expect(result).toContain('Python');
    expect(result).toContain('TypeScript');
  });

  it('detects Elixir from both .ex and .exs', () => {
    const result = detectLanguages(['app.ex', 'test.exs']);
    expect(result).toEqual(['Elixir']);
  });
});

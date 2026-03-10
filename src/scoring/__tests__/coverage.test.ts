import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkCoverage } from '../checks/coverage.js';
import * as fs from 'fs';

vi.mock('fs');

const mockFs = vi.mocked(fs);

function setupFs(files: Record<string, string>) {
  mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
    return String(path) in files;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockFs.readFileSync.mockImplementation(((path: fs.PathLike) => {
    const content = files[String(path)];
    if (content === undefined) throw new Error(`ENOENT: ${path}`);
    return content;
  }) as any);
  mockFs.readdirSync.mockReturnValue([]);
}

describe('checkCoverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('scores full points when all deps are mentioned in CLAUDE.md', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        dependencies: { express: '4.0', zod: '3.0' },
      }),
      '/project/CLAUDE.md': '# Project\nUses express for HTTP and zod for validation.',
    });

    const checks = checkCoverage('/project');
    const depCheck = checks.find(c => c.id === 'dep_coverage');
    expect(depCheck?.passed).toBe(true);
    expect(depCheck?.earnedPoints).toBeGreaterThan(0);
  });

  it('penalizes when deps are not mentioned in config', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        dependencies: { express: '4.0', drizzle: '1.0', redis: '4.0' },
      }),
      '/project/CLAUDE.md': '# Project\nA simple project.',
    });

    const checks = checkCoverage('/project');
    const depCheck = checks.find(c => c.id === 'dep_coverage');
    expect(depCheck?.passed).toBe(false);
    expect(depCheck?.suggestion).toContain('express');
  });

  it('detects missing MCP for services', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        dependencies: { pg: '8.0', mongoose: '7.0' },
      }),
      '/project/CLAUDE.md': '# Project',
    });

    const checks = checkCoverage('/project');
    const serviceCheck = checks.find(c => c.id === 'service_coverage');
    expect(serviceCheck?.passed).toBe(false);
    expect(serviceCheck?.suggestion).toContain('postgresql');
  });

  it('handles missing package.json gracefully', () => {
    setupFs({
      '/project/CLAUDE.md': '# Project\nSome content.',
    });

    const checks = checkCoverage('/project');
    const depCheck = checks.find(c => c.id === 'dep_coverage');
    expect(depCheck?.passed).toBe(true); // no deps = no problem
    expect(depCheck?.earnedPoints).toBeGreaterThan(0);
  });

  it('filters out trivial dependencies', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        dependencies: { express: '4.0' },
        devDependencies: { typescript: '5.0', '@types/node': '20.0', prettier: '3.0' },
      }),
      '/project/CLAUDE.md': '# Project\nUses express.',
    });

    const checks = checkCoverage('/project');
    const depCheck = checks.find(c => c.id === 'dep_coverage');
    // typescript, @types/node, prettier are trivial — only express matters
    expect(depCheck?.passed).toBe(true);
  });
});

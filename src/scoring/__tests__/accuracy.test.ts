import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAccuracy } from '../checks/accuracy.js';
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
  mockFs.statSync.mockImplementation((path: fs.PathLike) => {
    if (String(path) in files) {
      return { mtime: new Date() } as fs.Stats;
    }
    throw new Error(`ENOENT: ${path}`);
  });
}

describe('checkAccuracy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates documented npm commands against package.json scripts', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        scripts: { build: 'tsc', test: 'vitest', dev: 'tsx watch' },
      }),
      '/project/CLAUDE.md': '## Commands\n```\nnpm run build\nnpm test\nnpm run dev\n```',
    });

    const checks = checkAccuracy('/project');
    const cmdCheck = checks.find(c => c.id === 'commands_valid');
    expect(cmdCheck?.passed).toBe(true);
    expect(cmdCheck?.detail).toContain('3/3');
  });

  it('detects invalid commands not in package.json', () => {
    setupFs({
      '/project/package.json': JSON.stringify({
        scripts: { build: 'tsc' },
      }),
      '/project/CLAUDE.md': '## Commands\n```\nnpm run build\nnpm run deploy\nnpm run migrate\n```',
    });

    const checks = checkAccuracy('/project');
    const cmdCheck = checks.find(c => c.id === 'commands_valid');
    expect(cmdCheck?.passed).toBe(false);
    expect(cmdCheck?.suggestion).toContain('deploy');
  });

  it('validates documented file paths exist on disk', () => {
    setupFs({
      '/project/CLAUDE.md': 'Key files:\n- `src/index.ts`\n- `src/lib/auth.ts`\n- `src/missing/gone.ts`',
      '/project/src/index.ts': '',
      '/project/src/lib/auth.ts': '',
    });

    const checks = checkAccuracy('/project');
    const pathCheck = checks.find(c => c.id === 'paths_valid');
    expect(pathCheck?.detail).toContain('2/3');
    expect(pathCheck?.suggestion).toContain('src/missing/gone.ts');
  });

  it('scores full points when no CLAUDE.md exists', () => {
    setupFs({
      '/project/package.json': JSON.stringify({ scripts: {} }),
    });

    const checks = checkAccuracy('/project');
    const cmdCheck = checks.find(c => c.id === 'commands_valid');
    expect(cmdCheck?.passed).toBe(true); // nothing to validate = no problem
  });

  it('detects config drift when code is newer than config', () => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFs.readdirSync.mockImplementation(((path: fs.PathLike) => {
      if (String(path).includes('src')) return ['index.ts'] as unknown as fs.Dirent[];
      return [];
    }) as any);
    mockFs.statSync.mockImplementation((path: fs.PathLike) => {
      const p = String(path);
      if (p.includes('CLAUDE.md') || p.includes('.cursorrules')) {
        return { mtime: new Date(thirtyDaysAgo) } as fs.Stats;
      }
      return { mtime: new Date(now) } as fs.Stats;
    });

    const checks = checkAccuracy('/project');
    const driftCheck = checks.find(c => c.id === 'config_drift');
    expect(driftCheck?.passed).toBe(false);
    expect(driftCheck?.detail).toContain('30');
  });
});

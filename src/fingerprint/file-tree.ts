import fs from 'fs';
import path from 'path';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  '.turbo', 'coverage', '.caliber', '__pycache__', '.venv',
  'vendor', 'target',
]);

export function getFileTree(dir: string, maxDepth = 3): string[] {
  const files: string[] = [];
  scan(dir, '', 0, maxDepth, files);
  return files;
}

function scan(base: string, rel: string, depth: number, maxDepth: number, result: string[]) {
  if (depth > maxDepth) return;

  const fullPath = path.join(base, rel);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(fullPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && depth === 0 && entry.isDirectory()) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const relPath = rel ? `${rel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      result.push(`${relPath}/`);
      scan(base, relPath, depth + 1, maxDepth, result);
    } else {
      result.push(relPath);
    }
  }
}

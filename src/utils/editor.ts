import { execSync, spawn } from 'child_process';

export type ReviewMethod = 'cursor' | 'vscode' | 'terminal';

function commandExists(cmd: string): boolean {
  try {
    const check = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(check, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectAvailableEditors(): ReviewMethod[] {
  const methods: ReviewMethod[] = [];
  if (commandExists('cursor')) methods.push('cursor');
  if (commandExists('code')) methods.push('vscode');
  methods.push('terminal');
  return methods;
}

export function openDiffsInEditor(
  editor: 'cursor' | 'vscode',
  files: Array<{ originalPath?: string; proposedPath: string }>
): void {
  const cmd = editor === 'cursor' ? 'cursor' : 'code';

  for (const file of files) {
    try {
      if (file.originalPath) {
        spawn(cmd, ['--diff', file.originalPath, file.proposedPath], {
          stdio: 'ignore',
          detached: true,
          shell: true,
        }).unref();
      } else {
        spawn(cmd, [file.proposedPath], {
          stdio: 'ignore',
          detached: true,
          shell: true,
        }).unref();
      }
    } catch {
      continue;
    }
  }
}

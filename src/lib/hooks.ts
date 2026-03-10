import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join('.claude', 'settings.json');
const HOOK_COMMAND = 'caliber refresh --quiet';
const HOOK_DESCRIPTION = 'Caliber: auto-refreshing docs based on code changes';

interface HookEntry {
  type: string;
  command: string;
  description?: string;
}

interface HookMatcher {
  matcher: string;
  hooks: HookEntry[];
}

interface ClaudeSettings {
  hooks?: {
    SessionEnd?: HookMatcher[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function readSettings(): ClaudeSettings {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSettings(settings: ClaudeSettings): void {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function findHookIndex(sessionEnd: HookMatcher[]): number {
  return sessionEnd.findIndex(entry =>
    entry.hooks?.some(h => h.command === HOOK_COMMAND)
  );
}

export function isHookInstalled(): boolean {
  const settings = readSettings();
  const sessionEnd = settings.hooks?.SessionEnd;
  if (!Array.isArray(sessionEnd)) return false;
  return findHookIndex(sessionEnd) !== -1;
}

export function installHook(): { installed: boolean; alreadyInstalled: boolean } {
  const settings = readSettings();

  if (!settings.hooks) settings.hooks = {};
  if (!Array.isArray(settings.hooks.SessionEnd)) settings.hooks.SessionEnd = [];

  if (findHookIndex(settings.hooks.SessionEnd) !== -1) {
    return { installed: false, alreadyInstalled: true };
  }

  settings.hooks.SessionEnd.push({
    matcher: '',
    hooks: [{ type: 'command', command: HOOK_COMMAND, description: HOOK_DESCRIPTION }],
  });

  writeSettings(settings);
  return { installed: true, alreadyInstalled: false };
}

export function removeHook(): { removed: boolean; notFound: boolean } {
  const settings = readSettings();
  const sessionEnd = settings.hooks?.SessionEnd;

  if (!Array.isArray(sessionEnd)) {
    return { removed: false, notFound: true };
  }

  const idx = findHookIndex(sessionEnd);
  if (idx === -1) {
    return { removed: false, notFound: true };
  }

  sessionEnd.splice(idx, 1);
  if (sessionEnd.length === 0) {
    delete settings.hooks!.SessionEnd;
  }
  if (settings.hooks && Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeSettings(settings);
  return { removed: true, notFound: false };
}

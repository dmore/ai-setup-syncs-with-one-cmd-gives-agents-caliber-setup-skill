import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join('.claude', 'settings.json');

const HOOK_CONFIGS = [
  {
    event: 'PostToolUse',
    command: 'caliber learn observe',
    description: 'Caliber: recording tool usage for session learning',
  },
  {
    event: 'PostToolUseFailure',
    command: 'caliber learn observe --failure',
    description: 'Caliber: recording tool failure for session learning',
  },
  {
    event: 'SessionEnd',
    command: 'caliber learn finalize',
    description: 'Caliber: finalizing session learnings',
  },
] as const;

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
  hooks?: Record<string, HookMatcher[]>;
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

function isLearningHook(command: string): boolean {
  return HOOK_CONFIGS.some(cfg => cfg.command === command);
}

function hasLearningHook(matchers: HookMatcher[], command: string): boolean {
  return matchers.some(entry => entry.hooks?.some(h => h.command === command));
}

export function areLearningHooksInstalled(): boolean {
  const settings = readSettings();
  if (!settings.hooks) return false;

  return HOOK_CONFIGS.every(cfg => {
    const matchers = settings.hooks![cfg.event];
    return Array.isArray(matchers) && hasLearningHook(matchers, cfg.command);
  });
}

export function installLearningHooks(): { installed: boolean; alreadyInstalled: boolean } {
  if (areLearningHooksInstalled()) {
    return { installed: false, alreadyInstalled: true };
  }

  const settings = readSettings();
  if (!settings.hooks) settings.hooks = {};

  for (const cfg of HOOK_CONFIGS) {
    if (!Array.isArray(settings.hooks[cfg.event])) {
      settings.hooks[cfg.event] = [];
    }

    if (!hasLearningHook(settings.hooks[cfg.event], cfg.command)) {
      settings.hooks[cfg.event].push({
        matcher: '',
        hooks: [{ type: 'command', command: cfg.command, description: cfg.description }],
      });
    }
  }

  writeSettings(settings);
  return { installed: true, alreadyInstalled: false };
}

export function removeLearningHooks(): { removed: boolean; notFound: boolean } {
  const settings = readSettings();
  if (!settings.hooks) return { removed: false, notFound: true };

  let removedAny = false;

  for (const cfg of HOOK_CONFIGS) {
    const matchers = settings.hooks[cfg.event];
    if (!Array.isArray(matchers)) continue;

    const idx = matchers.findIndex(entry => entry.hooks?.some(h => h.command === cfg.command));
    if (idx !== -1) {
      matchers.splice(idx, 1);
      removedAny = true;

      if (matchers.length === 0) delete settings.hooks[cfg.event];
    }
  }

  if (settings.hooks && Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  if (!removedAny) return { removed: false, notFound: true };

  writeSettings(settings);
  return { removed: true, notFound: false };
}

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Check } from '../index.js';
import {
  POINTS_HOOKS,
  POINTS_AGENTS_MD,
  POINTS_OPEN_SKILLS_FORMAT,
} from '../constants.js';

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

export function checkBonus(dir: string): Check[] {
  const checks: Check[] = [];

  // 1. Hooks configured
  let hasHooks = false;
  let hookDetail = '';

  const settingsContent = readFileOrNull(join(dir, '.claude', 'settings.json'));
  if (settingsContent) {
    try {
      const settings = JSON.parse(settingsContent) as Record<string, unknown>;
      const hooks = settings.hooks as Record<string, unknown> | undefined;
      if (hooks && Object.keys(hooks).length > 0) {
        hasHooks = true;
        hookDetail = `${Object.keys(hooks).length} hook${Object.keys(hooks).length === 1 ? '' : 's'}: ${Object.keys(hooks).join(', ')}`;
      } else {
        hookDetail = 'No hooks in settings.json';
      }
    } catch {
      hookDetail = 'settings.json is not valid JSON';
    }
  } else {
    hookDetail = 'No .claude/settings.json';
  }

  checks.push({
    id: 'hooks_configured',
    name: 'Hooks configured',
    category: 'bonus',
    maxPoints: POINTS_HOOKS,
    earnedPoints: hasHooks ? POINTS_HOOKS : 0,
    passed: hasHooks,
    detail: hookDetail,
    suggestion: hasHooks
      ? undefined
      : 'Add hooks (e.g., SessionEnd for auto-refresh) to .claude/settings.json',
  });

  // 2. AGENTS.md exists
  const agentsMdExists = existsSync(join(dir, 'AGENTS.md'));
  checks.push({
    id: 'agents_md_exists',
    name: 'AGENTS.md exists',
    category: 'bonus',
    maxPoints: POINTS_AGENTS_MD,
    earnedPoints: agentsMdExists ? POINTS_AGENTS_MD : 0,
    passed: agentsMdExists,
    detail: agentsMdExists ? 'Found at project root' : 'Not found',
    suggestion: agentsMdExists
      ? undefined
      : 'Add AGENTS.md — the emerging cross-agent standard (60k+ repos)',
  });

  // 3. Skills use OpenSkills format (SKILL.md with YAML frontmatter)
  const skillsDir = join(dir, '.claude', 'skills');
  let openSkillsCount = 0;
  let totalSkillFiles = 0;

  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // OpenSkills format: .claude/skills/{name}/SKILL.md
        const skillMd = readFileOrNull(join(skillsDir, entry.name, 'SKILL.md'));
        if (skillMd) {
          totalSkillFiles++;
          // Check for YAML frontmatter (starts with ---)
          if (skillMd.trimStart().startsWith('---')) {
            openSkillsCount++;
          }
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Legacy format: .claude/skills/{name}.md (flat file)
        totalSkillFiles++;
      }
    }
  } catch {
    // skills dir doesn't exist
  }

  const allOpenSkills = totalSkillFiles > 0 && openSkillsCount === totalSkillFiles;
  checks.push({
    id: 'open_skills_format',
    name: 'Skills use OpenSkills format',
    category: 'bonus',
    maxPoints: POINTS_OPEN_SKILLS_FORMAT,
    earnedPoints: allOpenSkills ? POINTS_OPEN_SKILLS_FORMAT : 0,
    passed: allOpenSkills,
    detail:
      totalSkillFiles === 0
        ? 'No skills to check'
        : allOpenSkills
          ? `All ${totalSkillFiles} skill${totalSkillFiles === 1 ? '' : 's'} use SKILL.md with frontmatter`
          : `${openSkillsCount}/${totalSkillFiles} use OpenSkills format`,
    suggestion:
      totalSkillFiles > 0 && !allOpenSkills
        ? 'Migrate skills to .claude/skills/{name}/SKILL.md with YAML frontmatter (SkillsBench: +16.2pp improvement)'
        : undefined,
  });

  return checks;
}

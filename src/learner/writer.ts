import fs from 'fs';
import path from 'path';

const LEARNED_START = '<!-- caliber:learned -->';
const LEARNED_END = '<!-- /caliber:learned -->';

export interface LearnedSkill {
  name: string;
  description: string;
  content: string;
  isNew: boolean;
}

export interface LearnedUpdate {
  claudeMdLearnedSection: string | null;
  skills: LearnedSkill[] | null;
}

export function writeLearnedContent(update: LearnedUpdate): string[] {
  const written: string[] = [];

  if (update.claudeMdLearnedSection) {
    writeLearnedSection(update.claudeMdLearnedSection);
    written.push('CLAUDE.md');
  }

  if (update.skills?.length) {
    for (const skill of update.skills) {
      const skillPath = writeLearnedSkill(skill);
      written.push(skillPath);
    }
  }

  return written;
}

function writeLearnedSection(content: string): void {
  const claudeMdPath = 'CLAUDE.md';
  let existing = '';

  if (fs.existsSync(claudeMdPath)) {
    existing = fs.readFileSync(claudeMdPath, 'utf-8');
  }

  const section = `${LEARNED_START}\n${content}\n${LEARNED_END}`;

  const startIdx = existing.indexOf(LEARNED_START);
  const endIdx = existing.indexOf(LEARNED_END);

  let updated: string;
  if (startIdx !== -1 && endIdx !== -1) {
    updated = existing.slice(0, startIdx) + section + existing.slice(endIdx + LEARNED_END.length);
  } else {
    const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
    updated = existing + separator + '\n' + section + '\n';
  }

  fs.writeFileSync(claudeMdPath, updated);
}

function writeLearnedSkill(skill: LearnedSkill): string {
  const skillDir = path.join('.claude', 'skills', skill.name);
  if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });

  const skillPath = path.join(skillDir, 'SKILL.md');

  if (!skill.isNew && fs.existsSync(skillPath)) {
    const existing = fs.readFileSync(skillPath, 'utf-8');
    fs.writeFileSync(skillPath, existing.trimEnd() + '\n\n' + skill.content);
  } else {
    const frontmatter = [
      '---',
      `name: ${skill.name}`,
      `description: ${skill.description}`,
      '---',
      '',
    ].join('\n');
    fs.writeFileSync(skillPath, frontmatter + skill.content);
  }

  return skillPath;
}

export function readLearnedSection(): string | null {
  const claudeMdPath = 'CLAUDE.md';
  if (!fs.existsSync(claudeMdPath)) return null;

  const content = fs.readFileSync(claudeMdPath, 'utf-8');
  const startIdx = content.indexOf(LEARNED_START);
  const endIdx = content.indexOf(LEARNED_END);

  if (startIdx === -1 || endIdx === -1) return null;

  return content.slice(startIdx + LEARNED_START.length, endIdx).trim();
}

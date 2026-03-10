import fs from 'fs';
import path from 'path';

interface RefreshDocs {
  claudeMd?: string | null;
  readmeMd?: string | null;
  cursorrules?: string | null;
  cursorRules?: Array<{ filename: string; content: string }> | null;
  claudeSkills?: Array<{ filename: string; content: string }> | null;
}

export function writeRefreshDocs(docs: RefreshDocs): string[] {
  const written: string[] = [];

  if (docs.claudeMd) {
    fs.writeFileSync('CLAUDE.md', docs.claudeMd);
    written.push('CLAUDE.md');
  }

  if (docs.readmeMd) {
    fs.writeFileSync('README.md', docs.readmeMd);
    written.push('README.md');
  }

  if (docs.cursorrules) {
    fs.writeFileSync('.cursorrules', docs.cursorrules);
    written.push('.cursorrules');
  }

  if (docs.cursorRules) {
    const rulesDir = path.join('.cursor', 'rules');
    if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });
    for (const rule of docs.cursorRules) {
      const filePath = path.join(rulesDir, rule.filename);
      fs.writeFileSync(filePath, rule.content);
      written.push(filePath);
    }
  }

  if (docs.claudeSkills) {
    const skillsDir = path.join('.claude', 'skills');
    if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
    for (const skill of docs.claudeSkills) {
      const filePath = path.join(skillsDir, skill.filename);
      fs.writeFileSync(filePath, skill.content);
      written.push(filePath);
    }
  }

  return written;
}

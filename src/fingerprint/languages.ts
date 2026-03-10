import path from 'path';

const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.php': 'PHP',
  '.dart': 'Dart',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.scala': 'Scala',
  '.zig': 'Zig',
};

export function detectLanguages(fileTree: string[]): string[] {
  const langs = new Set<string>();

  for (const file of fileTree) {
    const ext = path.extname(file).toLowerCase();
    if (EXT_TO_LANG[ext]) {
      langs.add(EXT_TO_LANG[ext]);
    }
  }

  return [...langs];
}

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

interface PackageInfo {
  name?: string;
  frameworks: string[];
  languages: string[];
}

const NODE_FRAMEWORK_DEPS: Record<string, string> = {
  react: 'React',
  next: 'Next.js',
  vue: 'Vue',
  nuxt: 'Nuxt',
  svelte: 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  angular: 'Angular',
  '@angular/core': 'Angular',
  express: 'Express',
  fastify: 'Fastify',
  hono: 'Hono',
  nestjs: 'NestJS',
  '@nestjs/core': 'NestJS',
  tailwindcss: 'Tailwind CSS',
  prisma: 'Prisma',
  drizzle: 'Drizzle',
  'drizzle-orm': 'Drizzle',
  '@supabase/supabase-js': 'Supabase',
  mongoose: 'MongoDB',
  typeorm: 'TypeORM',
  sequelize: 'Sequelize',
  'better-auth': 'Better Auth',
};

const PYTHON_FRAMEWORK_DEPS: Record<string, string> = {
  fastapi: 'FastAPI',
  django: 'Django',
  flask: 'Flask',
  sqlalchemy: 'SQLAlchemy',
  pydantic: 'Pydantic',
  celery: 'Celery',
  pytest: 'pytest',
  uvicorn: 'Uvicorn',
  starlette: 'Starlette',
  httpx: 'HTTPX',
  alembic: 'Alembic',
  tortoise: 'Tortoise ORM',
  'google-cloud-pubsub': 'Google Pub/Sub',
  stripe: 'Stripe',
  redis: 'Redis',
};

const WORKSPACE_GLOBS = [
  'apps/*/package.json',
  'packages/*/package.json',
  'services/*/package.json',
  'libs/*/package.json',
];

function detectNodeFrameworks(pkgPath: string): string[] {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const frameworks: string[] = [];
    for (const [dep, framework] of Object.entries(NODE_FRAMEWORK_DEPS)) {
      if (allDeps[dep]) frameworks.push(framework);
    }
    return frameworks;
  } catch {
    return [];
  }
}

function detectPythonFrameworks(dir: string): string[] {
  const frameworks: string[] = [];
  const candidates = [
    path.join(dir, 'pyproject.toml'),
    path.join(dir, 'requirements.txt'),
    ...globSync('apps/*/pyproject.toml', { cwd: dir, absolute: true }),
    ...globSync('apps/*/requirements.txt', { cwd: dir, absolute: true }),
    ...globSync('services/*/pyproject.toml', { cwd: dir, absolute: true }),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
      for (const [dep, framework] of Object.entries(PYTHON_FRAMEWORK_DEPS)) {
        if (content.includes(dep)) frameworks.push(framework);
      }
    } catch {}
  }

  return frameworks;
}

export function analyzePackageJson(dir: string): PackageInfo {
  const rootPkgPath = path.join(dir, 'package.json');
  let name: string | undefined;
  const allFrameworks: string[] = [];
  const languages: string[] = [];

  if (fs.existsSync(rootPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
      name = pkg.name;
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      allFrameworks.push(...detectNodeFrameworks(rootPkgPath));

      if (allDeps.typescript || allDeps['@types/node']) {
        languages.push('TypeScript');
      }
      languages.push('JavaScript');
    } catch {}
  }

  for (const glob of WORKSPACE_GLOBS) {
    const matches = globSync(glob, { cwd: dir, absolute: true });
    for (const pkgPath of matches) {
      allFrameworks.push(...detectNodeFrameworks(pkgPath));
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.typescript || deps['@types/node']) {
          languages.push('TypeScript');
        }
      } catch {}
    }
  }

  allFrameworks.push(...detectPythonFrameworks(dir));

  return {
    name,
    frameworks: [...new Set(allFrameworks)],
    languages: [...new Set(languages)],
  };
}

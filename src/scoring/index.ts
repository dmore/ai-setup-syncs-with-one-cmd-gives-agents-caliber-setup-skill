import { checkExistence } from './checks/existence.js';
import { checkQuality } from './checks/quality.js';
import { checkCoverage } from './checks/coverage.js';
import { checkAccuracy } from './checks/accuracy.js';
import { checkFreshness } from './checks/freshness.js';
import { checkBonus } from './checks/bonus.js';
import { computeGrade, CATEGORY_MAX } from './constants.js';

export type CheckCategory = 'existence' | 'quality' | 'coverage' | 'accuracy' | 'freshness' | 'bonus';

export interface Check {
  readonly id: string;
  readonly name: string;
  readonly category: CheckCategory;
  readonly maxPoints: number;
  readonly earnedPoints: number;
  readonly passed: boolean;
  readonly detail: string;
  readonly suggestion?: string;
}

export interface CategorySummary {
  readonly earned: number;
  readonly max: number;
}

export interface ScoreResult {
  readonly score: number;
  readonly maxScore: number;
  readonly grade: string;
  readonly checks: readonly Check[];
  readonly categories: {
    readonly existence: CategorySummary;
    readonly quality: CategorySummary;
    readonly coverage: CategorySummary;
    readonly accuracy: CategorySummary;
    readonly freshness: CategorySummary;
    readonly bonus: CategorySummary;
  };
  readonly timestamp: string;
}

function sumCategory(checks: readonly Check[], category: CheckCategory): CategorySummary {
  const categoryChecks = checks.filter((c) => c.category === category);
  return {
    earned: categoryChecks.reduce((s, c) => s + c.earnedPoints, 0),
    max: CATEGORY_MAX[category],
  };
}

/**
 * Compute a fully deterministic local score for the agent config in `dir`.
 * No network calls, no LLM — pure filesystem checks.
 */
export function computeLocalScore(dir: string): ScoreResult {
  const checks: Check[] = [
    ...checkExistence(dir),
    ...checkQuality(dir),
    ...checkCoverage(dir),
    ...checkAccuracy(dir),
    ...checkFreshness(dir),
    ...checkBonus(dir),
  ];

  const score = Math.min(
    100,
    Math.max(0, checks.reduce((s, c) => s + c.earnedPoints, 0))
  );

  return {
    score,
    maxScore: 100,
    grade: computeGrade(score),
    checks,
    categories: {
      existence: sumCategory(checks, 'existence'),
      quality: sumCategory(checks, 'quality'),
      coverage: sumCategory(checks, 'coverage'),
      accuracy: sumCategory(checks, 'accuracy'),
      freshness: sumCategory(checks, 'freshness'),
      bonus: sumCategory(checks, 'bonus'),
    },
    timestamp: new Date().toISOString(),
  };
}

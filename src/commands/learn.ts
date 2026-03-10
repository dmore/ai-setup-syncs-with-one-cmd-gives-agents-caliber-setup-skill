import chalk from 'chalk';
import { readStdin } from '../learner/stdin.js';
import {
  appendEvent,
  readAllEvents,
  readState,
  writeState,
  clearSession,
  resetState,
  getEventCount,
} from '../learner/storage.js';
import type { ToolEvent } from '../learner/storage.js';
import { writeLearnedContent, readLearnedSection } from '../learner/writer.js';
import {
  areLearningHooksInstalled,
  installLearningHooks,
  removeLearningHooks,
} from '../lib/learning-hooks.js';
import { readExistingConfigs } from '../fingerprint/existing-config.js';
import { analyzeEvents } from '../ai/learn.js';
import { loadConfig } from '../llm/config.js';

export async function learnObserveCommand(options: { failure?: boolean }) {
  try {
    const raw = await readStdin();
    if (!raw.trim()) return;

    const hookData = JSON.parse(raw);

    const event: ToolEvent = {
      timestamp: new Date().toISOString(),
      session_id: hookData.session_id || 'unknown',
      hook_event_name: options.failure ? 'PostToolUseFailure' : 'PostToolUse',
      tool_name: hookData.tool_name || 'unknown',
      tool_input: hookData.tool_input || {},
      tool_response: hookData.tool_response || {},
      tool_use_id: hookData.tool_use_id || '',
      cwd: hookData.cwd || process.cwd(),
    };

    appendEvent(event);

    const state = readState();
    state.eventCount++;
    if (!state.sessionId) state.sessionId = event.session_id;
    writeState(state);
  } catch {
    // Hook observers must never crash or produce output
  }
}

export async function learnFinalizeCommand() {
  try {
    const config = loadConfig();
    if (!config) {
      clearSession();
      resetState();
      return;
    }

    const events = readAllEvents();
    if (!events.length) {
      clearSession();
      resetState();
      return;
    }

    const existingConfigs = readExistingConfigs(process.cwd());
    const existingLearnedSection = readLearnedSection();
    const existingSkills = existingConfigs.claudeSkills || [];

    const response = await analyzeEvents(
      events,
      existingConfigs.claudeMd || '',
      existingLearnedSection,
      existingSkills,
    );

    if (response.claudeMdLearnedSection || response.skills?.length) {
      writeLearnedContent({
        claudeMdLearnedSection: response.claudeMdLearnedSection,
        skills: response.skills,
      });
    }
  } catch {
    // Finalize should not fail visibly
  } finally {
    clearSession();
    resetState();
  }
}

export async function learnInstallCommand() {
  const result = installLearningHooks();
  if (result.alreadyInstalled) {
    console.log(chalk.dim('Learning hooks already installed.'));
    return;
  }
  console.log(chalk.green('✓') + ' Learning hooks installed in .claude/settings.json');
  console.log(chalk.dim('  PostToolUse, PostToolUseFailure, and SessionEnd hooks active.'));
  console.log(chalk.dim('  Session learnings will be written to CLAUDE.md and skills.'));
}

export async function learnRemoveCommand() {
  const result = removeLearningHooks();
  if (result.notFound) {
    console.log(chalk.dim('Learning hooks not found.'));
    return;
  }
  console.log(chalk.green('✓') + ' Learning hooks removed from .claude/settings.json');
}

export async function learnStatusCommand() {
  const installed = areLearningHooksInstalled();
  const state = readState();
  const eventCount = getEventCount();

  console.log(chalk.bold('Session Learning Status'));
  console.log();

  if (installed) {
    console.log(chalk.green('✓') + ' Learning hooks are ' + chalk.green('installed'));
  } else {
    console.log(chalk.dim('✗') + ' Learning hooks are ' + chalk.yellow('not installed'));
    console.log(chalk.dim('  Run `caliber learn install` to enable session learning.'));
  }

  console.log();
  console.log(`Events recorded: ${chalk.cyan(String(eventCount))}`);
  console.log(`Total this session: ${chalk.cyan(String(state.eventCount))}`);

  if (state.lastAnalysisTimestamp) {
    console.log(`Last analysis: ${chalk.cyan(state.lastAnalysisTimestamp)}`);
  } else {
    console.log(`Last analysis: ${chalk.dim('none')}`);
  }

  const learnedSection = readLearnedSection();
  if (learnedSection) {
    const lineCount = learnedSection.split('\n').filter(Boolean).length;
    console.log(`\nLearned items in CLAUDE.md: ${chalk.cyan(String(lineCount))}`);
  }
}

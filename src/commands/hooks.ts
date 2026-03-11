import chalk from 'chalk';
import { isHookInstalled, installHook, removeHook, isPreCommitHookInstalled, installPreCommitHook, removePreCommitHook } from '../lib/hooks.js';

export async function hooksInstallCommand() {
  const result = installHook();
  if (result.alreadyInstalled) {
    console.log(chalk.dim('Claude Code hook already installed.'));
    return;
  }
  console.log(chalk.green('✓') + ' SessionEnd hook installed in .claude/settings.json');
  console.log(chalk.dim('  Docs will auto-refresh when Claude Code sessions end.'));
}

export async function hooksRemoveCommand() {
  const result = removeHook();
  if (result.notFound) {
    console.log(chalk.dim('Claude Code hook not found.'));
    return;
  }
  console.log(chalk.green('✓') + ' SessionEnd hook removed from .claude/settings.json');
}

export async function hooksInstallPrecommitCommand() {
  const result = installPreCommitHook();
  if (result.alreadyInstalled) {
    console.log(chalk.dim('Pre-commit hook already installed.'));
    return;
  }
  if (!result.installed) {
    console.log(chalk.red('Failed to install pre-commit hook (not a git repository?).'));
    return;
  }
  console.log(chalk.green('✓') + ' Pre-commit hook installed in .git/hooks/pre-commit');
  console.log(chalk.dim('  Docs will auto-refresh before each commit via LLM.'));
}

export async function hooksRemovePrecommitCommand() {
  const result = removePreCommitHook();
  if (result.notFound) {
    console.log(chalk.dim('Pre-commit hook not found.'));
    return;
  }
  console.log(chalk.green('✓') + ' Pre-commit hook removed from .git/hooks/pre-commit');
}

export async function hooksStatusCommand() {
  const claudeInstalled = isHookInstalled();
  const precommitInstalled = isPreCommitHookInstalled();

  if (claudeInstalled) {
    console.log(chalk.green('✓') + ' Claude Code hook is ' + chalk.green('installed'));
  } else {
    console.log(chalk.dim('✗') + ' Claude Code hook is ' + chalk.yellow('not installed'));
  }

  if (precommitInstalled) {
    console.log(chalk.green('✓') + ' Pre-commit hook is ' + chalk.green('installed'));
  } else {
    console.log(chalk.dim('✗') + ' Pre-commit hook is ' + chalk.yellow('not installed'));
  }

  if (!claudeInstalled && !precommitInstalled) {
    console.log(chalk.dim('\n  Run `caliber hooks install` or `caliber hooks install-precommit` to enable auto-refresh.'));
  }
}

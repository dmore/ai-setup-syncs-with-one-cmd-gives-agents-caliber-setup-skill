import chalk from 'chalk';
import { isHookInstalled, installHook, removeHook } from '../lib/hooks.js';

export async function hooksInstallCommand() {
  const result = installHook();
  if (result.alreadyInstalled) {
    console.log(chalk.dim('Hook already installed.'));
    return;
  }
  console.log(chalk.green('✓') + ' SessionEnd hook installed in .claude/settings.json');
  console.log(chalk.dim('  Docs will auto-refresh when Claude Code sessions end.'));
}

export async function hooksRemoveCommand() {
  const result = removeHook();
  if (result.notFound) {
    console.log(chalk.dim('Hook not found.'));
    return;
  }
  console.log(chalk.green('✓') + ' SessionEnd hook removed from .claude/settings.json');
}

export async function hooksStatusCommand() {
  const installed = isHookInstalled();
  if (installed) {
    console.log(chalk.green('✓') + ' Auto-refresh hook is ' + chalk.green('installed'));
  } else {
    console.log(chalk.dim('✗') + ' Auto-refresh hook is ' + chalk.yellow('not installed'));
    console.log(chalk.dim('  Run `caliber hooks install` to enable auto-refresh on session end.'));
  }
}

import chalk from 'chalk';
import readline from 'readline';
import select from '@inquirer/select';
import { loadConfig, writeConfigFile, getConfigFilePath, DEFAULT_MODELS } from '../llm/config.js';
import type { ProviderType, LLMConfig } from '../llm/types.js';

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.cyan(`${question} `), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function configCommand() {
  const existing = loadConfig();

  if (existing) {
    console.log(chalk.bold('\nCurrent Configuration\n'));
    console.log(`  Provider: ${chalk.cyan(existing.provider)}`);
    console.log(`  Model:    ${chalk.cyan(existing.model)}`);
    if (existing.apiKey) {
      const masked = existing.apiKey.slice(0, 8) + '...' + existing.apiKey.slice(-4);
      console.log(`  API Key:  ${chalk.dim(masked)}`);
    }
    if (existing.baseUrl) {
      console.log(`  Base URL: ${chalk.dim(existing.baseUrl)}`);
    }
    if (existing.vertexProjectId) {
      console.log(`  Vertex Project: ${chalk.dim(existing.vertexProjectId)}`);
      console.log(`  Vertex Region:  ${chalk.dim(existing.vertexRegion || 'us-east5')}`);
    }
    console.log(`  Source:   ${chalk.dim(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.VERTEX_PROJECT_ID ? 'environment variables' : getConfigFilePath())}`);
    console.log('');
  }

  const provider = await select<ProviderType>({
    message: 'Select LLM provider',
    choices: [
      { name: 'Anthropic (Claude)', value: 'anthropic' },
      { name: 'Google Vertex AI (Claude)', value: 'vertex' },
      { name: 'OpenAI / OpenAI-compatible', value: 'openai' },
    ],
  });

  const config: LLMConfig = { provider, model: '' };

  switch (provider) {
    case 'anthropic': {
      config.apiKey = await promptInput('Anthropic API key:');
      if (!config.apiKey) {
        console.log(chalk.red('API key is required.'));
        throw new Error('__exit__');
      }
      config.model = await promptInput(`Model (default: ${DEFAULT_MODELS.anthropic}):`) || DEFAULT_MODELS.anthropic;
      break;
    }
    case 'vertex': {
      config.vertexProjectId = await promptInput('GCP Project ID:');
      if (!config.vertexProjectId) {
        console.log(chalk.red('Project ID is required.'));
        throw new Error('__exit__');
      }
      config.vertexRegion = await promptInput('Region (default: us-east5):') || 'us-east5';
      config.vertexCredentials = await promptInput('Service account credentials JSON (or leave empty for ADC):') || undefined;
      config.model = await promptInput(`Model (default: ${DEFAULT_MODELS.vertex}):`) || DEFAULT_MODELS.vertex;
      break;
    }
    case 'openai': {
      config.apiKey = await promptInput('API key:');
      if (!config.apiKey) {
        console.log(chalk.red('API key is required.'));
        throw new Error('__exit__');
      }
      config.baseUrl = await promptInput('Base URL (leave empty for OpenAI, or enter custom endpoint):') || undefined;
      config.model = await promptInput(`Model (default: ${DEFAULT_MODELS.openai}):`) || DEFAULT_MODELS.openai;
      break;
    }
  }

  writeConfigFile(config);

  console.log(chalk.green('\n✓ Configuration saved'));
  console.log(chalk.dim(`  ${getConfigFilePath()}\n`));
  console.log(chalk.dim('  You can also set environment variables instead:'));
  console.log(chalk.dim('  ANTHROPIC_API_KEY, OPENAI_API_KEY, or VERTEX_PROJECT_ID\n'));
}

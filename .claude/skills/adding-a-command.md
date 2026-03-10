# Adding a New CLI Command

Follow this checklist when adding a new command to `@caliber-ai/caliber`.

## 1. Create the command file

Create `src/commands/<name>.ts`. Export a single async function:

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../llm/config.js';

export async function myNewCommand(options: { dryRun?: boolean }) {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.red('No LLM provider configured. Run `caliber config` or set ANTHROPIC_API_KEY.'));
    throw new Error('__exit__');
  }

  const spinner = ora('Working...').start();
  try {
    // ... implementation
    spinner.succeed(chalk.green('Done!'));
  } catch (err) {
    spinner.fail(chalk.red('Something went wrong'));
    throw err;
  }
}
```

**Key conventions:**
- Import paths must use `.js` extension: `'../llm/config.js'`
- Check `loadConfig()` for commands that require an LLM provider
- Use `ora` for spinners on async operations
- Use `chalk` for coloured output (red = error, green = success, yellow = warning)
- Throw `new Error('__exit__')` for clean exits (no stack trace)

## 2. Register the command in cli.ts

Add the import and register call in `src/cli.ts`:

```typescript
import { myNewCommand } from './commands/my-new-command.js';

program
  .command('my-new-command')
  .description('What this command does')
  .option('--dry-run', 'Preview changes without writing')
  .action(myNewCommand);
```

## 3. Use the LLM layer (if needed)

```typescript
import { llmCall, llmJsonCall } from '../llm/index.js';

// Simple text response
const text = await llmCall({ system: 'You are...', prompt: 'Analyze...' });

// Parsed JSON response
const result = await llmJsonCall<MyType>({ system: '...', prompt: '...' });
```

## 4. Write a test

Create `src/commands/__tests__/my-new-command.test.ts`. The LLM provider is mocked in `src/test/setup.ts`.

## 5. Update README.md

Add a row to the Commands table in `README.md`.

## 6. Commit with conventional commits

```bash
git commit -m "feat: add my-new-command command"
```

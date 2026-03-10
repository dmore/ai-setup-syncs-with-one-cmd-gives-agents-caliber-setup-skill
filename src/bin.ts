import { program } from './cli.js';
import { checkForUpdates } from './utils/version-check.js';

if (process.env.CALIBER_LOCAL) {
  process.env.CALIBER_SKIP_UPDATE_CHECK = '1';
}

await checkForUpdates();

program.parseAsync()
  .catch((err) => {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    if (msg !== '__exit__') {
      console.error(msg);
    }
    process.exitCode = 1;
  })
  .finally(() => process.exit(Number(process.exitCode ?? 0)));

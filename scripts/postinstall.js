const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const purple = (s) => `\x1b[38;5;99m${s}\x1b[0m`;

console.log('');
console.log(bold(purple('  Caliber installed successfully!')));
console.log('');
console.log(`  Get started:`);
console.log('');
console.log(`    ${bold('caliber config')}   ${dim('Set up your LLM provider (Anthropic, OpenAI, Vertex)')}`);
console.log(`    ${bold('caliber init')}     ${dim('Analyze your project and generate agent configs')}`);
console.log('');
console.log(`  ${dim('Or set ANTHROPIC_API_KEY and run caliber init directly.')}`);
console.log('');

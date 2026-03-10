# CLAUDE.md — Caliber

## Overview

Caliber is an open-source CLI that analyzes coding projects and generates optimized AI agent configurations (CLAUDE.md, .cursorrules, skills). It supports multiple LLM providers — bring your own API key.

## Commands

```bash
npm run build        # Compile via tsup (outputs to dist/)
npm run dev          # Watch mode (tsup --watch)
npm run test         # Run test suite via vitest
npm run test -- --coverage  # Run tests with v8 coverage report
```

> **Note:** There is no standalone typecheck script. TypeScript checking happens implicitly during `npm run build`. To check types without emitting, run: `npx tsc --noEmit`.

## Architecture

### Entry Points
- `src/bin.ts` — CLI entry point: checks for updates and runs Commander
- `src/cli.ts` — Commander program: registers all commands and reads version from `package.json`

### LLM Layer (`src/llm/`)
Provider-agnostic LLM abstraction supporting Anthropic, Vertex AI, and OpenAI-compatible endpoints:
- `types.ts` — Provider interface, config types
- `config.ts` — Config resolution: env vars → `~/.caliber/config.json`
- `anthropic.ts` — Anthropic direct API via `@anthropic-ai/sdk`
- `vertex.ts` — Google Vertex AI via `@anthropic-ai/vertex-sdk`
- `openai-compat.ts` — OpenAI and compatible endpoints (Ollama, vLLM, etc.)
- `utils.ts` — JSON extraction (bracket-balancing parser), token estimation
- `index.ts` — Provider factory, retry logic, `llmCall()` / `llmJsonCall()` helpers

### AI Logic (`src/ai/`)
All AI operations with system prompts:
- `prompts.ts` — System prompts for generation, refinement, refresh, learning, fingerprinting
- `generate.ts` — Streaming setup generation with status line parsing
- `refine.ts` — Iterative setup refinement via conversation
- `refresh.ts` — Conservative doc updates from git diffs
- `learn.ts` — Session tool event analysis for learned instructions
- `detect.ts` — LLM-powered language/framework detection

### Commands (`src/commands/`)
| File | Command | Description |
|------|---------|-------------|
| `init.ts` | `caliber init` | Fingerprint project, generate config via LLM, write files |
| `regenerate.ts` | `caliber update` | Re-fingerprint and regenerate config |
| `status.ts` | `caliber status` | Show manifest state and LLM config |
| `undo.ts` | `caliber undo` | Restore backups and remove Caliber-managed files |
| `config.ts` | `caliber config` | Interactive LLM provider/key/model setup |
| `recommend.ts` | `caliber recommend` | Skill discovery from skills.sh |
| `score.ts` | `caliber score` | Deterministic local scoring (no LLM) |
| `refresh.ts` | `caliber refresh` | Post-commit hook: analyze diffs, update docs |
| `hooks.ts` | `caliber hooks install/remove/status` | Manage Claude Code hook entries |
| `learn.ts` | `caliber learn` | Session learning: observe, finalize, install, remove, status |

### Fingerprinting (`src/fingerprint/`)
Collects project context sent to the LLM during generation:
- `git.ts` — Git remote URL and repo detection
- `languages.ts` — Language detection from file extensions
- `package-json.ts` — Framework detection (Node + Python)
- `file-tree.ts` — Directory tree snapshot
- `existing-config.ts` — Reads pre-existing agent config files
- `code-analysis.ts` — File summaries, API routes, config files
- `index.ts` — Orchestrator, LLM enrichment for richer detection

### Writers (`src/writers/`)
Receive an `AgentSetup` object and write files to disk:
- `claude/index.ts` — Writes `CLAUDE.md` and `.claude/` skills
- `cursor/index.ts` — Writes `.cursorrules` and `.cursor/rules/*.mdc`
- `staging.ts` — In-memory staging before committing writes
- `manifest.ts` — Tracks written files in `.caliber/manifest.json`
- `backup.ts` — Timestamped backups in `.caliber/backups/`
- `refresh.ts` — Writes docs from refresh API response

### Other Modules
- `src/scanner/` — Scans local config files, computes hashes
- `src/learner/` — Session event storage and learned content writer
- `src/scoring/` — Deterministic config quality scoring (no LLM)
- `src/lib/hooks.ts` — Claude Code settings.json hook management
- `src/lib/learning-hooks.ts` — Learning hook lifecycle
- `src/lib/state.ts` — `.caliber/state.json` tracking
- `src/lib/git-diff.ts` — Git diff collection for refresh
- `src/utils/` — Editor detection, spinner messages, version checking
- `src/constants.ts` — Paths for `.caliber/` directory structure

## LLM Provider Configuration

Config is resolved in order:
1. **Environment variables** (highest priority):
   - `ANTHROPIC_API_KEY` → Anthropic provider (default model: `claude-sonnet-4-6`)
   - `VERTEX_PROJECT_ID` or `GCP_PROJECT_ID` → Vertex AI provider (default region: `us-east5`, supports ADC or `VERTEX_SA_CREDENTIALS` JSON / `GOOGLE_APPLICATION_CREDENTIALS` file path)
   - `OPENAI_API_KEY` → OpenAI provider (default model: `gpt-4.1`, + `OPENAI_BASE_URL` for custom endpoints)
   - `CALIBER_MODEL` → Override default model for any provider
2. **Config file**: `~/.caliber/config.json` (created by `caliber config`)

## Testing

- Framework: **Vitest** with `globals: true` and `environment: node`
- Setup file: `src/test/setup.ts` (mocks LLM provider)
- Tests live in `src/**/__tests__/*.test.ts`
- Run a single test: `npx vitest run src/scoring/__tests__/accuracy.test.ts`

## TypeScript Conventions

- Strict mode enabled
- ES module imports require `.js` extension
- Target: ES2022 / `moduleResolution: bundler`
- Prefer `unknown` over `any`

## Commit Convention

Uses **conventional commits** for automated semantic versioning.

| Prefix | Bump | Example |
|--------|------|---------|
| `feat:` | minor | `feat: add OpenAI provider support` |
| `fix:` | patch | `fix: handle missing config gracefully` |
| `feat!:` | major | `feat!: change config format` |

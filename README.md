# Caliber

Open-source CLI that analyzes your project and generates optimized configuration files for AI coding agents (Claude Code, Cursor). Bring your own LLM — supports Anthropic, OpenAI, Google Vertex AI, and any OpenAI-compatible endpoint.

## Installation

```bash
npm install -g @rely-ai/caliber
```

## Quick Start

```bash
# Option 1: Set your API key as an environment variable
export ANTHROPIC_API_KEY=sk-ant-...

# Option 2: Interactive setup
caliber config

# Analyze your project and generate agent configs
caliber init
```

## What It Does

Caliber scans your codebase — languages, frameworks, file structure, existing configs — and generates tailored configuration files:

- **CLAUDE.md** — Project context for Claude Code (commands, architecture, conventions)
- **.cursorrules** / **.cursor/rules/** — Rules for Cursor
- **Skills** — Reusable skill files following the [OpenSkills](https://agentskills.io) standard

If you already have these files, Caliber audits them against your actual codebase and suggests targeted improvements — keeping what works, fixing what's stale, adding what's missing.

## Commands

| Command | Description |
|---------|-------------|
| `caliber init` | Scan project and generate agent config |
| `caliber update` | Re-analyze and regenerate (alias: `regenerate`, `regen`) |
| `caliber config` | Configure LLM provider, API key, and model |
| `caliber refresh` | Update docs based on recent git changes |
| `caliber score` | Score your config quality (deterministic, no LLM). Supports `--agent claude\|cursor\|both` |
| `caliber recommend` | Discover skills from [skills.sh](https://skills.sh) |
| `caliber undo` | Revert all changes made by Caliber |
| `caliber status` | Show current setup status |
| `caliber hooks install` | Install Claude Code auto-refresh hook |
| `caliber hooks remove` | Remove Claude Code auto-refresh hook |
| `caliber hooks install-precommit` | Install git pre-commit hook for auto-refresh |
| `caliber hooks remove-precommit` | Remove git pre-commit hook |
| `caliber hooks status` | Show installed hooks |
| `caliber learn install` | Install session learning hooks |
| `caliber learn status` | Show learned insights from sessions |
| `caliber learn observe` | Manually feed a tool event for analysis |
| `caliber learn finalize` | Analyze captured events and extract patterns |
| `caliber learn remove` | Remove learning hooks |

## Supported LLM Providers

| Provider | Environment Variable | Notes |
|----------|---------------------|-------|
| **Anthropic** | `ANTHROPIC_API_KEY` | Recommended. Claude Sonnet 4.6 default. |
| **Google Vertex AI** | `VERTEX_PROJECT_ID` or `GCP_PROJECT_ID` | Uses Application Default Credentials (ADC) by default. Region defaults to `us-east5`. Set `VERTEX_REGION` to override, `VERTEX_SA_CREDENTIALS` for service account JSON. |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4.1 default. |
| **Custom endpoint** | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | Any OpenAI-compatible API (Ollama, vLLM, Together, etc.) |

Override the model with `CALIBER_MODEL=<model-name>` or via `caliber config`.

### Vertex AI Setup

```bash
# Minimal — uses gcloud ADC and defaults
export VERTEX_PROJECT_ID=my-gcp-project
caliber init

# With custom region
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_REGION=europe-west1
caliber init

# With service account credentials (inline JSON)
export VERTEX_PROJECT_ID=my-gcp-project
export VERTEX_SA_CREDENTIALS='{"type":"service_account",...}'
caliber init

# With service account credentials (file path via GOOGLE_APPLICATION_CREDENTIALS)
export VERTEX_PROJECT_ID=my-gcp-project
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
caliber init
```

## How It Works

1. **Scan** — Analyzes your code, dependencies, file structure, and existing agent configs
2. **Generate** — LLM creates config files tailored to your project
3. **Review** — You accept, refine via chat, or decline the proposed changes
4. **Apply** — Config files are written to your project with backups, and a before/after score is displayed

Caliber also auto-generates `AGENTS.md` and configures `.claude/settings.json` permissions during init.

### Scoring

Caliber includes a deterministic scoring system (no LLM needed) that evaluates your agent config across 6 categories: existence, quality, coverage, accuracy, freshness, and bonus. Scoring is target-aware — it only checks what's relevant to your chosen platform:

```bash
caliber score               # Auto-detect target from existing files
caliber score --agent claude  # Score for Claude Code only
caliber score --agent both    # Score for Claude Code + Cursor
```

During `caliber init`, a before/after score is displayed so you can see the improvement.

### Auto-refresh

During `caliber init`, you'll be prompted to choose how docs auto-refresh:

- **Claude Code hook** — refreshes docs when Claude Code sessions end
- **Git pre-commit hook** — refreshes docs before each commit
- **Both** — enables both hooks
- **Skip** — install later with `caliber hooks install` or `caliber hooks install-precommit`

```bash
caliber hooks install              # Install Claude Code hook
caliber hooks install-precommit    # Install git pre-commit hook
caliber hooks remove               # Remove Claude Code hook
caliber hooks remove-precommit     # Remove pre-commit hook
caliber hooks status               # Show installed hooks
```

### Session Learning

Caliber can observe your Claude Code sessions and extract reusable instructions:

```bash
caliber learn install    # Install learning hooks
caliber learn status     # Check what's been captured
```

## Requirements

- Node.js >= 20
- An API key for a supported LLM provider

## Contributing

```bash
git clone https://github.com/rely-ai-org/caliber.git
cd caliber
npm install
npm run dev      # Watch mode
npm run test     # Run tests
npm run build    # Compile
```

This project uses [conventional commits](https://www.conventionalcommits.org/) — `feat:` for features, `fix:` for bug fixes. See the [CLAUDE.md](./CLAUDE.md) for architecture details.

## License

MIT

# Git Workflow for caliber-cli

This project uses **conventional commits** for automated semantic versioning via CI. Follow this workflow precisely.

## Commit Message Format

```
<type>[(scope)]: <short description under 72 chars>
```

| Type | Version bump | When to use |
|------|-------------|-------------|
| `feat:` | minor | New user-facing feature |
| `fix:` | patch | Bug fix |
| `feat!:` / `BREAKING CHANGE` | major | Removes or changes existing API/behavior |
| `refactor:` | patch | Code restructure, no behavior change |
| `test:` | patch | Adding or fixing tests |
| `chore:` | patch | Deps, tooling, config |
| `docs:` | patch | Documentation only |
| `ci:` | patch | CI/CD changes |

Scope is optional and should reference the affected module: `feat(scanner): detect Cursor config`

## Staging and Committing

Always stage specific files — never use `git add -A` or `git add .` without reviewing what changed first:

```bash
git status                      # Review what changed
git diff src/commands/score.ts  # Inspect a file before staging
git add src/commands/score.ts src/scoring/index.ts
git commit -m "feat(scoring): add dependency coverage check"
```

Include a `Co-Authored-By` trailer when Claude assisted:

```
feat(scoring): add dependency coverage check

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Before Pushing

```bash
npm run build          # Ensure TypeScript compiles
npm run test           # Ensure all tests pass
git log origin/main..HEAD --oneline  # Verify commits look correct
git push -u origin <branch-name>
```

Never force-push to `main` without explicit user approval.

## Creating a Pull Request

Use the GitHub CLI:

```bash
gh pr create \
  --title "feat: <short description under 70 chars>" \
  --body "## Summary
- <bullet 1>
- <bullet 2>

## Test plan
- [ ] npm run test passes
- [ ] npm run build passes
- [ ] Manually tested caliber <command>"
```

PR title must follow the conventional commit format — the CI semver bump reads the **merge commit** message, which GitHub derives from the PR title by default.

## Checking What Will Be Published

To preview what version bump the next merge to `main` would trigger:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Look for `feat:` (minor bump) vs `fix:`/`chore:` (patch bump) vs `feat!:` (major bump).

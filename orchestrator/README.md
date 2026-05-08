# Local AI Orchestrator

Windows-friendly semi-automatic workflow for this repo.

It uses locally authenticated CLIs only:

- Claude Code CLI for planning and final review
- Codex CLI for implementation
- PowerShell for orchestration
- No API keys
- No Python orchestrator

## Quick Start

From the repository root:

```powershell
.\orchestrator\run.ps1 "Add a /contact page to web-b2c"
```

The script will:

1. Ask Claude Code to create or update `PLAN.md` when `PLAN.md` is missing or when `-Plan` is passed.
2. Ask Codex to read `PLAN.md` and execute the next implementation step.
3. Run detected verification commands when possible.
4. Save failures to `LAST_ERROR.txt`.
5. Retry Codex once with a focused fix prompt if execution or verification fails.
6. Append progress to `PROGRESS.md`.
7. Ask Claude Code to review remaining work and update `PLAN.md`, unless `-SkipReview` is passed.

## Common Commands

Use the existing plan and skip final review:

```powershell
.\orchestrator\run.ps1 "Improve mobile cart UX in web-b2c" -SkipReview
```

Run Claude/Codex in multiple review-execute rounds:

```powershell
.\orchestrator\run.ps1 "Improve mobile cart UX in web-b2c" -Plan -Loop -MaxRounds 3
```

Force Claude to refresh `PLAN.md` before Codex runs:

```powershell
.\orchestrator\run.ps1 "Add sitemap and robots.txt to web-b2c" -Plan
```

Check the workflow without calling Claude, Codex, or running real verification:

```powershell
.\orchestrator\run.ps1 "Dry run test" -SkipClaudePlan -SkipReview -DryRun
```

Skip verification:

```powershell
.\orchestrator\run.ps1 "Small docs update" -NoVerify
```

## CLI Commands

Defaults:

```text
Claude: claude -p
Codex:  codex exec -C <repo> -s workspace-write -
```

If your Claude Code command has a different name, pass it explicitly:

```powershell
.\orchestrator\run.ps1 "Update PLAN.md" -Plan -ClaudeCommand "claude-code"
```

Or set environment variables:

```powershell
$env:CLAUDE_COMMAND = "claude"
$env:CODEX_COMMAND = "codex"
```

If `codex` is not on PATH, the script tries to find `codex.exe` inside the VS Code ChatGPT extension automatically. You can also pass the full path:

```powershell
.\orchestrator\run.ps1 "Improve mobile cart UX in web-b2c" -Plan -Loop -MaxRounds 3 -CodexCommand "$env:USERPROFILE\.vscode\extensions\openai.chatgpt-...\bin\windows-x86_64\codex.exe"
```

## Verification Detection

The script inspects the goal and `PLAN.md`.

For this repo it usually runs:

```powershell
npm run lint --prefix web-b2c
npm run build --prefix web-b2c
```

or the matching `web-b2b` commands when the task is clearly B2B.

If no relevant command is found, it records that in `PROGRESS.md` and continues.

## Files

```text
PLAN.md                         Claude-managed plan
PROGRESS.md                     Append-only workflow progress
LAST_ERROR.txt                  Most recent failure summary
orchestrator/run.ps1            Main PowerShell orchestrator
orchestrator/logs/*.log         Stdout/stderr from each CLI or verification step
orchestrator/prompts/*.md       Editable prompt templates
```

## Notes

- This script assumes Claude Code CLI and Codex CLI are installed and authenticated locally.
- It does not set or require API keys.
- Default mode is intentionally simple: one execution pass, one focused retry, optional final review.
- `-Loop -MaxRounds N` repeats Codex execution, verification, and Claude review up to `N` rounds.
- If `claude` is not on PATH, either install/enable the CLI or pass `-ClaudeCommand`.

## Troubleshooting

If you see this:

```text
Claude Code CLI command 'claude' was not found.
```

Install Claude Code CLI globally, then log in once:

```powershell
npm install -g @anthropic-ai/claude-code
claude
```

Then rerun:

```powershell
.\orchestrator\run.ps1 "Improve mobile cart UX in web-b2c" -Plan -Loop -MaxRounds 3
```

If your CLI command is not named `claude`, pass the command name:

```powershell
.\orchestrator\run.ps1 "Improve mobile cart UX in web-b2c" -Plan -Loop -MaxRounds 3 -ClaudeCommand "claude-code"
```

If you see this:

```text
Codex CLI command 'codex' was not found.
```

Either open/update the VS Code ChatGPT extension so `codex.exe` exists, or pass the full path with `-CodexCommand`.

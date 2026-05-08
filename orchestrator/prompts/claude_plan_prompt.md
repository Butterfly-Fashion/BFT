You are Claude Code working in this local repository.

Goal:
{{GOAL}}

Repository root:
{{REPO_ROOT}}

Please inspect the repository structure and update `PLAN.md` with a concise, practical implementation plan.

Requirements:
- Do not use API keys or external API calls.
- Keep the plan step-by-step and implementation-oriented.
- Identify the next concrete task Codex should execute.
- Include likely files to edit.
- Include validation commands that fit this repo, such as `npm run lint --prefix web-b2c` or `npm run build --prefix web-b2c` when appropriate.
- Preserve useful existing PLAN.md context, but remove stale or completed instructions when they would confuse the next execution step.
- Keep the plan short enough to be actionable.

Output:
- Write the updated plan directly to `PLAN.md`.
- Do not implement code changes.

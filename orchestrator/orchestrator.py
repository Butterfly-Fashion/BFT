#!/usr/bin/env python3
"""
Claude <-> Codex Orchestration Loop
Claude plans + reviews; Codex executes code changes.

Usage:
    python orchestrator/orchestrator.py "your task description"
"""

import json
import os
import platform
import subprocess
import sys
import time
from pathlib import Path

import anthropic

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT   = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "config.json"
LOG_PATH    = SCRIPT_DIR / "run_log.jsonl"

# ── Config ─────────────────────────────────────────────────────────────────────
with open(CONFIG_PATH, encoding="utf-8") as _f:
    CFG = json.load(_f)

MODEL         = CFG.get("claude_model", "claude-sonnet-4-6")
MAX_ITER      = CFG.get("max_iterations", 10)
MAX_RETRIES   = CFG.get("max_retries_per_step", 2)
CODEX_TIMEOUT = CFG.get("codex_timeout_seconds", 300)
CODEX_CMD     = CFG.get("codex_cmd", ["npx", "--yes", "codex"])
CODEX_FLAGS   = CFG.get("codex_flags", ["--approval-mode", "full-auto"])

# ── Env check ──────────────────────────────────────────────────────────────────
def check_env() -> None:
    missing = [v for v in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY") if not os.getenv(v)]
    if missing:
        print("[error] Missing environment variables:")
        for v in missing:
            print(f"  $env:{v} = \"sk-...\"   (PowerShell)")
            print(f"  export {v}=sk-...        (bash)")
        sys.exit(1)

# ── JSON parsing ───────────────────────────────────────────────────────────────
def parse_json_from(text: str) -> dict:
    """Extract a JSON object from raw text or a markdown code fence."""
    text = text.strip()

    # Try verbatim first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fence
    if "```" in text:
        first = text.find("```")
        last  = text.rfind("```")
        if first != last:
            block = text[first + 3 : last]
            nl = block.find("\n")
            block = block[nl:].strip() if nl != -1 else block.strip()
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                pass

    # Last resort: slice between outermost braces
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end != -1:
        return json.loads(text[start : end + 1])

    raise ValueError(f"No JSON found in response:\n{text[:400]}")

# ── Claude ─────────────────────────────────────────────────────────────────────
_client: anthropic.Anthropic | None = None

def claude_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client

def ask_claude(system: str, user: str) -> str:
    resp = claude_client().messages.create(
        model=MODEL,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return resp.content[0].text  # type: ignore[index]

# ── Codex ──────────────────────────────────────────────────────────────────────
def run_codex(prompt: str) -> dict:
    """Invoke the Codex CLI and return {stdout, stderr, returncode}."""
    is_win = platform.system() == "Windows"

    if is_win:
        safe = prompt.replace('"', '\\"')
        cmd_str = " ".join(CODEX_CMD + CODEX_FLAGS) + ' "' + safe + '"'
        short = cmd_str[:100] + ("…" if len(cmd_str) > 100 else "")
        print(f"\n  [codex] {short}")
        try:
            result = subprocess.run(
                cmd_str,
                cwd=str(REPO_ROOT),
                capture_output=True,
                text=True,
                timeout=CODEX_TIMEOUT,
                shell=True,
            )
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": f"Timed out after {CODEX_TIMEOUT}s", "returncode": -1}
        except Exception as exc:
            return {"stdout": "", "stderr": str(exc), "returncode": -2}
    else:
        cmd = CODEX_CMD + CODEX_FLAGS + [prompt]
        print(f"\n  [codex] {' '.join(cmd[:4])} \"…\"")
        try:
            result = subprocess.run(
                cmd,
                cwd=str(REPO_ROOT),
                capture_output=True,
                text=True,
                timeout=CODEX_TIMEOUT,
            )
        except subprocess.TimeoutExpired:
            return {"stdout": "", "stderr": f"Timed out after {CODEX_TIMEOUT}s", "returncode": -1}
        except Exception as exc:
            return {"stdout": "", "stderr": str(exc), "returncode": -2}

    return {
        "stdout":     result.stdout,
        "stderr":     result.stderr,
        "returncode": result.returncode,
    }

# ── Logging ────────────────────────────────────────────────────────────────────
def log(entry: dict) -> None:
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

# ── System prompts ─────────────────────────────────────────────────────────────
PLAN_SYSTEM = """\
You are a senior engineer orchestrating code changes in a Next.js monorepo.

Repository layout:
  web-b2b/   B2B wholesale app  — Next.js 16, TypeScript, Tailwind CSS v4, Supabase, Stripe
  web-b2c/   B2C retail store   — Next.js 15, TypeScript, Tailwind CSS v4, Stripe
  server/    backend helpers
  supabase/  DB migrations

Break the user task into the fewest concrete steps possible. Each step must be:
- A single, self-contained file-level change Codex can execute in one pass
- Specific about which file(s) to touch
- Written as a clear, imperative instruction

Return ONLY valid JSON — no markdown fences, no prose outside the object:
{
  "steps": [
    {
      "id": 1,
      "description": "human-readable summary (≤ 80 chars)",
      "codex_prompt": "exact instruction for Codex",
      "expected_outcome": "what a successful run looks like"
    }
  ],
  "context_summary": "one-sentence codebase note for Codex"
}"""

REVIEW_SYSTEM = """\
You are a senior engineer reviewing whether a Codex (AI coding agent) step succeeded.

Return ONLY valid JSON — no markdown fences, no prose outside the object:
{
  "status": "ok" | "retry" | "abort",
  "done": true | false,
  "notes": "brief assessment (≤ 120 chars)",
  "retry_prompt": "revised Codex instruction if status=retry, else null"
}

Rules:
- "ok"    → step worked (exit 0, or output clearly shows the edit was made)
- "retry" → step failed but a clearer prompt might fix it
- "abort" → fundamentally broken; stop everything immediately
- done=true → the ENTIRE original task is fully complete after this step"""

# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    check_env()

    if len(sys.argv) < 2:
        print(__doc__)
        print('Example:\n  python orchestrator/orchestrator.py "Add a /contact page to web-b2c"')
        sys.exit(1)

    task = " ".join(sys.argv[1:])
    divider = "=" * 64
    print(f"\n{divider}")
    print(f"  Task  : {task}")
    print(f"  Model : {MODEL}  |  Max steps: {MAX_ITER}")
    print(divider)

    # ── 1. Plan ───────────────────────────────────────────────────────────────
    print("\n[claude] Planning…")
    plan_raw = ask_claude(PLAN_SYSTEM, f"Task: {task}")
    log({"event": "plan_raw", "task": task, "response": plan_raw})

    try:
        plan = parse_json_from(plan_raw)
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"[error] Claude returned invalid JSON during planning: {exc}")
        print(plan_raw[:600])
        sys.exit(1)

    steps = plan["steps"]
    print(f"[claude] {len(steps)} step(s) planned:")
    for s in steps:
        print(f"  {s['id']}. {s['description']}")
    log({"event": "plan", "task": task, "steps": steps})

    # ── 2. Execute loop ───────────────────────────────────────────────────────
    completed: list[dict] = []
    global_iter = 0
    review: dict = {}

    for step in steps:
        if global_iter >= MAX_ITER:
            print(f"\n[orchestrator] Max iterations ({MAX_ITER}) reached — stopping.")
            break

        global_iter += 1
        sid = step["id"]
        print(f"\n{'─' * 64}")
        print(f"[step {sid}/{len(steps)}] {step['description']}")

        codex_prompt = step["codex_prompt"]

        for attempt in range(MAX_RETRIES + 1):
            # Run Codex
            result = run_codex(codex_prompt)
            print(f"  [codex] exit={result['returncode']}")
            if result["stderr"].strip():
                print(f"  [codex] stderr: {result['stderr'][:300]}")

            log({
                "event":      "codex",
                "step":       sid,
                "attempt":    attempt,
                "prompt":     codex_prompt,
                "returncode": result["returncode"],
                "stdout":     result["stdout"][:4000],
                "stderr":     result["stderr"][:1000],
            })

            # Ask Claude to review
            review_user = (
                f"Original task: {task}\n\n"
                f"Step {sid}: {step['description']}\n"
                f"Expected: {step['expected_outcome']}\n\n"
                f"--- Codex stdout ---\n{result['stdout'][:2000]}\n"
                f"--- Codex stderr ---\n{result['stderr'][:500]}\n"
                f"Exit code: {result['returncode']}\n\n"
                f"Completed steps: {[c['description'] for c in completed]}\n"
                f"Remaining steps: {[s2['description'] for s2 in steps[sid:]]}"
            )

            print("  [claude] Reviewing…")
            review_raw = ask_claude(REVIEW_SYSTEM, review_user)
            log({"event": "review_raw", "step": sid, "attempt": attempt, "response": review_raw})

            try:
                review = parse_json_from(review_raw)
            except Exception:
                review = {"status": "ok", "done": False, "notes": "review parse failed — continuing", "retry_prompt": None}

            status = review.get("status", "ok")
            print(f"  [claude] status={status}  done={review.get('done', False)}")
            print(f"  [claude] {review.get('notes', '')}")
            log({"event": "review", "step": sid, "attempt": attempt, "review": review})

            if status == "abort":
                print(f"\n[orchestrator] ABORT — {review.get('notes')}")
                sys.exit(1)

            if status == "ok":
                break

            if attempt < MAX_RETRIES:
                revised = review.get("retry_prompt")
                if revised:
                    codex_prompt = revised
                print(f"  [orchestrator] Retry {attempt + 1}/{MAX_RETRIES}…")
                time.sleep(2)

        completed.append(step)

        if review.get("done"):
            print(f"\n[orchestrator] Task complete — done=true after step {sid}.")
            break

    # ── 3. Summary ────────────────────────────────────────────────────────────
    print(f"\n{divider}")
    print(f"  Finished. Completed {len(completed)}/{len(steps)} step(s).")
    print(f"  Log: {LOG_PATH}")
    print(divider + "\n")


if __name__ == "__main__":
    main()

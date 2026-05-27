# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
- The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Deployment

### 프로젝트 구조
| 사이트 | 폴더 | Vercel 프로젝트 | 도메인 | 계정 |
|---|---|---|---|---|
| B2C (쇼핑몰) | `web-b2c/` | `bft` | fifa2026.ca | butterfly-fashion |
| B2B (도매) | `web-b2b/` | `b2b` | (b2b subdomain) | butterfly-fashion |

### B2C 배포 (`web-b2c/` → fifa2026.ca)
```
# 반드시 repo 루트에서 실행
cd c:/Users/butte/codes/ecommerce-demo
vercel --prod --yes
```
- 루트의 `.vercel/project.json` → `bft` 프로젝트로 연결됨
- `web-b2c/` 안에서 실행하면 경로 오류 남

### B2B 배포 (`web-b2b/`)
```
# git push하면 Vercel GitHub 연동으로 자동 배포
git push origin master
```
- B2B는 CLI로 직접 배포 불가 (rootDirectory 설정 충돌)
- `web-b2b/.vercel/project.json` → `b2b` 프로젝트
- Vercel이 `web-b2b/` 폴더만 빌드하도록 설정돼 있음

### 배포 전 체크
```
# B2C 빌드 확인
cd web-b2c && npm run build

# B2B 빌드 확인
cd web-b2b && npm run build
```
- 빌드 실패하면 배포하지 말 것
- 환경변수는 `.env.local` (로컬) / Vercel 대시보드 (프로덕션) 별도 관리

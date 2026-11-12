# FinTechCo — Claude Code Demo Starter

A small but realistic **existing codebase** for a Claude Code demo: a digital-banking web app with an overview, accounts, searchable transactions and October 2026 Spending insights. It uses **synthetic data only**. The live task is the GitHub issue "Insights: choose a month", taken from requirement to production.

## What's here
| Path | Purpose |
|---|---|
| `data/*.json` | Synthetic accounts and ~40 transactions, Aug–Nov 2026, including a missing category, refunds and the Oct 31 / Nov 1 boundary |
| `src/ledger.ts`, `src/insights.ts` | Balances and monthly category net spend, in integer cents |
| `src/html.ts` | `html` tagged template that escapes every interpolated value |
| `src/router.ts`, `src/views/` | Hash routes and pure view functions |
| `tests/` | Vitest unit tests |
| `.claude/skills/feature-readiness/` | Team skill: acceptance criteria → evidence table → PR draft |
| `scripts/guard-hook.mjs` | `PreToolUse` hook that blocks unsafe code and secret-like strings at write time |
| `scripts/otel-collector.mjs` | Local OpenTelemetry receiver (`npm run telemetry`) writing readable events and metrics to `.claude/telemetry/` (gitignored) |
| `.github/workflows/` | `ci.yml` runs `npm run check` on PRs; `deploy.yml` deploys `main` to GitHub Pages |
| `docs/demo/brief.md` | On-screen level-set, agenda flowchart and recap |

## Run
```bash
npm install
npm run dev      # or `npm run demo` to pin "today" to 2026-11-11
npm run check    # lint + skill lint + tests + type-check + build (what CI runs)
```

## Demo runbook
| # | Step | Surface |
|---|---|---|
| 1 | Level-set from `docs/demo/brief.md` | VS Code Markdown preview |
| 2 | End state first: the finished feature from the `../fintechco-completed` worktree on port 5174 | Browser |
| 3 | Workspace: branch, `CLAUDE.md` (conventions) vs `.claude/settings.json` (enforced), `/model` | IDE |
| 4 | Explore in plan mode: trace how Insights gets its month. No edits | IDE |
| 5 | Clarify and plan from `gh issue view <n>`; approve a scoped plan | IDE |
| 6 | Implement on `demo/month-selector` with tests; walk through the diff | IDE |
| 7 | CLI handoff: pause the IDE agent, `pwd`, `git status --short`, `claude` | Integrated terminal |
| 8 | `/feature-readiness`, then `/code-review` | CLI |
| 9 | Validate: real `npm run check` output, the independent acceptance test, browser check | Terminal, browser |
| 10 | Push and open the PR (both prompt for approval); CI runs | CLI, GitHub |
| 11 | A human merges; `deploy.yml` deploys; Claude smoke-tests the live URL with the Playwright MCP | GitHub, browser |
| 12 | Evidence: `.claude/telemetry/events.jsonl` (commands, permission decisions, cost, cache) and `metrics.jsonl`; `/cost` | IDE, terminal |
| 13 | Recap and next steps from `docs/demo/brief.md` | IDE |

Fallback at any step: the prepared PR from `feature/month-selector-prepared` and its CI run, clearly labeled as prepared.

## Reset between rehearsals
1. If the rehearsal PR was merged, revert it on GitHub and merge the revert. That redeploys the previous build and is also the rollback demonstration.
2. Close any unmerged rehearsal PR: `gh pr close <n> --delete-branch`.
3. Run `./scripts/demo-reset.sh`. It refuses to run with uncommitted changes or if `main` differs from the `demo-starter` tag, deletes local `demo/*` branches, and refreshes the prepared worktree. It never touches remote branches.

## Guardrails
- **`.claude/settings.json`** (shared): lint, tests, build and check run without prompts. `git push` and `gh pr create` always ask. Editing `data/**`, merging PRs, force-pushing and reading `.env*` are denied. The guard hook runs before every Edit and Write.
- **Telemetry** is configured in managed settings (`/Library/Application Support/ClaudeCode/managed-settings.json`), not the repo. Claude Code ignores OTel exporter variables in project settings. Start `npm run telemetry` before the session; the session works normally without it. Path-level denials (such as reading `.env`) aren't emitted as events.
- **Personal `.claude/settings.local.json`** can widen these rules. Rehearse without broad allows like `gh api *`.
- **CI** runs `npm run check` on every PR. **Deploy** runs only on pushes to `main`, which happen after a merge.
- **Branch protection** is a GitHub setting. Check it with `gh api repos/<owner>/<repo>/branches/main/protection` before describing it.
- **Acceptance test:** keep the independent test outside this workspace, and copy it in only at the validation step.

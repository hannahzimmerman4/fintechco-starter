# FinTechCo — Claude Code Interview Starter

A small but realistic **existing codebase** for the demo: a digital-banking web app with an account overview, accounts list, and searchable transactions. It contains **only synthetic data**. Claude's live task is to add the Spending insights feature described in `CLAUDE.md` (the "Insights · coming soon" nav item).

## What's here
| Path | Purpose |
|---|---|
| `data/accounts.json`, `data/transactions.json` | Synthetic accounts (checking, savings, credit card) and ~40 transactions, Aug–Nov 2026, including a missing category, refunds, and Oct 31 / Nov 1 boundary dates |
| `src/ledger.ts` | Balances and net position, calculated in integer cents |
| `src/transactionSearch.ts` | Search and account filtering, newest first |
| `src/html.ts` | `html` tagged template that escapes every interpolated value |
| `src/router.ts`, `src/views/` | Hash routes (`#/overview`, `#/accounts`, `#/transactions?account=cc&q=grocer`) and pure view functions |
| `tests/` | Vitest unit tests for data integrity, ledger math, search, routing, escaping, and views |

## Requirements
Node.js 20+ (22 recommended), Git, VS Code, Claude Code CLI.

## Run
```bash
npm install
npm run dev
```
Open the localhost URL Vite prints. In another terminal:
```bash
npm run check   # tests + type-check + production build (what CI runs)
```

## Suggested Claude Code practice
In the repo root run `claude` and ask:
1. `Explore this repository, explain its architecture and tests. Do not edit yet.`
2. `Plan the Spending Insights feature described in CLAUDE.md. Include tests, edge cases, and files to change. Do not edit until I approve.`
3. `Implement the approved plan and run npm run check. Explain each action and show the diff.`
4. `/fintech-test-review` (project Skill; invoke after implementation).

For a clean reset, **commit the starter version first** (`git init`, `git add .`, `git commit -m 'starter'`). Preserve the completed branch separately, then reset only when you know your work is backed up.

## Important
- CI (`.github/workflows/ci.yml`) runs `npm run check` on every pull request and on pushes to `main`.
- Branch protection is a GitHub setting, not something this repository enforces. Check its current state in the repo's Settings → Branches before saying it is on.
- A Skill is provided; an MCP server is intentionally not bundled because credentials and connection methods depend on the user's environment. Add and test one suitable read-only MCP during rehearsal.
- The included tests establish starter integrity; the feature tests should be created by Claude during the demo. An independent acceptance-test fixture should be prepared and held outside Claude's accessible workspace if you need to demonstrate independent verification.

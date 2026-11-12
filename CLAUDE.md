# FinTechCo demo repository

Synthetic-data training app, not a real banking system. Do not add real PII, secrets, external transaction APIs, or production credentials.

Project: Vite + TypeScript, with Vitest. Commands: `npm install`, `npm run dev`, `npm run test`, `npm run build`.

Code conventions:
- Data lives in `data/*.json` (shared with non-TypeScript tooling) and is loaded by `src/accounts.ts` and `src/transactions.ts`.
- Build all markup with the `html` tagged template from `src/html.ts`; never interpolate data into a raw string assigned to `innerHTML`.
- Do money math in integer cents with `toCents` from `src/ledger.ts`; format with `formatUsd` / `formatDate` from `src/format.ts`.
- Use `categoryLabel` for the Uncategorized fallback. Views are pure functions in `src/views/` that return `SafeHtml`; add a route in `src/router.ts` and a nav entry in `src/views/layout.ts` for new pages.

Feature requests are GitHub issues; read them with `gh issue view <n>`. Never edit `data/*.json` (financial records). Preserve existing pages unless the issue says otherwise.

Skills:
- Repo-specific skills live in `.claude/skills/<name>/SKILL.md` and are committed; don't duplicate them in `~/.claude/skills/`.
- Every skill description must say when to use it ("Use when/before ..."); `npm run lint:skills` enforces this.
- Skill changes go through a PR like code.

Work in this order: inspect repo, propose plan, obtain user approval, implement on a `demo/*` or `feature/*` branch, run `npm run check`, inspect diff. Open PRs with `Closes #<n>` in the body. Never merge: `main` requires passing CI and a human review. Never claim a PR is protected or a deploy happened unless verified externally.

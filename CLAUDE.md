# FinTechCo demo repository

Synthetic-data training app, not a real banking system. Do not add real PII, secrets, external transaction APIs, or production credentials.

Project: Vite + TypeScript, with Vitest. Commands: `npm install`, `npm run dev`, `npm run test`, `npm run build`.

Code conventions:
- Data lives in `data/*.json` (shared with non-TypeScript tooling) and is loaded by `src/accounts.ts` and `src/transactions.ts`.
- Build all markup with the `html` tagged template from `src/html.ts`; never interpolate data into a raw string assigned to `innerHTML`.
- Do money math in integer cents with `toCents` from `src/ledger.ts`; format with `formatUsd` / `formatDate` from `src/format.ts`.
- Use `categoryLabel` for the Uncategorized fallback. Views are pure functions in `src/views/` that return `SafeHtml`; add a route in `src/router.ts` and a nav entry in `src/views/layout.ts` for new pages.

Developer feature request (not yet implemented): Add an October 2026 **Spending insights** view to show net spending totals by category, total monthly net spend, and transaction count. Use existing transaction data; handle missing categories as Uncategorized, negative amounts as refunds, and dates near month boundaries using literal YYYY-MM-DD month matching. Add unit tests. Preserve current overview page. Do not integrate payments or change financial records.

Work in this order: inspect repo, propose plan, obtain user approval, implement, run tests/build, inspect diff. Never claim a PR is protected or a deploy happened unless verified externally.

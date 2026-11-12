---
name: fintech-test-review
description: Review FinTechCo changes for money, date, and transaction-data correctness. Use before committing or opening a PR that touches src/ledger.ts, src/transactions.ts, src/accounts.ts, spending insights, src/views/, or money/date formatting.
---

When invoked, inspect the changes against the main branch (or the most recent commit if already on main). Review:
- Money math: all arithmetic in integer cents via `toCents` from `src/ledger.ts`; no float sums or ad-hoc rounding. Display only via `formatUsd`.
- Dates: group by the date portion of ISO YYYY-MM-DD; format via `formatDate`; no `new Date(...)` parsing that can roll over across timezones.
- Categories: missing or empty categories go through `categoryLabel` (Uncategorized fallback), never a hand-written fallback.
- Refunds: negative transactions subtract from category net spend; net-negative results display as credits; the policy is explicit in code or tests.
- Markup: views are pure functions returning `SafeHtml` built with the `html` template from `src/html.ts`; flag any data interpolated into raw `innerHTML` strings.
- Data: `data/*.json` is unchanged; data stays synthetic, with no real PII, secrets, or external transaction APIs.
- Tests: require unit tests for month boundaries, negative amounts/refunds, and missing categories.

Return findings by severity, with file references, and propose missing tests. Do not merge or deploy.

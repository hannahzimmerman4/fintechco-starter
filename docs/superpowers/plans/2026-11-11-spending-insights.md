# Spending Insights (October 2026) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `#/insights` page that shows October 2026 net spend per category, the monthly net total and the transaction count.

**Architecture:** A pure calculation module (`src/insights.ts`) sums whole cents per category for one `YYYY-MM` month. A pure view (`src/views/insights.ts`) renders the result with `html` and `pageHeader`. The router, nav and `main.ts` switch each gain one entry. Styling reuses the existing `.activity`, `.rows` and `.tx` classes, so no CSS changes.

**Tech Stack:** TypeScript (strict), Vite, Vitest.

**Spec:** GitHub issue #4, "Spending insights: October 2026" (`gh issue view 4`). Repo conventions are in `CLAUDE.md`.

## Global Constraints
- Branch: `demo/spending-insights`, based on `main` after PR #3 merges (until then, `chore/demo-setup`). If the tooling plan merged first, `npm run check` includes `npm run lint`.
- Never edit `data/*.json`. Don't use or merge `rehearsal/insights-reference`.
- Month matching: compare the literal `YYYY-MM` prefix of the date string. No `Date` parsing.
- Money: convert each amount with `toCents` (`src/ledger.ts`) and sum integers. Display with `formatUsd(cents / 100)` (`src/format.ts`).
- Category label: `categoryLabel` (`src/transactions.ts`). Missing or blank becomes `Uncategorized`.
- Negative amounts are refunds: they reduce the category net and the total, and still count toward `count`.
- Build all markup with `html`. Never interpolate into a raw `innerHTML` string.
- Out of scope: month picker, other months, payments or external APIs.
- PR body contains `Closes #4`. Never merge.

## Review Focus
- **Prefix false match:** `date.startsWith('2026-1')` would match October, November and December. Compare `t.date.slice(0, 7) === month` exactly. Covered by the test `matches the whole month, not a shorter prefix`.
- **Tied category totals:** in the real October data, Transport and Health are both 4900 cents. The issue only says "descending", so break ties by category name, A→Z, to keep the order deterministic. Covered by the test `breaks ties by category name`.
- **Category netting to zero or below:** a category with only refunds, or refunds equal to spending, still appears with its net (0 or negative) and isn't dropped. Covered by the test `keeps categories whose refunds cancel or exceed spending`.
- **Whitespace-only category:** `"  "` groups with missing categories under `Uncategorized`. Covered by the test `groups missing and blank categories as Uncategorized`.
- **Month with no transactions:** the view shows an empty-state message, not an empty table or `$0.00` rows. Covered by the test `shows an empty state when the month has no transactions`.

---

### Task 1: `spendingInsights` calculation

**Files:**
- Create: `src/insights.ts`
- Test: `tests/insights.test.ts`

**Interfaces:**
- Consumes: `Transaction` and `categoryLabel` from `src/transactions.ts`; `toCents` from `src/ledger.ts`.
- Produces:
```ts
export interface CategorySpend { category: string; netCents: number }
export interface SpendingInsights { categories: CategorySpend[]; totalCents: number; count: number }
export function spendingInsights(txs: readonly Transaction[], month: string /* 'YYYY-MM' */): SpendingInsights
```

- [ ] **Step 1: Write the failing tests** in `tests/insights.test.ts`, using a local `tx(date, amount, category?)` fixture builder like the one in `tests/ledger.test.ts`:
  - `includes Oct 1 and Oct 31 and excludes Sep 30 and Nov 1`: with fixtures on 2026-09-30, 2026-10-01, 2026-10-31 and 2026-11-01 at 10.00 each, `count` is `2` and `totalCents` is `2000`.
  - `matches the whole month, not a shorter prefix`: `spendingInsights(fixtures, '2026-1')` returns `count` `0`.
  - `subtracts refunds from the category and the total but counts them`: Dining 28.90 and −5.00 give `{ category: 'Dining', netCents: 2390 }`, `totalCents` `2390` and `count` `2`.
  - `keeps categories whose refunds cancel or exceed spending`: Travel 50.00 and −50.00 give `netCents` `0`; Books −12.00 alone gives `netCents` `-1200`; both are present.
  - `groups missing and blank categories as Uncategorized`: `category` undefined, `''` and `'  '` all land in one `Uncategorized` entry.
  - `sorts by net descending and breaks ties by category name`: Health 49.00, Transport 49.00 and Housing 1850.00 give the order `Housing`, `Health`, `Transport`.
  - `does not mutate its input`: `Object.freeze` the array and each item, and the call doesn't throw. The input is deep-equal to a copy taken beforehand.
  - `summarizes the October 2026 data`: with the real `transactions`, `spendingInsights(transactions, '2026-10')` gives `count` `13`, `totalCents` `233948` and `categories` equal to:
    ```ts
    [
      { category: 'Housing', netCents: 185000 },
      { category: 'Groceries', netCents: 17259 },
      { category: 'Utilities', netCents: 16280 },
      { category: 'Health', netCents: 4900 },
      { category: 'Transport', netCents: 4900 },
      { category: 'Dining', netCents: 2390 },
      { category: 'Uncategorized', netCents: 1620 },
      { category: 'Subscriptions', netCents: 1599 },
    ]
    ```

- [ ] **Step 2: Run the tests and confirm they fail**
Run: `npx vitest run tests/insights.test.ts`
Expected: FAIL, because it can't resolve `../src/insights`.

- [ ] **Step 3: Implement `spendingInsights` in `src/insights.ts`**
Filter with `t.date.slice(0, 7) === month`. Accumulate cents in a `Map<string, number>` keyed by `categoryLabel(t)`. Sort with `b.netCents - a.netCents || a.category.localeCompare(b.category)`. Add a one-line doc comment that states the refund and month rules.

- [ ] **Step 4: Run the tests and confirm they pass**
Run: `npx vitest run tests/insights.test.ts`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/insights.ts tests/insights.test.ts
git commit -m "feat: add spendingInsights monthly category net spend calculation"
```

### Task 2: Insights view, route and nav

**Files:**
- Create: `src/views/insights.ts`
- Modify: `src/router.ts` (add `'insights'` to `RouteName` and `ROUTES`)
- Modify: `src/views/layout.ts` (add `{ name: 'insights', label: 'Insights' }` to `NAV`; delete the `Insights · coming soon` `<span>`)
- Modify: `src/main.ts` (`case 'insights': return renderInsights(transactions);`)
- Test: `tests/views.test.ts`, `tests/router.test.ts`

**Interfaces:**
- Consumes: `spendingInsights` and `SpendingInsights` from Task 1; `pageHeader` from `src/views/components.ts`; `formatUsd` and `pluralize` from `src/format.ts`.
- Produces: `export const INSIGHTS_MONTH = '2026-10'` and `export function renderInsights(txs: readonly Transaction[]): SafeHtml`.

Page copy (exact):
- `pageHeader('Spending insights', 'Net spend by category for October 2026. Refunds reduce their category.', pluralize(count, 'transaction'))`
- Total row label: `Total net spend`
- Empty state: `<p class="empty">No transactions in October 2026.</p>`
- Each category is a `<div class="tx">` with `<strong>` holding the category and `<b>` holding `formatUsd(netCents / 100)`.

- [ ] **Step 1: Write and update the failing tests**
  - `tests/router.test.ts`, new test `reads the insights route`: `parseRoute('#/insights').name` is `'insights'`.
  - `tests/views.test.ts`, update `renderShell`: rename it to `marks only the active route and links Insights`. Replace `toContain('Insights · coming soon')` with `toContain('<a class="navitem" href="#/insights">Insights</a>')` and `not.toContain('coming soon')`.
  - `tests/views.test.ts`, new `describe('renderInsights')`:
    - `shows October totals by category`: the output contains `Spending insights`, `13 transactions`, `$2,339.48`, `Uncategorized` and `$1,850.00`. `Housing` appears before `Subscriptions`.
    - `escapes category names`: rendering `[{ ...evil, date: '2026-10-05' }]` doesn't contain `<b>c</b>` but does contain `&lt;b&gt;c&lt;/b&gt;`.
    - `shows an empty state when the month has no transactions`: `renderInsights([])` contains `No transactions in October 2026.` and doesn't contain `Total net spend`.

- [ ] **Step 2: Run the tests and confirm they fail**
Run: `npm run test`
Expected: the new and updated tests fail; the other tests pass.

- [ ] **Step 3: Implement** `renderInsights` in `src/views/insights.ts`, plus the router, layout and `main.ts` edits listed above.

- [ ] **Step 4: Verify**
Run: `npm run check`
Expected: all tests pass (44 existing + 8 + 4 = 56), type-check passes and the build succeeds. Lint also passes if the tooling plan has merged.
Run: `npm run dev`, open `#/insights` and confirm the page renders, the nav item is active and the other three pages are unchanged.

- [ ] **Step 5: Commit**
```bash
git add src/views/insights.ts src/router.ts src/views/layout.ts src/main.ts tests/views.test.ts tests/router.test.ts
git commit -m "feat: add Spending insights page for October 2026"
```

### Task 3: Review and open the PR

- [ ] **Step 1: Run `/fintech-test-review`** and fix every finding it marks high severity. Commit the fixes.

- [ ] **Step 2: Inspect the diff**
Run: `git diff main...HEAD --stat`
Expected: only the files in Tasks 1–2, and nothing under `data/`.

- [ ] **Step 3: Push and open the PR** (both commands ask for permission)
```bash
git push -u origin demo/spending-insights
gh pr create --title "Add October 2026 Spending insights page" --body-file - <<'EOF'
## Summary
- `src/insights.ts`: `spendingInsights(txs, 'YYYY-MM')`, which sums integer cents per category, nets refunds, matches the exact YYYY-MM prefix and sorts by net descending (ties by name)
- `#/insights` route, nav link (replaces the "coming soon" stub) and a pure `SafeHtml` view

## Tests
Month boundaries (Sep 30 / Oct 1 / Oct 31 / Nov 1), shorter-prefix rejection, refunds, Uncategorized fallback, tie ordering, immutability, real October totals ($2,339.48 across 13 transactions), escaping and empty state.

Closes #4

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

- [ ] **Step 4: Confirm CI**
Run: `gh pr checks --watch`
Expected: `checks` passes. Report the actual result, and don't merge.

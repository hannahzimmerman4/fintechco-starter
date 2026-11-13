# Plan: Insights, choose a month (#13)

Issue: #13 (system of record). Inputs: `docs/changes/13-month-selector/intent.md`, `spec.md`. On approval this becomes `docs/changes/13-month-selector/plan.md` on branch `feature/13-month-selector`, committed before any code.

## Context
Insights is hard-coded to October 2026 (`INSIGHTS_MONTH` in `src/views/insights.ts`, plus literal "October" strings). Customers want to pick any month that has data via `#/insights?month=YYYY-MM`. The `month` value comes from the URL, so it's untrusted. October stays the default and must render exactly as it does today.

Data months (read-only check): 2026-08 (11), 2026-09 (11), 2026-10 (13), 2026-11 (7). There are transactions on 09-30 and 10-01 for the boundary test.

## Changes

### 1. `src/insights.ts` (pure month logic)
- `DEFAULT_MONTH = '2026-10'` (moved from the view's `INSIGHTS_MONTH`).
- `availableMonths(txs): string[]`: unique `t.date.slice(0, 7)` values that match `/^\d{4}-(0[1-9]|1[0-2])$/`, sorted oldest first (string sort works for `YYYY-MM`).
- `resolveMonth(raw: string | null, available: readonly string[]): { month: string; unavailable: boolean }`
  - `null` → `{ DEFAULT_MONTH, unavailable: false }`
  - an exact string match in `available` → `{ raw, false }`. This is the allowlist, so there's no regex or `Date` parsing on the untrusted value.
  - anything else (`''`, `abc`, `2026-13`, `2026-1`, `2026-10-01`, `2025-01` with no data, markup) → `{ DEFAULT_MONTH, unavailable: true }`

### 2. `src/format.ts` (display only)
- `formatMonthName('2026-10')` → `'October'` and `formatMonthYear('2026-10')` → `'October 2026'`. These use UTC `Intl` like `formatMonth` does, and only for display, never for matching.

### 3. `src/views/insights.ts`
- Signature per spec: `renderInsights(accounts, txs, today, month: string | null = null)`.
- At the top: `const { month: m, unavailable } = resolveMonth(month, availableMonths(txs))`. Use `m` everywhere `INSIGHTS_MONTH` is used today: `spendingInsights`, `previousMonths`, the list filter.
- Replace the hard-coded strings with values built from `m`: the header subtitle, the empty state, the total stat line (`formatMonthYear`) and the "<Month> transactions" heading (`formatMonthName`, which keeps today's "October transactions").
- `monthSelector(available, m)`: `<nav class="month-selector" aria-label="Choose a month">` with one link per month, built by `routeHref('insights', { month: x === DEFAULT_MONTH ? undefined : x })`. October links to bare `#/insights`, which clears the selection. The current month gets `aria-current="page"` and an `active` class. Render it only when there are months to list.
- Notice when `unavailable`: `<p class="notice" role="status">That month isn't available. Showing October 2026.</p>`. It never echoes the raw value.
- Keep `renderInsights` pure; build all markup with `html`.

### 4. `src/main.ts`
- `renderInsights(accounts, transactions, today, route.params.get('month'))`. Changing months fires the existing `hashchange` → `render()` → `bindCategoryFilter` rebinds on the new DOM. There are no new listeners and no `innerHTML` beyond the existing `SafeHtml.value`.

### 5. `src/interactions.ts`
- Comment only: "filters the selected month's list". No logic change.

### 6. `src/style.css`
- Styles for `.month-selector` (horizontal pill links, wrapping at phone width) and `.notice`.

### Not changing
`src/router.ts` (params already exposed), the other views, `data/*.json`.

## Tests

### `tests/insights.test.ts`
- `availableMonths`: unique months, oldest first, from the fixtures and from real data (`['2026-08','2026-09','2026-10','2026-11']`).
- `resolveMonth`:
  - valid: `'2026-09'` → `{ '2026-09', false }`
  - omitted: `null` → `{ '2026-10', false }`
  - explicit default: `'2026-10'` → `{ '2026-10', false }`
  - unsupported, each → `{ '2026-10', true }`: `''`, `'abc'`, `'2026-13'`, `'2026-00'`, `'2026-1'`, `'2026-10-01'`, `' 2026-09'`, `'2025-01'` (no data), `'<img src=x onerror=alert(1)>'`
- Boundary: `spendingInsights(txs, '2026-09')` includes 09-30 and excludes 10-01. `'2026-10'` does the reverse.

### `tests/views.test.ts`: new `describe('renderInsights month selection')`
- `renderInsights(a, t, TODAY).value === renderInsights(a, t, TODAY, '2026-10').value`, and it still contains `$2,339.48` and `13 transactions`.
- All existing October assertions are unchanged and still pass (regression).
- `?month=2026-09` shows "September 2026", "September transactions", and the Jul–Aug avg label. It excludes the Oct 1 row and contains the Sep 30 row (via `data-tx`).
- The selector lists 4 links oldest first. October's href is `#/insights`, others are `#/insights?month=YYYY-MM`. Only the current one has `aria-current="page"`.
- Unsupported values (loop over the same list as above) render October figures plus the notice. No blank page.
- Hostile value: the output doesn't contain `<img` / `onerror` and doesn't echo the raw value.
- No notice for `null` or a valid month.
- The earliest month (`2026-08`) renders "No net spend in Jun–Jul" without crashing.

### `tests/format.test.ts`
- `formatMonthName('2026-10')` → `'October'`, `formatMonthYear('2026-01')` → `'January 2026'`.

## Verification
1. `npm run check` (lint, skill lint, tests, type-check, build).
2. `git diff main -- data/` is empty, and the diff touches only the files above.
3. Optional manual run (`npm run dev`): visit `#/insights`, `?month=2026-09`, `?month=2026-13`, and use the category filter after switching months. Browser automation runs only if you ask for it.
4. Run `feature-readiness` and open a PR with `Closes #13`. A human merges after CI and CodeQL.

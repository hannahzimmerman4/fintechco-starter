# Plan: Insights month selector (#13)

## Context
Insights is hardcoded to October 2026 (`INSIGHTS_MONTH` in `src/views/insights.ts`), with "October" also typed into four labels. Issue #13 (+ `docs/changes/13-month-selector/{intent,spec}.md`) asks for `#/insights?month=YYYY-MM`, a selector of months that have data, the whole page following the month, October as the unchanged default, and a visible notice + October fallback for any unsupported value. Data months today: 2026-08, -09, -10, -11.

## Branch & artifacts
- Branch `feature/13-month-selector` from `main`.
- First commit: this plan as `docs/changes/13-month-selector/plan.md` (before any code).

## Changes

**`src/insights.ts`** (pure, no `Date` for matching)
- `MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/`.
- `availableMonths(txs)`: unique `t.date.slice(0, 7)` matching the pattern, sorted ascending (string sort = chronological).
- `resolveMonth(raw: string | null, available, fallback)` → `{ month, unavailable }`:
  - `null` → `{ fallback, unavailable: false }`.
  - Matches pattern **and** is in `available` → `{ raw, false }`.
  - Everything else (`''`, `2026-13`, `2026-1`, `2026-10x`, `2026-07`, hostile strings) → `{ fallback, true }`.

**`src/format.ts`**: add `formatMonthYear('2026-10') → 'October 2026'` (UTC `Intl`, same approach as `formatMonth`; display only).

**`src/views/insights.ts`**
- Keep `INSIGHTS_MONTH = '2026-10'` as the default. `renderInsights(accounts, txs, today, requestedMonth: string | null = null)` resolves the month, then replaces every `INSIGHTS_MONTH` / "October" reference with the resolved month (`formatMonthYear`, short `formatMonth` for "Sep transactions"). History becomes `previousMonths(month, HISTORY_MONTHS)`.
- Month selector: a `<nav aria-label="Choose month">` with one link per available month (oldest first) via `routeHref('insights', { month: m === INSIGHTS_MONTH ? undefined : m })`, so October links to the bare `#/insights` (clears the selection). The current month gets `aria-current="page"`. Plain links: no JS, works through the existing `hashchange` → `render()`.
- Notice when `unavailable`: `<p class="notice" role="status">That month isn't available. Showing October 2026.</p>`. It doesn't echo the raw value, so nothing attacker-controlled reaches markup.
- Empty-state behavior unchanged when no param and October has no data.

**`src/main.ts`**: pass `route.params.get('month')` to `renderInsights`.

**`src/interactions.ts`**: fix the "October list" comment only. Category filter rebinds on each render already.

**`src/style.css`**: small styles for `.month-picker` links (reuse pill look; active = `aria-current`) and `.notice`.

Not touched: `src/router.ts` (already exposes `params`), other views, `data/*.json`.

## Tests
- `tests/insights.test.ts`: `availableMonths` on real data → `['2026-08','2026-09','2026-10','2026-11']`. `resolveMonth` covers valid, `null`, `''`, `abc`, `2026-13`, `2026-00`, `2026-1`, `2026-10x`, a well-formed month with no data, and `<img src=x onerror=alert(1)>`. Sep 30 / Oct 1 boundary for `2026-09` and `2026-10`. The existing boundary test stays.
- `tests/format.test.ts`: `formatMonthYear`.
- `tests/views.test.ts`:
  - `renderInsights(..., null)` is identical to `renderInsights(..., '2026-10')` and still shows `$2,339.48` and 13 transactions.
  - `'2026-09'` shows the September total/count, "September 2026", "Jul–Aug avg", and no October rows.
  - Each unsupported kind shows the notice + October figures.
  - A hostile value isn't present raw.
  - The selector lists 4 months oldest first, and only the current one has `aria-current`. The October link is `#/insights`.
- Existing tests are unchanged and must still pass.

## Verification
1. `npm run check` (lint, skill lint, tests, type-check, build).
2. `npm run dev`, then smoke-test in the browser: `#/insights`, `?month=2026-09`, `?month=2026-13`, `?month=<script>`. Click through the selector, then confirm the category filter still works after switching months and that Overview/Accounts/Transactions look unchanged.
3. Inspect `git diff main...` against this plan, run `feature-readiness`, open a PR with `Closes #13`. Don't merge.

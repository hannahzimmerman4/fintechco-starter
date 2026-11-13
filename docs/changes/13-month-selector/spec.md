# Spec: choose a month on Spending insights
Issue: #13. From: intent.md. Policies applied: CLAUDE.md security and money rules, `feature-readiness` domain rules. Status: approved by product owner.

## Behavior
- Route: `#/insights?month=YYYY-MM`, read through `parseRoute` params (`src/router.ts`).
- A selector lists every month that has transactions, oldest first, and marks the current one.
- The whole page follows the month: total, categories, spend bar, historical averages, transaction list, headings.
- No `month` param: October 2026, identical to `?month=2026-10`.
- Choosing October, or removing the param, clears the selection.

## Rules
- Match months on the literal `YYYY-MM` prefix. No `Date` parsing for matching.
- Money in integer cents (`toCents`), shown via `formatUsd` / `money`.
- Markup only through `html`. Views stay pure and return `SafeHtml`.

## Flagged concerns (resolved)
| # | Concern | Policy | Decision |
|---|---|---|---|
| 1 | `month` is attacker-controlled (URL) | Security: untrusted input, validate and fall back visibly | Allowlist = months that have data. Anything else shows October plus a visible "isn't available" notice. Escaped via `html`; tested with a hostile value |
| 2 | Partial values like `2026-1` could prefix-match Oct–Dec | Dates: literal `YYYY-MM` | Exact 7-character match only; covered by tests |
| 3 | Empty month: blank page vs. notice | UX: never blank or broken | Treat it as unsupported (notice + October) |
| 4 | Sep 30 / Oct 1 boundary | Dates | Unit test on both sides |

## Out of scope
Persisting the selection, comparing two months side by side, any change to `data/*.json`.

## Acceptance
As in issue #13. The independent acceptance test is held outside the repo and run at validation.

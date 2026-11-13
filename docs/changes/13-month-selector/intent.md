# Intent: choose a month on Spending insights
Issue: #13 (system of record). Author: product owner, Customer Insights (synthetic). Status: accepted.

## Problem
The Insights page only shows October 2026. Customers can't look back at an earlier month to see where their money went, so they can't compare months.

## Proposed outcome
Customers pick any month that has transactions. The whole Insights page follows that month. Today's October view stays the default and doesn't change.

## Affected users and systems
Customers using the web app. Insights page (`src/views/insights.ts`, `src/insights.ts`), router params (`src/router.ts`).

## Constraints
- Synthetic data only; `data/*.json` doesn't change.
- The month comes from the URL, so it's untrusted input.
- Overview, Accounts and Transactions behave as they do today.

## Open questions
- What should a customer see for a month with no data? → answered in spec.md
- Should the selected month persist across visits? → out of scope for now

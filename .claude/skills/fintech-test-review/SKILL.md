---
name: fintech-test-review
description: Review FinTechCo transaction feature changes for correctness, tests, and financial-data edge cases.
---

When invoked, inspect the changes against the main branch or most recent commit. Review:
- Currency handling: no rounding error; show values to two decimals; discuss cents representation for production.
- Date grouping: use the date portion of ISO YYYY-MM-DD and avoid accidental timezone rollover.
- Uncategorized values: fallback to `Uncategorized`.
- Refunds: negative transactions subtract from category net spend; make the policy explicit.
- Tests: require unit tests for month boundaries, negative amounts, and missing categories.
- Privacy: the data must remain synthetic; never add real customer identifiers or secrets.
Return findings by severity, with file references, and propose tests. Do not merge or deploy.

---
name: feature-readiness
description: Check a FinTechCo change against its issue's acceptance criteria and prepare the PR description. Use before committing or opening a PR, or when asked whether a change is ready to ship.
---

Goal: show, with evidence, whether the change on this branch meets its acceptance criteria. Make missing evidence visible. CI and a human reviewer still decide whether it ships.

## Steps

1. **Criteria.** Find the issue number from the branch, the conversation, or by asking. Read it with `gh issue view <n>`. List every acceptance criterion and every rule in the issue. If `docs/changes/<n>-*/` exists, also read `spec.md` (flagged concerns count as criteria) and `plan.md`, and note any change in the diff that isn't in the plan.
2. **Diff.** Run `git status --short` and `git diff main...HEAD` (and `git diff` for uncommitted work). Summarize what changed, file by file.
3. **Checks.** Run `npm run check`, which covers lint, skill lint, tests, type-check and build. Don't invent other commands. If a command is denied or fails, report that with its actual output. Never paraphrase a result you didn't see.
4. **Domain review.** Check the diff against these FinTechCo rules:
   - Money: integer cents via `toCents` (`src/ledger.ts`), displayed only via `formatUsd` / `money`. No float sums and no ad-hoc rounding.
   - Dates: match months on the literal `YYYY-MM` prefix. Use no `new Date(...)` parsing that could move Oct 31 into November.
   - Categories: missing or blank categories go through `categoryLabel`.
   - Refunds: negative amounts reduce their category net and the total, and still count.
   - Input: route or query values are validated. Unsupported values are rejected or fall back visibly, never silently.
   - Security: no `eval` / `new Function` / `insertAdjacentHTML` / `document.write`; no secrets; untrusted values are escaped by `html` and covered by a test with a hostile value such as `<img src=x onerror=alert(1)>`. Note that CodeQL runs on the PR as the independent check; it is not evidence until its result is observed.
   - Markup: views are pure functions that return `SafeHtml` built with `html`. No data is interpolated into raw `innerHTML`.
   - Data: `data/*.json` is unchanged and stays synthetic.
   - Scope: nothing beyond what the issue asks for. Existing pages behave as before.
5. **Evidence table.** Map each criterion to its evidence. The evidence is a named test plus the observed result, or a command's output. Set status to **Passed**, **Failed** or **Unverified**. Mark anything not exercised in this session, such as a browser smoke test or deploy, as **Unverified**. Never mark it Passed.

   | Acceptance criterion | Evidence | Status |
   |---|---|---|

6. **Findings.** List the domain-review findings by severity, with `file:line`, plus tests that are missing.
7. **PR description.** Draft it with these sections: Problem, Behavior, Validation (the evidence table), Risk, Rollback (revert the PR, which redeploys the previous build), Trace (links to `intent.md`, `spec.md` and `plan.md` in `docs/changes/<n>-*/`), and `Closes #<n>`.

## Boundaries

- Ask before editing any file.
- Stop before commit, push, merge or deploy. A human does those.
- Never invent test output, coverage numbers or time and cost savings.

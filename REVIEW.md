# Review instructions

## Passes
Run three passes and tag each finding with its pass:
- **Bugs:** logic errors, broken edge cases (month boundaries, refunds, empty months), regressions on existing pages.
- **Security:** untrusted URL/form values, unescaped markup, raw `innerHTML`, secrets, anything the guard hook should have caught.
- **Compliance:** the diff matches `docs/changes/<issue>/spec.md` and `plan.md`, and the CLAUDE.md conventions (integer cents, `html` template, `categoryLabel`). Flag any change not in the plan, and any plan step with no matching change.

## What Important means here
Reserve Important for findings that would break behavior, leak or mis-state money, or breach a policy above. Style and naming are nits.

## Cap the nits
Report at most five nits; summarize the rest as a count.

## Do not report
`dist/`, `package-lock.json`, and anything `npm run check` or CodeQL already enforces.

Findings don't approve or block a PR. Required checks and a human reviewer decide.

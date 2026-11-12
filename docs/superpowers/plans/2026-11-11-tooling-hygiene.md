# Tooling Hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the `npm audit` findings, pin the project to Node 22, make CI install exactly the lockfile, and add a linter, all in one small PR.

**Architecture:** This changes only configuration and dev dependencies. No file in `src/` changes behavior. Each task leaves `npm run check` green.

**Tech Stack:** Node 22, npm, Vite 6, Vitest 4, TypeScript 5, ESLint 9 (flat config) with typescript-eslint, GitHub Actions.

**Spec:** The four findings from the codebase review on 2026-11-11:
1. `npm audit` reports 3 vulnerabilities (2 critical: `tinypool`; 1 moderate: `@vitest/mocker`), all through `vitest@3.2.7`. The fix is `vitest@4.1.12`.
2. Local Node is v20.19.2 (end-of-life); CI uses Node 22.
3. CI runs `npm install` instead of `npm ci`.
4. There's no linter or formatter.

## Global Constraints
- Branch: `chore/tooling-hygiene`. Base it on `main` once PR #3 (`chore/demo-setup`) is merged; until then, base it on `chore/demo-setup`.
- Never edit `data/*.json`. Never merge; open a PR and let a human review it.
- Leave `typescript` (5.9.3 → 7.x) and `vite` (6.4.6 → 8.x) at their current majors. They have no audit findings, and bumping them is out of scope.
- `npm run check` must pass after every task.
- Prettier is **not** added. Reformatting the minified `src/style.css` and every source file would bury the real changes in the diff. If the team wants a formatter, add it in a separate PR.

## Review Focus
- **Vitest 4 globals typing:** `tsconfig.json` uses `"types": ["vitest/globals"]`. `tsc --noEmit` must still pass after the upgrade (covered by `npm run check` in Task 1).
- **Lockfile drift:** with `npm ci`, CI fails if `package-lock.json` is out of sync with `package.json`. Commit both together in each task (covered by `npm ci` in Task 1, step 4).
- **Lint errors hidden by `npm run check`:** if `lint` isn't part of `check`, CI won't enforce it. Task 3 adds it to the chain.
- **Lint rule churn:** the recommended rules may flag existing code, for example the `app!` non-null assertions in `src/main.ts`. Fix real findings in code; only disable a rule in config if the code is correct as written, and say why in a comment.
- **Node version mismatch for contributors:** `engines` plus `.nvmrc` makes the expected version visible. Task 2 checks that `npm ci` warns under Node 20.

---

### Task 1: Upgrade Vitest to 4.x to clear the audit

**Files:**
- Modify: `package.json` (`devDependencies.vitest`)
- Modify: `package-lock.json`

- [ ] **Step 1: Record the baseline**
Run: `npm audit --omit=optional`
Expected: `3 vulnerabilities (1 moderate, 2 critical)`

- [ ] **Step 2: Upgrade**
Run: `npm install -D vitest@^4.1.12`
Expected: `package.json` shows `"vitest": "^4.1.12"`.

- [ ] **Step 3: Verify the audit is clean**
Run: `npm audit`
Expected: `found 0 vulnerabilities`

- [ ] **Step 4: Verify a lockfile-exact install and the full check**
Run: `npm ci && npm run check`
Expected: `Test Files  6 passed (6)`, `Tests  44 passed (44)`, then `✓ built`.
If Vitest 4 reports deprecations or failures, fix the test or config according to the Vitest 4 migration guide. Don't pin back to 3.x.

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: upgrade vitest to 4.1.12 to fix tinypool and mocker advisories"
```

### Task 2: Pin Node 22 locally and in CI, and use `npm ci`

**Files:**
- Create: `.nvmrc` (contents: `22`)
- Modify: `package.json` (add `"engines": { "node": ">=22" }`)
- Modify: `.github/workflows/ci.yml` (`node-version: '22'` → `node-version-file: '.nvmrc'`, add `cache: 'npm'`, `npm install` → `npm ci`)
- Modify: `README.md` (Requirements line: `Node.js 20+ (22 recommended)` → `Node.js 22 (see .nvmrc)`)

- [ ] **Step 1: Install Node 22 locally** (the user does this; it's a machine change, not a repo change)
Run: `brew install node@22` or `nvm install 22 && nvm use 22`
Expected: `node -v` prints `v22.x`.

- [ ] **Step 2: Make the file and config edits listed above**

- [ ] **Step 3: Verify**
Run: `npm ci && npm run check`
Expected: passes under Node 22.
Run: `grep -n "npm ci" .github/workflows/ci.yml`
Expected: one match; no remaining `npm install`.

- [ ] **Step 4: Commit**
```bash
git add .nvmrc package.json .github/workflows/ci.yml README.md
git commit -m "chore: pin Node 22 via .nvmrc and use npm ci in CI"
```

### Task 3: Add ESLint and wire it into `check`

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json` (devDependencies; scripts `"lint": "eslint ."` and `"check": "npm run lint && npm run test && npm run build"`)
- Modify: `.claude/settings.json` (add `"Bash(npm run lint)"` to `permissions.allow`)
- Modify: `README.md` (in the `npm run check` comment: `# lint + tests + type-check + production build (what CI runs)`)
- Modify: any `src/` or `tests/` file with a real lint finding

**Interfaces:**
- Produces: `npm run lint`, which Plan B (Spending insights) must also pass.

- [ ] **Step 1: Install**
Run: `npm install -D eslint @eslint/js typescript-eslint globals`

- [ ] **Step 2: Write `eslint.config.js`**
Use flat config: `js.configs.recommended` plus `tseslint.configs.recommended`, with `languageOptions.globals` set to `globals.browser` for `src/**` and `globals.node` for `*.config.js`. Ignore `dist/` and `node_modules/`.

- [ ] **Step 3: Run lint and record findings**
Run: `npm run lint`
Expected: either clean, or a short list of findings. Fix each one in code. Only disable a rule for code that's correct as written, with a one-line comment explaining why.

- [ ] **Step 4: Add `lint` to `check` and to the allow list, then verify**
Run: `npm run check`
Expected: lint passes with no output, then `Tests  44 passed (44)`, then `✓ built`.

- [ ] **Step 5: Commit**
```bash
git add eslint.config.js package.json package-lock.json .claude/settings.json README.md src tests
git commit -m "chore: add ESLint with typescript-eslint and run it in npm run check"
```

### Task 4: Open the PR

- [ ] **Step 1: Inspect the branch diff**
Run: `git diff main...HEAD --stat`
Expected: only the files listed in Tasks 1–3.

- [ ] **Step 2: Push and open the PR** (both commands ask for permission)
```bash
git push -u origin chore/tooling-hygiene
gh pr create --title "chore: tooling hygiene (vitest 4, Node 22, npm ci, ESLint)" --body-file - <<'EOF'
## Summary
- Upgrade vitest 3.2.7 → 4.1.12: clears 3 npm audit advisories (2 critical in tinypool, 1 moderate in @vitest/mocker). Dev-only; the shipped bundle is unaffected.
- Pin Node 22 (`.nvmrc`, `engines`); CI reads `.nvmrc` and installs with `npm ci`.
- Add ESLint (flat config, typescript-eslint recommended) and run it in `npm run check`.

## Verification
- `npm audit`: 0 vulnerabilities
- `npm run check`: lint, 44 tests, type-check and build pass under Node 22

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

- [ ] **Step 3: Confirm CI**
Run: `gh pr checks --watch`
Expected: `checks` passes. Report the actual result, and don't merge.

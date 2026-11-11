# FinTechCo — Claude Code Interview Starter

This is a deliberately small **existing codebase** for the demo. It is not a completed feature and contains **only synthetic transactions**. Claude's live task is to add the Spending Insights feature.

## Requirements
Node.js 20+ (22 recommended), Git, VS Code, Claude Code CLI.

## Run
```bash
npm install
npm run dev
```
Open the localhost URL Vite prints. In another terminal:
```bash
npm run test
npm run build
```

## Suggested Claude Code practice
In the repo root run `claude` and ask:
1. `Explore this repository, explain its architecture and tests. Do not edit yet.`
2. `Plan the Spending Insights feature described in CLAUDE.md. Include tests, edge cases, and files to change. Do not edit until I approve.`
3. `Implement the approved plan and run npm run check. Explain each action and show the diff.`
4. `/fintech-test-review` (project Skill; invoke after implementation).

For a clean reset, **commit the starter version first** (`git init`, `git add .`, `git commit -m 'starter'`). Preserve the completed branch separately, then reset only when you know your work is backed up.

## Important
- Dependencies could not be installed or tested in the file-generation environment because the npm registry was unavailable. Run `npm install`, `npm run test`, and `npm run build` on your Mac and address any version issues before rehearsing.
- CI config is included, but real GitHub Actions results require a GitHub repo and a push.
- Branch protection and PR approval must be configured in GitHub; this repository alone does not enforce them.
- A Skill is provided; an MCP server is intentionally not bundled because credentials and connection methods depend on the user's environment. Add and test one suitable read-only MCP during rehearsal.
- The included tests establish starter integrity; the feature tests should be created by Claude during the demo. An independent acceptance-test fixture should be prepared and held outside Claude's accessible workspace if you need to demonstrate independent verification.

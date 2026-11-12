#!/usr/bin/env bash
# Reset the local repo to a clean, green starter between demo rehearsals.
# Never touches remote branches: close rehearsal PRs with `gh pr close <n> --delete-branch`,
# and if a rehearsal PR was merged, merge its revert PR first (that is also the rollback demo).
set -euo pipefail
cd "$(dirname "$0")/.."

STARTER_TAG=demo-starter
PREPARED_BRANCH=feature/month-selector-prepared
PREPARED_DIR=../fintechco-completed

if [ -n "$(git status --porcelain)" ]; then
  echo "Refusing to reset: uncommitted changes. Commit, stash, or discard them first." >&2
  git status --short >&2
  exit 1
fi

git checkout main
git pull --ff-only
git fetch --prune --tags

if git rev-parse -q --verify "refs/tags/$STARTER_TAG" >/dev/null; then
  if ! git diff --quiet "$STARTER_TAG" main -- src tests data index.html; then
    echo "main's app code differs from $STARTER_TAG. Merge the rehearsal's revert PR, then rerun." >&2
    git diff --stat "$STARTER_TAG" main -- src tests data index.html >&2
    exit 1
  fi
else
  echo "Note: tag $STARTER_TAG not found; skipping starter check."
fi

for b in $(git for-each-ref --format='%(refname:short)' 'refs/heads/demo/'); do
  git branch -D "$b"
done

# Finished feature for the "show the end state first" preview, in its own worktree so the
# demo never switches branches. Run it with: (cd ../fintechco-completed && npm run demo -- --port 5174)
if git rev-parse -q --verify "refs/remotes/origin/$PREPARED_BRANCH" >/dev/null; then
  if [ -d "$PREPARED_DIR" ]; then
    git -C "$PREPARED_DIR" pull --ff-only
  else
    git worktree add "$PREPARED_DIR" "$PREPARED_BRANCH"
  fi
  (cd "$PREPARED_DIR" && npm ci --silent)
else
  echo "Note: origin/$PREPARED_BRANCH not found; skipping the prepared worktree."
fi

npm ci
npm run check

# Production should serve main's build (deploy.yml stamps the commit into the bundle).
SITE=$(gh api 'repos/{owner}/{repo}/pages' --jq .html_url 2>/dev/null || true)
MAIN_SHA=$(git rev-parse main)
JS=$( [ -n "$SITE" ] && curl -fsS "$SITE" | grep -o 'assets/index-[^"]*\.js' | head -1 || true)
if [ -n "$JS" ] && curl -fsS "$SITE$JS" | grep -q "$MAIN_SHA"; then
  echo "Live site serves main's build (${MAIN_SHA:0:7})."
else
  echo "Warning: live site isn't serving main's build (${MAIN_SHA:0:7}). If you ran a rollback: gh workflow run deploy.yml" >&2
fi

echo "Reset complete: main is clean, green, and matches the starter."
echo "Before the session: start 'npm run telemetry' in its own terminal."

#!/usr/bin/env bash
# Reset the local repo to a clean, green main between demo rehearsals.
# Never touches remote branches: close rehearsal PRs with `gh pr close <n> --delete-branch`.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Refusing to reset: uncommitted changes. Commit, stash, or discard them first." >&2
  git status --short >&2
  exit 1
fi

git checkout main
git pull --ff-only
git fetch --prune

for b in $(git for-each-ref --format='%(refname:short)' 'refs/heads/demo/'); do
  git branch -D "$b"
done

npm ci
npm run check
echo "Reset complete: main is clean and green."

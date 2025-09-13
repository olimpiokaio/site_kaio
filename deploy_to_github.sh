#!/usr/bin/env bash
# Simple helper to initialize git and push this project to a GitHub repository.
# Usage:
#   ./deploy_to_github.sh [REPO_URL] [BRANCH]
# Defaults:
#   REPO_URL = https://github.com/olimpiokaio/site_kaio.git
#   BRANCH   = main
#
# Notes:
# - You must have git installed and be authenticated for the chosen URL (HTTPS with credentials/token or SSH with keys).
# - The script is idempotent and can be re-run safely.

set -euo pipefail

REPO_URL="${1:-https://github.com/olimpiokaio/site_kaio.git}"
BRANCH="${2:-main}"

# Move to the directory of this script (project root)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed. Please install git and try again." >&2
  exit 1
fi

# Initialize git repo if needed
if [ ! -d .git ]; then
  echo "Initializing new git repository..."
  git init
fi

# Ensure desired branch exists and is checked out
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
if [ -z "$CURRENT_BRANCH" ] || [ "$CURRENT_BRANCH" = "HEAD" ]; then
  # No branch yet (empty repo)
  git checkout -b "$BRANCH" 2>/dev/null || git switch -c "$BRANCH"
elif [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  # Switch to target branch, create if missing
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH" 2>/dev/null || git switch "$BRANCH"
  else
    git checkout -b "$BRANCH" 2>/dev/null || git switch -c "$BRANCH"
  fi
fi

# Add all files
git add -A

# Create an initial commit if repo has no commits, otherwise create an update commit if there are changes
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "Creating initial commit..."
  git commit -m "chore: initial commit of site"
else
  if ! git diff --cached --quiet; then
    echo "Creating update commit..."
    git commit -m "chore: update site content"
  else
    echo "No staged changes to commit."
  fi
fi

# Configure remote origin
if git remote get-url origin >/dev/null 2>&1; then
  CURRENT_URL="$(git remote get-url origin)"
  if [ "$CURRENT_URL" != "$REPO_URL" ]; then
    echo "Updating origin URL from $CURRENT_URL to $REPO_URL ..."
    git remote set-url origin "$REPO_URL"
  else
    echo "Remote origin already set to $REPO_URL"
  fi
else
  echo "Adding remote origin: $REPO_URL"
  git remote add origin "$REPO_URL"
fi

# Try to pull remote branch to avoid non-fast-forward (in case remote already has commits)
set +e
git fetch origin "$BRANCH" 2>/dev/null
FETCH_STATUS=$?
set -e

if [ $FETCH_STATUS -eq 0 ]; then
  echo "Merging remote changes (if any) from origin/$BRANCH ..."
  set +e
  git merge --allow-unrelated-histories --no-edit "origin/$BRANCH"
  MERGE_STATUS=$?
  set -e
  if [ $MERGE_STATUS -ne 0 ]; then
    echo "Merge encountered conflicts. Please resolve them, commit, and re-run the script." >&2
    exit 1
  fi
else
  echo "Remote branch origin/$BRANCH not found or fetch failed. Proceeding to push."
fi

# Push to remote
echo "Pushing to $REPO_URL ($BRANCH) ..."
 git push -u origin "$BRANCH"

echo "Done. Repository is now pushed to $REPO_URL on branch $BRANCH."
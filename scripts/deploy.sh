#!/usr/bin/env bash
# ShipToHire — push to GitHub and deploy to Vercel
#
# One-time setup:
#   1. gh auth login          (GitHub CLI)
#   2. npx vercel login       (Vercel CLI, or set VERCEL_TOKEN)
#   3. cp .env.example .env.local  and fill in keys
#
# Then run:
#   npm run deploy

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${REPO_NAME:-shiptohire}"
GITHUB_USER="${GITHUB_USER:-$(gh api user -q .login 2>/dev/null || true)}"
VERCEL_CMD="${VERCEL_CMD:-npx vercel@latest}"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
step() { printf '\n→ %s\n' "$*"; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    red "Missing required command: $1"
    exit 1
  fi
}

require gh
require git
require npm

if [[ -z "$GITHUB_USER" ]]; then
  red "Could not detect GitHub user. Run: gh auth login"
  exit 1
fi

if [[ ! -f .env.local ]]; then
  red "Missing .env.local — copy .env.example and add your keys first."
  exit 1
fi

step "Verify production build"
npm run build

step "Configure Git remote"
ORIGIN_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$ORIGIN_URL"
else
  git remote add origin "$ORIGIN_URL"
fi

step "Push to GitHub (${GITHUB_USER}/${REPO_NAME})"
if gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  git push -u origin HEAD:main
else
  # origin is already configured above — do not pass --remote=origin
  gh repo create "$REPO_NAME" --public --source=. --push
fi
green "GitHub: https://github.com/${GITHUB_USER}/${REPO_NAME}"

step "Link Vercel project (if needed)"
$VERCEL_CMD link --yes

step "Sync environment variables from .env.local → Vercel"
sync_env() {
  local key="$1"
  local line val
  line="$(grep -E "^${key}=" .env.local | tail -1 || true)"
  [[ -z "$line" ]] && return 0
  val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  [[ -z "$val" ]] && return 0
  printf '%s' "$val" | $VERCEL_CMD env add "$key" production --force >/dev/null
  printf '%s' "$val" | $VERCEL_CMD env add "$key" preview --force >/dev/null
  printf '%s' "$val" | $VERCEL_CMD env add "$key" development --force >/dev/null
  green "  synced $key"
}

sync_env OPENAI_API_KEY
sync_env GITHUB_TOKEN
sync_env UPSTASH_REDIS_REST_URL
sync_env UPSTASH_REDIS_REST_TOKEN

step "Deploy to Vercel (production)"
DEPLOY_URL="$($VERCEL_CMD deploy --prod --yes 2>&1 | tee /dev/stderr | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1 || true)"

green "Deploy complete."
if [[ -n "$DEPLOY_URL" ]]; then
  green "Live URL: $DEPLOY_URL"
else
  green "Check your deployment: $VERCEL_CMD inspect"
fi

green ""
green "Future deploys: git push origin main"
green "(If Vercel Git integration is enabled, pushes auto-deploy.)"

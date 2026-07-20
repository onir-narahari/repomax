#!/usr/bin/env bash
# Prints the current state of every job-matching issue, read straight from
# GitHub labels — the loop's source of truth. Costs nothing (no LLM calls),
# safe to run any time, and is exactly what a fresh session should run first
# to figure out where the loop left off.
#
#   bash scripts/job-matching-loop/status.sh
set -euo pipefail

echo "Build order: 11 (schema) -> 12 (ingest) -> 13 (repo selection) -> 14 (profile build)"
echo "          -> 15 (onboarding) -> 16 (matching engine) -> 17 (read path) -> 18 (cron)"
echo ""

gh issue list --label job-matching --state all --limit 20 \
  --json number,title,state,labels \
  --jq '.[] | [
    .number,
    (.labels | map(.name) | map(select(startswith("status:"))) | if length > 0 then .[0] else "todo" end),
    (if .state == "CLOSED" then "closed" else "open" end),
    .title
  ] | @tsv' \
  | sort -n \
  | awk -F'\t' '{printf "#%-4s %-24s %-7s %s\n", $1, $2, $3, $4}'

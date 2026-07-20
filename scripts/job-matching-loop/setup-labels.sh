#!/usr/bin/env bash
# Creates the GitHub labels used as the job-matching-loop's persistent state
# machine. Idempotent — safe to re-run. Run this once before the first
# invocation of the /job-matching-loop skill.
#
#   bash scripts/job-matching-loop/setup-labels.sh
set -euo pipefail

create_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --json name -q '.[].name' | grep -qx "$name"; then
    echo "exists: $name"
  else
    gh label create "$name" --color "$color" --description "$desc"
    echo "created: $name"
  fi
}

create_label "status:in-progress"    "FBCA04" "job-matching-loop: an implementer agent is actively working this issue"
create_label "status:qa-failed"      "D93F0B" "job-matching-loop: implementation done but failed the CI gate or QA review at least once"
create_label "status:ready-for-review" "0E8A16" "job-matching-loop: gates + QA passed, PR open, waiting on human review/merge"
create_label "status:needs-human"    "B60205" "job-matching-loop: stuck after bounded retries — needs a human to look before continuing"
create_label "status:done"           "5319E7" "job-matching-loop: PR merged, issue fully closed out"

echo "Done. No status label = not yet started (todo)."

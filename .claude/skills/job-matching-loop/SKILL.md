---
name: "job-matching-loop"
description: "Works through the 8 job-matching GitHub issues (#11-#18, onir-narahari/repomax): implement in an isolated worktree, run the CI gate (typecheck/test/lint/build), get a fresh-context QA review against that issue's Acceptance Criteria, retry with bounds on failure, then open a PR. Supports a supervised per-issue mode (stop at each PR for human review) and an unattended overnight mode (run all issues, then a final cross-PR QA pass, then merge + apply the DB migration + push to main only if that final review passes). State lives on GitHub issue labels so it survives session restarts. Use when the user asks to run the job-matching loop, work through the job-matching issues, continue the job-matching build, run it overnight/while asleep, or references job-matching-loop by name."
---

# Job Matching Loop

Drives issues #11-#18 in `onir-narahari/repomax` (the job-matching rebuild, see `docs/prd-job-matching.md`) through a bounded implement -> verify -> QA -> PR loop.

## Prerequisites

Labels must exist first. Check with:
```
bash scripts/job-matching-loop/status.sh
```
If it errors on unknown labels, run `bash scripts/job-matching-loop/setup-labels.sh` once, then re-check status.

For overnight mode specifically: Supabase CLI must already be logged in and linked (`supabase login`, `supabase link --project-ref ydaofksoqgxxisuwttpu` — both run interactively by the human beforehand, never by the agent). If not linked, do not start an overnight run — the migration step would stall with no one to unblock it.

## The issue map (fixed, not generic — there are exactly 8)

| # | Title | Tier |
|---|---|---|
| 11 | Schema: profile, per-repo embedding, seen-ledger tables; retire override/status tables | **foundational** |
| 12 | Ingest: extract real tags from full posting + embed postings at ingest | **foundational** |
| 13 | Repo selection: pinned repos via GraphQL + composite score + few-repo passthrough | **foundational** |
| 14 | Profile build: per-repo skill extraction + embedding + POST /api/jobs/profile | **foundational** |
| 15 | Onboarding: one-time confirm-your-repos step; remove swap/re-roll UI | later |
| 16 | Matching engine: computeMatchesForUser funnel + seen-ledger writes | later |
| 17 | Website read path: DB-only /api/jobs/matches + recency match cards | later |
| 18 | Cron: 8am precompute over all users + frequent ingest + batching/auth | later |

**Foundational tier (#11-14) is strictly sequential and blocking.** Everything after depends on the schema and the profile/embedding shape. If a foundational issue can't pass after bounded retries, **stop advancing to the next issue** — do not build #15-18 on an unverified foundation. Whatever passed before the stall stays staged; report exactly where it stopped and why.

## Modes

- **`next`**: do exactly one issue, open its PR, stop and report. Human reviews and merges that one PR themselves.
- **`auto`**: continue issue-to-issue, but still stop at each PR — no merging. Human merges each PR at their own pace.
- **`overnight`**: fully unattended, zero questions asked of the human during the run. Runs every issue it can, then a **final cross-PR QA pass** over the whole batch, then — **only if that final review passes** — merges everything in order, applies the DB migration to production, and pushes to `main`. This is what "run it while I sleep" / "run everything" means. See §Overnight procedure below; it supersedes the per-issue PR-and-stop behavior in steps 6-7.

Default to `next` unless the human has explicitly asked for `auto` or `overnight` in this conversation.

## Hard rules (never violate these, in any mode)

- **Never skip the CI gate.** typecheck, test, lint, build all have to actually pass — don't take an agent's word for it, re-verify yourself in the worktree.
- **Never retry unboundedly.** Max 3 attempts per issue per failure type (gate failure, QA failure). On the 3rd failure, or if two consecutive attempts produce the *same* error, stop retrying that issue.
- **Stay inside that issue's scope.** Re-read the issue's "Out of scope" section before implementing; don't let an agent wander into adjacent files "while it's in there."
- **QA is always a different context than the implementer.** Never let the implementer grade its own work — a CI-green result can still miss the actual spec (see the issue's Acceptance Criteria, not just the Validation commands).
- **In `overnight` mode specifically: merging is conditional on the final cross-PR QA review passing — full stop, no exceptions.** "Unattended" and "zero questions" describe how failures are *handled autonomously* (skip/report instead of pausing to ask), not a license to ship on a failing review. If the final review finds a real problem, the correct autonomous action is: merge nothing, leave everything staged exactly as it is, and write a precise report of what's wrong. Never merge to comply with "finish it overnight" — an unmerged, well-documented stopping point *is* a correct finish.
- **In `next`/`auto` modes: never merge a PR or push to `main`.** Those modes always stop at "PR open, waiting on you."

## Procedure, per issue (used by all three modes for the implement/QA-per-issue part)

### 1. Pick the next issue
```
gh issue list --label job-matching --state open --json number,labels
```
Pick the lowest-numbered open issue that has no `status:done` or `status:ready-for-review` label (a `status:qa-failed` issue with retries remaining is fair game to resume). Respect the foundational-tier gate above.

### 2. Mark in-progress
```
gh issue edit <N> --add-label "status:in-progress"
```

### 3. Read the issue and the PRD section it references
`gh issue view <N> --json body`, plus the relevant section of `docs/prd-job-matching.md` (each issue names its section, e.g. "§13"). This is the actual spec — the Acceptance Criteria bullets are what QA checks against later.

### 4. Spawn the implementer, isolated
Use the `Agent` tool with `isolation: "worktree"` (fresh subagent, not a fork — it shouldn't inherit this whole conversation, just the issue). Prompt it with:
- The full issue body (Problem / Expected behavior / Acceptance Criteria / Out of scope)
- The relevant PRD section, quoted or pointed to by file+section
- The Validation commands it must run itself before reporting done: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- Explicit instruction: implement only what's in scope, follow CLAUDE.md's engineering rules (plan before editing, one change at a time, no large rewrites, preserve working behavior), and report back which files changed and why

Remember the agent's id/name — it's how you resume it for retries (`SendMessage` with `to: <agentId>`).

### 5. Re-verify the gate yourself
Don't trust the implementer's self-report. In the worktree it produced, run the four commands yourself. For lint, mirror what CI does — lint only the files that changed in that worktree's diff against `main`, not the whole repo (the repo has pre-existing lint debt outside this scope; see the notes on issues #15/#17).

**If the gate fails:** resume the implementer (`SendMessage`) with the exact failure output, ask it to fix just that. Retry up to 3 times total. Two identical failures in a row = stop retrying.

**If the gate still fails after retries:** `gh issue edit <N> --add-label "status:qa-failed" --add-label "status:needs-human"`, `gh issue comment <N>` with the final failure output and what was tried. Then:
- **`next`/`auto`:** stop and report to the human.
- **`overnight`:** no human to hand it to right now — record it in the run's running summary, and apply the foundational-vs-later rule (§issue map) to decide whether to continue to the next issue or stop advancing.

### 6. QA: fresh agent, spec-check against Acceptance Criteria
Once the gate is green, spawn a **new** `Agent` call (not a fork, not the implementer) — general-purpose or the `code-review` skill's approach — with:
- The diff (or the worktree path/branch)
- Just that issue's Acceptance Criteria bullets
- Instruction: for each bullet, confirm it's actually true of the code, not just that the build passed. Report PASS or a specific list of unmet criteria — no vague "looks fine."

**If QA fails:** resume the implementer with the specific unmet criteria, re-run the gate (step 5), re-QA. Same 3-attempt bound as the gate.

**If QA still fails after retries:** same handling as step 5's "still fails" branch.

### 7. Per-issue PR
On QA pass:
- Branch name: `job-matching/issue-<N>-<short-slug>`
- Commit, push the branch
- `gh pr create` with body including `Closes #<N>` and a short summary of what changed + how it was validated
- `gh issue edit <N> --remove-label "status:in-progress" --add-label "status:ready-for-review"`
- `gh issue comment <N>` linking the PR

**`next` mode:** stop here entirely, report to the human.
**`auto` mode:** continue to the next issue (step 1), same PR-and-stop ending each time.
**`overnight` mode:** continue to the next issue (step 1) without stopping; proceed to §Overnight procedure once all issues are done or the run has stopped advancing per the foundational rule.

## Overnight procedure (steps 8-10, `overnight` mode only)

### 8. Work straight through
Repeat steps 1-7 issue after issue with no pause between them and no questions asked of the human. Keep a running plain-text summary as you go: per issue, what happened (shipped / needed N retries / stalled after 3 attempts) and why.

### 9. Final cross-PR QA pass
Once the run has finished advancing (either all 8 issues produced a PR, or it stopped early per the foundational rule), spawn one more **fresh** `Agent` — this is a *different* review than any per-issue QA already done. Give it:
- Every PR opened this run (branches/diffs), in dependency order
- `docs/prd-job-matching.md` in full, for cross-cutting context
- Instruction: review the batch as a cohesive whole, the way a human doing a final pass before shipping the whole feature would — not just "did each PR pass its own checklist" (already checked), but things like: does the onboarding UI (#15) actually call the profile endpoint from #14 correctly; does the cron (#18) actually invoke `computeMatchesForUser` from #16 correctly; are there any integration seams between the PRs that don't line up. Report a clear PASS or a specific list of problems.

### 10. Ship only on a clean pass
**If the final review passes:**
- Merge each PR in dependency order (`gh pr merge <N> --merge` or equivalent — admin bypass on branch protection makes this possible; note this happened, don't silently rely on it without saying so in the report).
- Apply the schema migration to production: `supabase db push`.
- Confirm `main` has everything (it will, post-merge) — **no separate deploy step, no `vercel` command.** Push/merge to `main` is the entire deploy trigger; Vercel's existing GitHub integration handles the rest.
- Update all shipped issues to `status:done`.

**If the final review does not pass:**
- Merge nothing. Apply no migration. Push nothing beyond what's already sitting in open PRs.
- Leave every issue's label exactly where it is (`status:ready-for-review` for what passed its own gate/QA, `status:needs-human`/`status:qa-failed` for what didn't).
- The report (§11) is the entire output of the night — a correct, fully-documented stop is a valid outcome, not a failure to "finish."

### 11. Final report
Whatever happened, produce one clear summary for the human to read whenever they're back: which issues shipped (with PR links) or merged, which stalled and why, what the final cross-PR review found, and — if applicable — that the migration was applied to production and merges used admin bypass on branch protection.

## Resuming after a session restart

Run `bash scripts/job-matching-loop/status.sh` first, always. It reads GitHub directly — it doesn't matter that the conversation restarted. Labels tell you exactly which issue is where; pick up at whatever step its label implies (`in-progress` → resume implementing or re-check the gate; `qa-failed` → check the retry count in the issue comments before deciding to retry again or escalate; `ready-for-review` → PR is open and, in `overnight` mode, waiting on the final cross-PR pass, not on a human).

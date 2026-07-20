# PRD: Daily GitHub-Matched Job Postings

**Status:** Planned
**Owner:** Onir
**Last updated:** 2026-07-19
**Related:** "My Job Postings" view in `app/profile/page.tsx` (`view === 'jobs'`), `lib/job-matching.ts`, `lib/job-postings.ts`, `app/api/jobs/*`, `[[project_github_connect_feature]]` memory

---

## 1. Summary

Give every RepoMax user a small daily set of **internship postings genuinely tailored to their best GitHub projects**, surfaced on their profile. The user confirms which projects represent them **once**, during onboarding; from then on the product just delivers — no configuration, no waiting.

Two properties define the whole design:

1. **Precomputed, not live.** All expensive work (GitHub fetches, embeddings, LLM reranking) happens on a background cron or once at onboarding — never in the page request. The website loads matches with a single DB read, so it's instant.
2. **Embedding-based matching.** Matches come from semantic similarity between a user's repos and postings, so real fit is captured ("Flask REST API" ≈ "Python backend role") rather than brittle keyword overlap.

## 2. Problem

The current implementation being replaced has three structural problems:

1. **Matching quality is bad.** Job "tech tags" are derived from `title + category` only, so most postings get zero tags. The keyword-overlap shortlist that feeds the LLM is therefore near-random, and the LLM can only pick the best of a bad set.
2. **It's slow.** `GET /api/jobs/matches` fetches full repo context from GitHub (multiple API calls per repo, up to 4 repos) *and* runs a GPT-4o rerank — synchronously, in the request, while the user watches a spinner. Every refresh/swap re-runs the whole thing.
3. **Repo selection is naive and the config UX is confusing.** It matches against the 4 most-recently-updated repos (surfaces coursework and half-finished experiments), and the "swap a repo" override flow lets users endlessly re-roll matches, which is confusing and off-goal.

## 3. Goals

- Deliver a small daily set (target **3**, up to 5) of internship postings matched to a user's **best, diverse** GitHub repos.
- Matches are **precomputed** (daily 8am cron) so the website loads instantly — page = a DB read, not a compute.
- Matching uses **embeddings** (semantic similarity), so real fit is captured.
- The user confirms their representative repos **once**; the daily loop needs zero interaction afterward.
- Prefer **fresh** postings — recency is a ranking factor and is shown ("Posted 2 days ago").
- Each match is **explainable**, grounded in a specific repo → specific posting overlap. No inflated match %.
- Never show the same posting to the same user twice.

## 4. Scope boundaries

In scope, but **later** (schema/architecture leaves room; not built now):
- **Email delivery** — matches are already precomputed rows, so sending is a straightforward add. Not built now.
- **Role type / location / remote preferences** — onboarding captures **repos only**. Location filtering sits dormant until it's added.
- **Auto-refresh of the committed profile** — the profile is recomputed **only when the user edits their repo set**. Periodic refresh for repo drift comes later.

Out of scope entirely:
- New-grad (non-internship) postings — internships only.
- A job board / search experience; auto-apply; a thumbs up/down feedback loop.
- Intraday re-matching — the user-facing set is computed once at 8am; a job posted at noon surfaces the next morning.

## 5. Users & entry points

| User state | Behavior |
|---|---|
| Signed in, GitHub connected, ≥1 usable repo | Full experience: onboarding confirm step → committed profile → daily matches |
| Signed in, GitHub connected, 0 usable repos | Empty state: "connect a repo with real code to get matched" |
| Signed in, **not** GitHub-connected | Prompted to connect GitHub first (same linking gap noted in `[[project_github_connect_feature]]`) |
| Not signed in | Sees the pitch + CTA to sign in and connect GitHub; no matches computed |

"Usable repo" = public, non-fork, non-empty (size > 0) — the same filter `fetchUserRepos` already applies.

---

## 6. The architecture in one picture

The core principle: **move all expensive work out of the request path.** The website stops *computing* matches and starts *reading* them.

```
INGEST (frequent, cheap, background):
   pull SimplifyJobs feed → normalize → extract real tags → EMBED each new posting → upsert job_postings

CONFIRM (once per user, at onboarding — the only time a human waits):
   pick best repos → user confirms/edits → fetch repo context → distill per-repo skill profile
   → EMBED each repo → store committed profile → run first match immediately

8AM CRON (nobody watching — slow is fine):
   for each onboarded user: computeMatchesForUser(userId) → write daily 3 to user_job_matches

WEBSITE (someone watching — must be instant):
   SELECT today's matches WHERE user_id = me   ← one DB query, milliseconds
```

`computeMatchesForUser(userId)` is **one function with two callers**: the 8am cron (loops over all users) and the confirm step (runs once for the new user). No duplicated logic.

---

## 7. Repo selection (which projects represent the user)

Replaces "4 most-recently-updated non-forks." The picker produces **plausible defaults the user confirms in one tap** — it doesn't need to be perfect because the confirm step is the safety net.

**Target committed set size: ~5 repos.**

The amount of work depends entirely on how many usable repos the user has — selection only *engages* when there are more usable repos than the target:

### 7.1 Few repos (≤ target, i.e. 1–5 usable repos) — no selection, use them all
There's nothing to rank or choose. Use **every** usable repo as the committed set. The confirm step still shows them ("these are the projects we'll represent you with"), but there's nothing to prune from — it's a confirmation, not a choice. This covers the common student case of 1, 2, or 3 real repos. See §8.5 for how matching adapts to a 1- or 2-repo set.

### 7.2 Many repos (> target) — pinned-first, then composite score
1. **Pinned repos win.** GitHub lets users pin up to 6 — that's them hand-curating their best work for employers. Requires a **GraphQL call** (`user.pinnedItems`); the REST list endpoint does **not** expose pins. If the user has pinned repos, those become the default set (capped at the target size, in pin order).
2. **Composite score fills the rest** (no pins, or fewer pins than the target). Scored from the REST list endpoint (one call, no per-repo fetch):

| Signal | Direction | Weight |
|---|---|---|
| Has `description` | + | medium+ |
| Has `topics` | + | medium |
| Code substance (`size` not tiny) | + | medium |
| `pushed_at` recency | + | low (tiebreaker) |
| Stars | + | very low (noise for students) |
| Name heuristics: `*-tutorial`, `hw`, `assignment`, `cs101`, `clone`, `learn-*`, dotfiles | − | strong negative |
| Fork / empty / private | exclude | — |

- **Diverse over coherent:** prefer a spread of tech/domains (one ML, one web, one systems) to maximize the number of postings that can plausibly match. When scores are close, break toward tech/language diversity rather than piling on the same stack.
- **README quality** is the best filter but isn't in the list endpoint — don't fetch it during selection. Use `description`/`topics`/`size` as cheap proxies to pick ~5 candidates; since the confirm step deep-fetches those candidates anyway, quietly down-rank a README-less repo at that later stage.
- **All candidates weak?** If every repo is penalized (all coursework/tutorials), still pick the top ~5 available — never return an empty set just because scores are low. The confidence gate at match time handles quality; selection's job is only to choose *which* repos.

---

## 8. The matching engine

A retrieve → rank → rerank funnel. At ~1000 postings this needs **no vector DB / ANN** — brute-force cosine over 1000 vectors is microseconds.

```
1000 postings ──retrieve──▶ ~30 ──drop seen + dedupe──▶ ──rank──▶ ~10 ──LLM rerank──▶ gate ──▶ 3
```

### 8.1 Candidate profile (built once, at confirm)
- For each committed repo, an LLM extracts a **structured skill profile**: languages, frameworks, infra, domain, and "what was actually built."
- A distilled NL paragraph per repo (e.g. *"Real-time chat app with Next.js, WebSockets, Postgres"*) is **embedded** — one vector **per repo** (per-repo, not blended, so matches attribute cleanly to a project and diversity is natural).
- Stored on `user_job_profile_repos`. Recomputed only when the user edits their repos.

### 8.2 Job embeddings (built once, at ingest)
- Each posting's text (title + tags + any description) is embedded when first ingested and cached on `job_postings.embedding`. Never re-embedded once seen. Shared across all users.
- Real tech tags are extracted from the **full posting**, not just `title + category` (fixes the current tagging bug), for use as a lexical signal.

### 8.3 Match time (`computeMatchesForUser`)
1. **Retrieve:** cosine each of the user's repo embeddings against all active job embeddings → top ~30 candidates.
2. **Drop seen:** remove any posting already in `user_job_seen` for this user.
3. **Dedupe across repos:** the same posting can surface for two repos — keep it once, attributed to its highest-scoring repo.
4. **Rank:** `score = semantic_similarity + recency_boost − penalties`. `recency_boost` decays with age (posted <48h strong, <7d medium, <14d small, older ~0). Relevance leads; recency nudges/tie-breaks.
5. **Rerank:** GPT-4o reranks the top ~10 — final ordering + an **evidence-grounded reason** tied to a specific repo + a calibrated confidence.
6. **Gate:** keep matches above the confidence bar. **Send fewer, not weaker** — if fewer than 3 clear the bar, show fewer (including zero).
7. **Write:** upsert into `user_job_matches` for today; insert shown postings into `user_job_seen`.

### 8.4 Explainability
- Each match shows a short, specific reason: which repo it's grounded in and what overlaps. Never claim culture/growth fit. Consistent with CLAUDE.md's "no fabricated metrics" rule.
- **No raw similarity shown as a %** — cosine values cluster high (everything looks 85–95%). If any score is displayed, calibrate/rank-normalize across the day's set.

### 8.5 Per-repo spread adapts to how many repos exist
To keep the daily set diverse when there are many repos, no single repo should dominate — but that cap must **never** prevent filling the set when there are few repos. The rule:

- The per-repo cap is `max(2, ceil(targetMatches / repoCount))`.
- **1 repo:** all 3 matches come from that one repo (cap = 3). Matching runs identically — one repo vector, cosine over 1000, rerank, gate. Nothing special needed; it's just a smaller profile.
- **2 repos:** up to 2 per repo, so 3 can be filled (e.g. 2 + 1).
- **5+ repos:** the cap holds at ~2/repo, spreading across projects.

So a user with a single strong repo still gets a full set matched to it; a user with many gets spread. The engine is the same in every case — only the cap flexes.

---

## 9. Speed model

| | Current implementation | This plan |
|---|---|---|
| **Page load** | GitHub fetches + GPT-4o, live | one DB read (instant) |
| **Heavy work** | every visit, in-request | once at 8am, background |
| **User waits on LLM** | every visit | only once, at onboarding |

- **Day 1 (signup, any time):** one-time ~5–15s "analyzing your projects…" while the profile is built + first match runs. Kick the repo-context fetch + profile build off the moment the user **connects GitHub** (while they're still on the confirm screen) so most latency is hidden behind UI they're already using.
- **Day 2+:** instant — the 8am cron already wrote today's rows; the page just reads them.

---

## 10. New users mid-day

The 8am cron only covers already-onboarded users. A user who signs up at 2pm gets their **first batch computed at the end of onboarding** (the confirm step calls `computeMatchesForUser` once). This is fast because the shared job embeddings already exist from the last ingest; only the user's profile embedding + one rerank are new. The cron takes over the next morning.

Edge: a signup before the very first ingest (empty `job_postings`) → "no matches yet, check back tomorrow." Effectively never happens once live.

---

## 11. Freshness & recency

- **Daily ingest replenishes the pool**; newly-ingested postings are automatically **unseen**, so fresh + relevant postings naturally surface first.
- **Recency term in ranking** (§8.3 step 4) tilts toward new postings without letting an irrelevant-but-new job outrank a strong match.
- **"Posted X ago" badge** on each card; sort newest-relevant first. (Research: leading with freshness drives clicks; applying within 48h ~3x response rate.)
- **Running-dry policy:** with ~1000 postings a heavy user eventually exhausts fresh matches. Always prefer unseen; **send fewer, not weaker.** The unseen pool replenishes with each ingest.
- **Ingest cadence ≠ match cadence.** Ingest can run every few hours (cheap) to keep the pool maximally fresh; the user-facing match still runs once at 8am from the freshest available pool.

---

## 12. Edge cases

| Case | Handling |
|---|---|
| **0 usable repos** | Empty state, no profile built: "connect a repo with real code to get matched." |
| **1–5 usable repos** | No selection/scoring — commit all of them (§7.1). |
| **1 usable repo** | Match engine runs unchanged on one repo vector; per-repo cap = 3 so the full set fills from it (§8.5). |
| **2 usable repos** | Per-repo cap = 2, so a 2+1 split fills the set (§8.5). |
| **All repos are coursework/tutorials (all penalized)** | Selection still picks the top ~5; the confidence gate — not selection — decides quality (§7.2). |
| **Fewer than 3 matches clear the gate** | Send fewer, not weaker — including zero (§8.3 step 6, §11). |
| **Same posting matches two repos** | Deduped to one, attributed to its highest-scoring repo (§8.3 step 3). |
| **Committed repo later deleted/renamed on GitHub** | Matching uses the **stored** embedding, so the daily run is unaffected. Only a re-onboard/edit needs to handle the repo being gone (drop it, rebuild from what remains). |
| **User edits repos down to fewer** | Rebuild the profile from whatever remains; if it drops to 0, back to the empty state. |
| **User pushes major new code after onboarding** | Not auto-picked up (profile refreshes only on edit — a known limitation, §15). |
| **Unseen pool exhausted (heavy user, thin supply)** | Prefer unseen; send fewer. Replenishes as ingest pulls new postings. |
| **Ingest feed unreachable / empty** | Keep the last known `job_postings`; matching runs against the existing pool. Don't wipe on a failed fetch. |
| **Existing users from the old feature** | Retiring `user_job_repo_overrides` / `user_job_repo_status` drops their old overrides; they pass through the new confirm step once to build a committed profile. Old `user_job_matches` rows are harmless (compatible shape) and simply get superseded by the next run. |

---

## 13. Data model

### New / changed tables

**`user_job_profile`** — one row per user (singular state):
- `user_id` (pk, → auth.users)
- `onboarded_at`, `updated_at`
- `status` (e.g. `active` / `needs_reonboarding`)
- *(reserved for later: `role_type`, `location_pref`, `remote_ok`)*

**`user_job_profile_repos`** — one row per committed repo per user (what matching cosines against):
- `user_id`, `repo_full_name`, `repo_name`
- `pinned` (bool)
- `skills` (jsonb: languages/frameworks/infra/domain/what-was-built)
- `profile_text` (the distilled NL paragraph that gets embedded)
- `embedding` (vector)
- `updated_at`
- unique `(user_id, repo_full_name)`

**`job_postings`** — existing table + `embedding` (vector) column, populated at ingest.

**`user_job_matches`** — existing table, holds the daily set. Columns for `match_reason`, `confidence`, `match_rank`, `match_date`. Rank cap already raised to 5.

**`user_job_seen`** — append-only freshness memory:
- `user_id`, `job_posting_id`, `first_shown_at`
- unique `(user_id, job_posting_id)`

### Retired
- `user_job_repo_overrides` → replaced by `user_job_profile_repos` (committed list is the source of truth; the position/slot/backfill machinery in `lib/job-matching.ts` goes away).
- `user_job_repo_status` → the per-day fetch-status hack; unnecessary once fetch happens once at confirm.

### RLS & extension
- Same pattern as existing tables: users read only their own `user_job_profile*` / `user_job_matches` / `user_job_seen` rows; writes go through the service role (cron + confirm route). `job_postings` stays public-read.
- `embedding` uses the `vector` extension (pgvector) — or a plain `float8[]` column, since retrieval is brute-force in application code either way. Decide at build start.

---

## 14. Surfaces & routes

- **Onboarding confirm step** (new UI): auto-picked ~5 diverse repos with checkboxes + the user's other repos to add (or, for ≤5 usable repos, just the full set shown to confirm). "These are the projects we'll represent you with — confirm or edit." Confirm → build profile → first match → land on the jobs view. An "Edit my projects" affordance lives in settings; the daily loop needs none.
- **`GET /api/jobs/matches`** — simplified to a **DB read** of today's `user_job_matches` (no live fetch/LLM). Grouped-by-repo response shape can stay for the UI.
- **`POST /api/jobs/profile`** (new) — persist the committed repo set, (re)build the profile, run the first/updated match. Replaces the `repo-overrides` endpoint.
- **`POST /api/jobs/refresh`** (ingest) — extended to embed postings; cron-driven (frequent).
- **New cron** — 8am daily: (optionally re-ingest, then) loop `computeMatchesForUser` over all onboarded users. Configured via `vercel.json` `crons` + a protected endpoint (secret header, same pattern as the existing `JOB_REFRESH_SECRET` ingest route). See §16 for the time-budget/scaling consideration.
- **UI** — per-repo match cards with evidence reason + "Posted X ago" badge; "no strong match yet" / "checked N repos" states; **remove** the swap/re-roll controls.

---

## 15. Rollout / staging

1. **Schema + ingest embeddings** — add tables, `vector`/array column, embed postings at ingest. No user-facing change yet.
2. **Profile build + confirm UI** — repo picker (few-repo → use-all; many-repo → pinned via GraphQL + composite score), confirm step, `user_job_profile*` population, per-repo embeddings.
3. **Matching engine** — `computeMatchesForUser` (cosine → drop seen → dedupe → recency rank → rerank → gate → adaptive per-repo cap), seen-ledger writes.
4. **Website read path** — swap `GET /api/jobs/matches` to read precomputed rows; new match cards + recency badges; remove swap UI.
5. **Cron** — 8am job over all onboarded users; frequent ingest.

---

## 16. Open questions / risks

- **Cron time budget / scaling.** The 8am job runs a rerank LLM call per user; looping all users in one serverless invocation will blow the function timeout as the user base grows. Mitigations: process users in batches with bounded concurrency, and/or fan out (a queue, or paginated cron invocations) rather than one long loop. The confirm-step path is unaffected (single user). Decide the batching approach when building the cron.
- **Freshness is the real bottleneck**, not model sophistication — ~1000 postings + daily sends means the seen-ledger + "send fewer" discipline matters as much as embeddings. Watch how fast heavy users run dry as internship season ramps.
- **Repo drift** — the profile refreshes only on explicit edit; a user who pushes major new work won't be re-represented until they re-confirm. Acceptable for now; revisit if it bites.
- **pgvector vs. `float8[]`** — decide at build start. Brute-force cosine in app code works with either at this scale.
- **Embedding + rerank model choice** — `text-embedding-3-small` for postings/profiles; keep GPT-4o (or evaluate a cheaper rerank model) for the final step.
- **Confidence calibration** — define the gate threshold and how (if at all) a score is surfaced, avoiding the "everything is 90%" inflation.

## 17. Success signals

- The job view loads effectively instantly for returning users (no live fetch/LLM).
- Matches read as genuinely relevant to the user's actual projects (qualitative + click-through).
- Users complete the confirm step and rarely need to edit afterward (config-once working as intended).
- When email later ships, hold the digest to a **3–5% CTR** relevance bar; below ~2% is a matching problem, not deliverability.

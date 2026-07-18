# PRD: GitHub-Matched Job Postings

**Status:** Phase 1 implemented (matching + profile UI, no email/cron yet — see §16)
**Owner:** TBD
**Last updated:** 2026-07-17
**Related:** `components/HomePageSections.tsx`'s job-matching announcement copy, the "My Job Postings" view in `app/profile/page.tsx` (`view === 'jobs'`), `[[project_github_connect_feature]]` memory

---

## 1. Summary

Give every RepoMax user 3 open roles matched to their own GitHub activity — surfaced on their profile and delivered by email once a day at noon. The pitch: *"Find roles that are tailored to you. 3 open roles matched to your GitHub, delivered to your inbox every day at noon."*

This turns RepoMax from a one-time "score my repo" tool into something with a daily reason to come back, and closes the loop from "here's what's wrong with your repo" to "here's a role you could actually get."

## 2. Problem

RepoMax tells students their repo is weak and how to fix it, but stops there. Students still have to:
- Find relevant internship/new-grad postings themselves (scattered across LinkedIn, Simplify, company boards)
- Guess whether their specific stack/project actually matches what a listing wants
- Do this repeatedly, manually, with no signal from RepoMax after the initial scan

There's already a placeholder for this: `app/profile/page.tsx` ships a "My Job Postings" nav item with a "Coming soon" empty state and an email-capture waitlist form (`JobsWaitlistForm`, posts to `/api/waitlist`, fires `job_postings_notify_signup_client` in PostHog). This PRD is what fills that placeholder in.

## 3. Goals

- Match 3 open roles to a user's **3 most recently updated GitHub repos** (not just their single scanned repo)
- Show those 3 matches on `/profile` (`view=jobs`), replacing the current waitlist stub
- Email the same 3 matches daily at 12:00 (see §8.4 for the timezone caveat) to opted-in users
- Matches must be explainable — each one shows *why* it matched (shared stack, project type, etc.), consistent with RepoMax's "specific, not vague" positioning
- Keep it recruiter-realistic: internship / new-grad SWE roles only, nothing senior

## 4. Non-goals (v1)

- Not a full job board / search experience — no filters, no browsing beyond the 3 matches
- Not applying on the user's behalf — matches link out to the original posting
- Not scraping or aggregating from sites that prohibit it (see §7 sourcing decision)
- No resume/application tracking (separate feature)
- No per-user matching feedback loop (thumbs up/down) in v1 — noted as a fast-follow in §12
- No SMS/push — email only

## 5. Users & entry points

| User state | Behavior |
|---|---|
| Signed in, GitHub connected (via existing "Connect GitHub" flow), has ≥1 public repo | Full experience: matches computed from their 3 most recently updated repos |
| Signed in, GitHub connected, 0 usable repos (all empty/forked) | Empty state: "connect a repo with real code to get matched" |
| Signed in, **not** GitHub-connected (email/Google signup) | Prompted to connect GitHub before matching can run — this is the same "linking" gap already flagged as an open item in `[[project_github_connect_feature]]`. Matching *cannot* ship for these users until that's resolved, or v1 explicitly excludes them (see §7 open decision) |
| Not signed in | Sees the feature pitch on the landing/profile page with a CTA to sign in + connect GitHub; no matches computed |

## 6. User flow

1. User connects GitHub (existing flow) or is already connected.
2. RepoMax pulls their 3 most recently updated public, non-fork repos (reuse `fetchUserRepos` in `lib/github.ts`, already sorted by `updatedAt`).
3. For each of those repos, extract the same structured signal RepoMax already computes for scoring (languages, frameworks, topics, tech stack tags — see `lib/repo-score.ts` / `StructuredFacts`) rather than re-deriving it from scratch.
4. Combine the 3 repos' signals into one "candidate profile" (stack tags, primary languages, project types — e.g. "full-stack web," "ML/data," "systems").
5. Candidate profile is matched against the current open-role pool (see §7) to produce the top 3 roles, each with a 1-line "why this matched" reason tied to a specific repo (e.g. "Matched from `repo-name` — both use Next.js + Postgres").
6. Matches render on `/profile?view=jobs`, replacing the waitlist stub.
7. If the user has notifications enabled, the same 3 matches are emailed daily at noon.
8. Matches refresh once a day (tied to the same job that sends the email — see §8.3) — not on every profile visit, to keep results stable within a day and avoid re-running the matcher on every page load.

## 7. Job posting data — the central open decision

RepoMax has **no existing job data source, ATS integration, or scraper**. This is the single biggest unknown in this PRD and determines feasibility more than anything else below. Three realistic options:

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A. Paid job-data API** (e.g. Adzuna, JSearch/RapidAPI, Jooble) | Pull SWE internship/new-grad listings via API, refreshed on a schedule | Fast to integrate, legal, structured data (title/company/location/description) out of the box | Recurring cost; coverage/quality for *internship-specific* roles varies and needs filtering; still need tech-stack tagging ourselves |
| **B. Public ATS job boards** (Greenhouse, Lever, Ashby expose public JSON job-board APIs per company, no key needed) | Maintain a curated list of companies known to hire CS interns/new grads, pull their public board JSON directly | Free, high-quality, real postings, legal (these endpoints are meant to be public) | Manual curation of the company list; no aggregation across the whole market — only companies you've added |
| **C. Scrape general job boards (LinkedIn, Indeed, etc.)** | Scrape listings | Broad coverage | Against most of these sites' ToS, fragile, and risks the account/IP — **not recommended** |

**Recommendation: start with B (curated Greenhouse/Lever/Ashby boards), backed by A later if coverage is too thin.** It's free, matches RepoMax's "practical, specific" positioning (real companies, real postings — not a generic aggregator feed), and a curated list of ~50-100 companies that actually hire CS interns is a reasonable v1 scope. This needs a product decision before engineering starts — flagging it rather than assuming.

Regardless of source, postings need to be normalized into a common shape and tagged with a tech-stack signature (languages/frameworks mentioned in the description) so they're matchable against a repo's stack.

## 8. Architecture

### 8.1 Data model (new Supabase tables)

```
job_postings
  id                uuid pk
  source             text        -- 'greenhouse:stripe', 'adzuna', etc.
  external_id        text        -- id from the source, for dedupe
  title              text
  company            text
  location           text
  level              text        -- 'internship' | 'new_grad'
  url                text
  description_raw    text
  tech_tags          text[]      -- derived tags, e.g. ['react','postgres','python']
  posted_at          timestamptz
  is_active          boolean     -- flips false once closed/stale
  last_seen_at       timestamptz -- last time the source confirmed it's still live
  created_at         timestamptz

user_job_matches
  id                 uuid pk
  user_id            uuid fk -> auth.users
  job_posting_id     uuid fk -> job_postings
  matched_repo_name  text        -- which of the 3 repos drove the match
  match_reason       text        -- short explainer shown in UI/email
  match_rank         int         -- 1-3
  match_date         date        -- the day this match set was generated (one set per day)
  emailed_at         timestamptz null
  created_at         timestamptz

user_email_prefs
  user_id            uuid pk fk -> auth.users
  job_matches_enabled boolean default false   -- opt-in, not opt-out (see §10)
  timezone           text null                -- for per-user noon send, if built (see §8.4)
  unsubscribed_at    timestamptz null
```

### 8.2 Matching pipeline

Two-stage to control cost, consistent with how RepoMax already uses LLM calls sparingly for scoring:

1. **Cheap filter:** compare candidate profile's tech tags against `job_postings.tech_tags` with simple overlap scoring, narrow the active pool down to ~15-20 candidates.
2. **LLM rerank + explain:** send the shortlist + the 3 repos' structured facts to the existing Anthropic/OpenAI client (`@anthropic-ai/sdk` / `openai` are already dependencies) to pick the top 3 and generate the one-line "why" for each. This mirrors how resume bullets are already grounded in real repo evidence per the project's resume-bullet rules — job-match reasons should follow the same rule: **no invented fit** ("perfect for you!") — only concrete stack/project-type overlap.

### 8.3 Scheduling

- New Vercel Cron job (`vercel.json` currently has no `crons` — needs adding) hitting `/api/cron/job-matching` once daily.
- That endpoint: (a) refreshes `job_postings` from source if stale, (b) recomputes `user_job_matches` for every user with GitHub connected, (c) sends emails to everyone with `job_matches_enabled = true`.
- Protect the endpoint with `CRON_SECRET` checked against Vercel's cron request header, per Vercel Cron conventions.
- Separate, more frequent posting-refresh cron (e.g. every 6h) is worth splitting out from the per-user matching job so a slow job-source fetch doesn't block email send timing.

### 8.4 "Every day at noon" — timezone caveat

Noon in what timezone? Two options:
- **v1 (recommended): fixed noon UTC (or a fixed US time, e.g. noon ET)** — one cron trigger, simplest to build and reason about. State this plainly in the UI/email copy ("every day at noon ET") rather than promising personalized local noon.
- **v2: per-user local noon** — requires storing `timezone` per user (column already sketched above) and either running the cron hourly and filtering to users whose local time is currently noon, or using a queue with per-user scheduled sends. More correct, more complexity — defer unless users push back on a fixed time.

### 8.5 Email delivery

No email-sending infrastructure exists in this codebase today (checked: no Resend/SendGrid/Postmark/nodemailer dependency, `/api/waitlist` only posts to PostHog). This needs to be added.

**Recommendation: Resend.** It's the natural fit for a Vercel/Next.js app (first-class Next.js integration, generous free tier, simple API), and is already implicitly the path of least resistance given the stack (Vercel deploy + Next.js).

Email must include:
- The 3 matched roles (title, company, one-line match reason, apply link)
- A visible, working **unsubscribe link** — this is a legal requirement for any recurring bulk email (CAN-SPAM), not optional polish
- Copy tone matching RepoMax's positioning: practical and specific, not "we found amazing opportunities for you!" — e.g. "3 roles that match your stack" not "unlock your dream job"

## 9. Profile page changes (`app/profile/page.tsx`)

Replace the `view === 'jobs'` block (currently `JobsWaitlistForm` + "Coming soon" empty state, lines ~598-620) with:

- If matches exist for today: 3 cards, each showing role title, company, location, level badge, the matched-repo tag, the one-line reason, and an "Apply →" external link — visually consistent with the existing `PastRepoCard` / GitHub repo card patterns already on this page (rounded-xl border cards, accent color per state).
- A small toggle for "Email me daily at noon" wired to `user_email_prefs.job_matches_enabled` (defaults off — see §10).
- If the user isn't GitHub-connected yet: reuse the same "Connect GitHub" CTA pattern from the home view rather than inventing a new one.
- If GitHub-connected but no matches yet (pool empty / still computing): keep a lightweight version of today's empty state, not the waitlist form (that capture already happened for existing waitlist signups — see §12 migration note).

## 10. Opt-in, not opt-out

Daily email should be **explicit opt-in**, off by default, surfaced clearly on first visit to the jobs view ("Email me daily at noon" toggle, not a pre-checked box). This avoids CAN-SPAM/consent issues and matches how a recruiter-aware, non-spammy product should behave — sending unsolicited daily email to every signup would work against RepoMax's "practical, not generic AI SaaS" positioning.

## 11. Freemium / gating question

Per `[[project_github_connect_feature]]`, RepoMax has **no billing system yet**. Before building this, decide: is daily job matching a free feature (retention driver) or a Pro feature (monetization driver, once billing exists)? This PRD assumes **free for v1** since billing is a prerequisite RepoMax doesn't have, same reasoning already applied to the GitHub-connect freemium gate. Revisit once billing ships.

## 12. Migration note

Existing `/api/waitlist` signups (captured via `job_postings_notify_signup_client` in PostHog) are email addresses only, not tied to a `user_id` or GitHub account, and can't be matched to repos. They should get a "it's live — connect your GitHub to see your matches" email once this ships, not be silently enrolled.

## 13. Success metrics

- % of GitHub-connected users who opt in to daily email
- Email open rate / click-through to "Apply →"
- Daily active return to `/profile?view=jobs` among opted-in users
- Match relevance, proxied by click-through rate per match (low CTR on a given tech-tag combo signals the matcher needs tuning)

## 14. Fast-follows (explicitly out of scope for v1)

- Thumbs up/down feedback on individual matches to tune the reranker over time
- Per-user local-timezone send time
- Filters/browsing beyond the daily 3
- Expanding job source coverage beyond the initial curated ATS list (§7 option A as a supplement)
- Resume-bullet-to-application handoff ("here's a bullet tailored to this specific posting")

## 15. Open decisions — resolved for Phase 1

1. **Job data source: curated Greenhouse boards.** Verified live on 2026-07-17 against 35 real company boards (Stripe, Anthropic, Databricks, Coinbase, Airbnb, Cloudflare, MongoDB, Robinhood, Duolingo, Figma, and 25 more — see `lib/companies.ts`). No paid API, no scraping ToS risk. List is easy to extend by adding board tokens.
2. **Non-GitHub-connected users: excluded from Phase 1**, consistent with the `linkIdentity` gap already noted in `[[project_github_connect_feature]]`. The jobs view shows a plain "connect GitHub" message with no broken CTA rather than promising a flow that doesn't exist yet.
3. **Timezone: deferred** — moot until email ships (§16); matches currently regenerate lazily, once per calendar day, on the user's first profile visit that day.
4. **Email provider: deferred to Phase 2** (§16) — Resend remains the recommendation whenever that phase starts.
5. **Gating: free**, unchanged — no billing system exists to gate against yet.

## 16. What's built vs. deferred

**Built (Phase 1 — matching + profile UI, no email/cron):**
- `supabase/migrations/0001_job_matching.sql` — `job_postings` + `user_job_matches` tables, RLS policies. **Needs to be run manually** in the Supabase SQL editor; nothing in this codebase can execute DDL against your project automatically.
- `lib/companies.ts` — the curated Greenhouse company list.
- `lib/job-postings.ts` — ingestion: fetches each company's board, filters to CS/SWE intern + new-grad titles via regex, tags matched postings with a tech-tag vocabulary derived from the full job description.
- `lib/job-matching.ts` — matching: pulls structured facts for the user's 3 most recently updated repos (reusing `fetchRepoContext`, the same function full repo scans use), shortlists postings by tech-tag overlap, then reranks + explains the top 3 via the existing OpenAI client pattern from `lib/prompt.ts`, with the same "never invent fit" constraint the resume-bullet prompt already enforces.
- `app/api/jobs/refresh` (POST, `x-refresh-secret` header against `JOB_REFRESH_SECRET`) — runs ingestion, upserts postings, deactivates anything not seen in the latest refresh. **Manually triggered for now** — there is no cron calling this yet.
- `app/api/jobs/matches` (GET, authenticated) — returns today's cached matches if they exist, otherwise computes them on the user's request and caches the result in `user_job_matches` for the rest of the day.
- `app/profile/page.tsx` `view === 'jobs'` now renders real match cards (title, company, location, tech tags, one-line match reason, "matched from `<repo>`", Apply link) instead of the waitlist stub. `JobsWaitlistForm` and its `/api/waitlist` capture path were removed since they're superseded — the feature is live, not a waitlist anymore.

**Deferred (Phase 2 — needs your input to start):**
- Vercel Cron wiring for `/api/jobs/refresh` (posting refresh) and a daily per-user match/email job.
- Resend integration + verified sending domain + email templates with a working unsubscribe link (legally required for recurring bulk email).
- `user_email_prefs` table + the opt-in toggle on the profile page (§10 — off by default).
- Fixed-vs-per-user timezone decision for "noon" once email exists to make it matter.

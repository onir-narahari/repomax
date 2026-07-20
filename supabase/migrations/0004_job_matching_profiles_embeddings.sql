-- Job matching rebuild: committed candidate profiles (per-repo skill
-- extraction + embedding), job posting embeddings, and a per-user seen-jobs
-- ledger for daily freshness. See docs/prd-job-matching.md §13.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists vector;

-- One row per user: the singular onboarding/profile state.
create table if not exists user_job_profile (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  onboarded_at  timestamptz,
  updated_at    timestamptz not null default now(),
  status        text not null default 'active' check (status in ('active', 'needs_reonboarding'))
);

alter table user_job_profile enable row level security;

-- Read-only for the authenticated user — writes go through the service role
-- (the profile-build API route), never directly from the client, so a
-- profile is always produced by the LLM-distillation pipeline, not a raw
-- client write.
drop policy if exists "user_job_profile_own_rw" on user_job_profile;
drop policy if exists "user_job_profile_own_read" on user_job_profile;
create policy "user_job_profile_own_read" on user_job_profile
  for select using (auth.uid() = user_id);

-- One row per committed repo per user — what matching cosines against.
-- Recomputed only when the user edits their repo set (not on a schedule).
create table if not exists user_job_profile_repos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  repo_full_name  text not null,
  repo_name       text not null,
  pinned          boolean not null default false,
  skills          jsonb,
  profile_text    text,
  embedding       vector(1536),
  updated_at      timestamptz not null default now(),
  unique (user_id, repo_full_name)
);

create index if not exists user_job_profile_repos_user_idx on user_job_profile_repos (user_id);

alter table user_job_profile_repos enable row level security;

-- Read-only for the authenticated user, same reasoning as user_job_profile
-- above — writes only via the service-role profile-build route.
drop policy if exists "user_job_profile_repos_own_rw" on user_job_profile_repos;
drop policy if exists "user_job_profile_repos_own_read" on user_job_profile_repos;
create policy "user_job_profile_repos_own_read" on user_job_profile_repos
  for select using (auth.uid() = user_id);

-- Job postings get an embedding once at ingest, shared across all users —
-- never recomputed per-user.
alter table job_postings add column if not exists embedding vector(1536);

-- Append-only freshness memory: a posting shown to a user is never shown
-- again. Insert-only from the match pipeline; no update/delete policy needed.
create table if not exists user_job_seen (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  job_posting_id   uuid not null references job_postings (id) on delete cascade,
  first_shown_at   timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

create index if not exists user_job_seen_user_idx on user_job_seen (user_id);

alter table user_job_seen enable row level security;

drop policy if exists "user_job_seen_own_read" on user_job_seen;
create policy "user_job_seen_own_read" on user_job_seen
  for select using (auth.uid() = user_id);

-- Note: user_job_repo_overrides and user_job_repo_status are superseded by
-- user_job_profile_repos and are no longer written to by new code, but are
-- deliberately NOT dropped here — dropping is one-way and these may still
-- hold data worth keeping. Drop them later in a separate migration once
-- confirmed unused, not as part of this one.

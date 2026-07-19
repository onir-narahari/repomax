-- Job matching revamp: per-user repo overrides, and raising the match cap
-- from 3 to 5 (see docs/prd-job-matching-revamp.md).
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists user_job_repo_overrides (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  repo_full_name text not null,              -- e.g. 'octocat/hello-world'
  position       int not null,               -- display/priority order among overrides
  created_at     timestamptz not null default now(),
  unique (user_id, repo_full_name)
);

create index if not exists user_job_repo_overrides_user_idx on user_job_repo_overrides (user_id);

alter table user_job_repo_overrides enable row level security;

drop policy if exists "user_job_repo_overrides_own_rw" on user_job_repo_overrides;
create policy "user_job_repo_overrides_own_rw" on user_job_repo_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Total matches shown per user is moving from a fixed 3 to a 4-5 cap
-- (quality-gated, so not every rank is guaranteed to be filled).
alter table user_job_matches drop constraint if exists user_job_matches_match_rank_check;
alter table user_job_matches add constraint user_job_matches_match_rank_check
  check (match_rank between 1 and 5);

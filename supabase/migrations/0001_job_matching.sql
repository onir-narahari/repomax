-- Job matching feature: curated job postings + per-user daily matches.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists job_postings (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,              -- e.g. 'greenhouse:stripe'
  external_id   text not null,              -- job id from the source, for dedupe
  title         text not null,
  company       text not null,
  location      text,
  absolute_url  text not null,
  tech_tags     text[] not null default '{}',
  posted_at     timestamptz,
  is_active     boolean not null default true,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists job_postings_active_idx on job_postings (is_active) where is_active;
create index if not exists job_postings_tech_tags_idx on job_postings using gin (tech_tags);

create table if not exists user_job_matches (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  job_posting_id     uuid not null references job_postings (id) on delete cascade,
  matched_repo_name  text not null,
  match_reason       text not null,
  match_rank         int not null check (match_rank between 1 and 3),
  match_date         date not null default current_date,
  emailed_at         timestamptz,
  created_at         timestamptz not null default now(),
  unique (user_id, match_date, match_rank)
);

create index if not exists user_job_matches_user_date_idx on user_job_matches (user_id, match_date);

alter table job_postings enable row level security;
alter table user_job_matches enable row level security;

-- job_postings: readable by anyone (no sensitive data), writable only by the
-- service role (used from the server-side ingestion route, which bypasses RLS
-- anyway — these policies just make the intent explicit and block anon writes).
drop policy if exists "job_postings_public_read" on job_postings;
create policy "job_postings_public_read" on job_postings
  for select using (true);

-- user_job_matches: a user can only ever see their own matches.
drop policy if exists "user_job_matches_own_read" on user_job_matches;
create policy "user_job_matches_own_read" on user_job_matches
  for select using (auth.uid() = user_id);

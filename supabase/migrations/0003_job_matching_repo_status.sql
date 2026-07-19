-- Job matching: persist per-repo fetch status alongside the daily match
-- cache, so a same-day cache-hit reload can distinguish "fetched fine, no
-- strong match" from "GitHub fetch actually failed" instead of always
-- reporting 'ok'. Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists user_job_repo_status (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  match_date  date not null default current_date,
  repo_name   text not null,
  fetch_status text not null check (fetch_status in ('ok', 'failed')),
  created_at  timestamptz not null default now(),
  unique (user_id, match_date, repo_name)
);

create index if not exists user_job_repo_status_user_date_idx on user_job_repo_status (user_id, match_date);

alter table user_job_repo_status enable row level security;

drop policy if exists "user_job_repo_status_own_read" on user_job_repo_status;
create policy "user_job_repo_status_own_read" on user_job_repo_status
  for select using (auth.uid() = user_id);

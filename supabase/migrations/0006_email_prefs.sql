-- Daily job digest email: per-user delivery preferences + unsubscribe.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

-- One row per user, created lazily the first time we email them (the digest
-- worker upserts before sending). Absence of a row therefore means "never
-- emailed yet", not "unsubscribed" — the worker treats a missing row as
-- subscribed and creates it, which is also what mints the unsubscribe token.
create table if not exists user_email_prefs (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  daily_jobs_email   boolean not null default true,
  -- Capability token in the unsubscribe link. Unguessable so the one-click
  -- URL works without a login session (email clients follow it with no
  -- cookies), and scoped to this one action so leaking it can't do anything
  -- but stop the digest.
  unsubscribe_token  uuid not null default gen_random_uuid(),
  unsubscribed_at    timestamptz,
  created_at         timestamptz not null default now(),
  unique (unsubscribe_token)
);

alter table user_email_prefs enable row level security;

-- Read-only for the authenticated user. Writes go through the service role
-- (digest worker + unsubscribe route) so the token can never be reassigned
-- from the client.
drop policy if exists "user_email_prefs_own_read" on user_email_prefs;
create policy "user_email_prefs_own_read" on user_email_prefs
  for select using (auth.uid() = user_id);

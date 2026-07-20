-- Matching engine (issue #16): user_job_matches needs a confidence column
-- to persist the GPT-4o rerank step's calibrated 0-100 score. docs/prd-job-matching.md
-- §13 lists `confidence` as part of user_job_matches' data model, but
-- migrations 0001-0004 never actually added the column. Nullable — rows
-- written by any path that doesn't compute a confidence simply leave it
-- unset. Run this in the Supabase SQL editor (Project > SQL Editor > New query).

alter table user_job_matches add column if not exists confidence numeric;

-- Guard against a future write accidentally persisting a raw
-- similarity-style value or an out-of-range number — this column only ever
-- holds the rerank step's calibrated 0-100 confidence (see
-- lib/matching-engine.ts), never a raw cosine similarity.
alter table user_job_matches drop constraint if exists user_job_matches_confidence_check;
alter table user_job_matches add constraint user_job_matches_confidence_check
  check (confidence is null or (confidence >= 0 and confidence <= 100));

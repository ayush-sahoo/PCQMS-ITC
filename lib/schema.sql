-- PCQMS-ITC database schema (Postgres / Supabase)
-- Mirrors the original Apps Script "FLAuthenticationlist" + batch-record model.

-- Users (exact replica of the original: plaintext credentials).
create table if not exists app_users (
  username text primary key,
  password text not null
);

-- One row per batch. Prep data is written on preparation submit; in-process
-- data + closed status is written on the in-process sign-off.
create table if not exists batches (
  id             text primary key,            -- Batch Identification, e.g. "FLA011125-01"
  factory_code   text,
  shift          text,
  mix_number     text,
  batch_date     date,                         -- used for report date-range queries
  status         text not null default 'active', -- 'active' | 'closed'
  prep_data      jsonb,                        -- full batchData incl Totals
  inprocess_data jsonb,
  created_by     text,
  created_at     timestamptz not null default now(),
  closed_by      text,
  closed_at      timestamptz
);

create index if not exists batches_batch_date_idx on batches (batch_date);
create index if not exists batches_status_idx on batches (status);

-- Seed the default login (admin / admin), matching the original app.
insert into app_users (username, password)
values ('admin', 'admin')
on conflict (username) do nothing;

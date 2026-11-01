# PCQMS-ITC

Process & Chapati Quality Management System — a faithful rebuild of the original
Google Apps Script "PCQMS App" as a **Next.js** application on **Vercel**, backed
by a real **Supabase (Postgres)** database.

It replicates the original 1:1: the same login screen, the same mobile UI with
four themes, and the same three tabs — **Batch Preparation Record**, **Batch In
Process Check**, and **Reports** — including the blending stopwatches with
alarms, the blast-freezer timer, the 10-pack average-weight modal, sensory
auto-scoring, totals math, auto-generated Batch IDs with duplicate detection,
and View / PDF / CSV report export with the identical column layout.

## Architecture

```
app/
  layout.js              Root layout (loads Tailwind Play CDN + custom CSS)
  page.js                Renders the app
  PcqmsApp.jsx           The full UI (client component, ported 1:1 from the original React app)
  api/
    login/route.js            POST  -> validates against app_users
    batches/ids/route.js      GET   -> all batch ids (duplicate detection)
    batches/active/route.js   GET   -> active (not-yet-closed) batches
    batches/prep/route.js     POST  -> submit a Batch Preparation Record
    batches/inprocess/route.js POST -> submit In-Process checks, close the batch
    reports/route.js          GET   -> batches within a date range (prep + in-process)
lib/
  supabase.js            Server-side Supabase client
  schema.sql             Database schema + seed (reference copy)
```

The frontend is a near-verbatim port of the original in-browser React app; the
only change is that each `google.script.run.<fn>()` call is now a `fetch()` to
the matching API route. The API routes replace the Apps Script server functions
(`processLogin`, `processGetAllBatchIds`, `processGetActiveBatches`,
`processBatchSubmit`, `processInProcessSubmit`, `processGetReportsForDateRange`).

## Data model

- **app_users** — `username` (PK), `password`. Seeded with `admin` / `admin`.
  Like the original, credentials are stored in plain text.
- **batches** — one row per batch: `id` (e.g. `FLA011125-01`), `factory_code`,
  `shift`, `mix_number`, `batch_date`, `status` (`active` | `closed`),
  `prep_data` (jsonb), `inprocess_data` (jsonb), and audit columns.

## Environment variables

Set these on Vercel (and in a local `.env.local` for development):

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (recommended for production) |
| `SUPABASE_ANON_KEY` | Anon key — used if the service-role key is not set |

Only one key is required. The tables are created with RLS disabled, so the anon
key works; for stricter production security, use the service-role key and enable
RLS so only the server can reach the tables.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + key
npm run dev
```

Open http://localhost:3000 and log in with `admin` / `admin`.

## Database setup

If you are pointing at a fresh Supabase project, run `lib/schema.sql` in the
Supabase SQL editor (or apply it as a migration) to create the tables and seed
the default user.

## Deploy

Pushed to Vercel from this repository. Set the three environment variables above
in the Vercel project settings, then deploy. The default login is
`admin` / `admin` — change it (or add users) via the `app_users` table.

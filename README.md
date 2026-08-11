# Shapers Church App

Cross-platform church management app. See [docs/](docs/) for the full
design: [architecture](docs/shapers-church-app-architecture.md), the
[developer handoff](docs/shapers-developer-handoff.md) (build order, API
contracts), and the [reference schema](docs/schema.sql).

Currently implemented: **Phase 1 — Identity & tenancy** (see handoff doc
Section 4). Auth, onboarding (join church by invite code, match/create
person), and a `/me`-equivalent dashboard, on both web and mobile.

## Repo layout

```
/apps/web        Next.js app
/apps/mobile     Expo app
/packages/ui           shared React Native / RN-Web components
/packages/api-client    typed Supabase queries + RPC calls, shared by both apps
/packages/types         hand-written Database types (see note in database.ts)
/supabase/migrations     ordered SQL migrations, one phase at a time
/docs                    the design docs this repo is built from
```

## Setup

### 1. Supabase project

You said you already have a Supabase project. You'll need the Supabase CLI
linked to it:

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
```

Then push the Phase 1 migrations:

```bash
pnpm dlx supabase db push
```

This creates `church`, `household`, `person`, `app_user`, `role_assignment`,
RLS policies, and the `find_church_by_invite_code` / `onboard_match_person`
onboarding functions.

To develop against a local Postgres instead (requires Docker):

```bash
pnpm dlx supabase start   # spins up local Postgres + Studio, applies migrations
```

### 2. Environment variables

Copy the example env files and fill in your project's URL + anon key
(Supabase dashboard → Project Settings → API):

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Never commit the filled-in `.env.local` / `.env` files or the
`service_role` key anywhere in this repo — only the anon key belongs on
the client.

### 3. Install & run

```bash
pnpm install
pnpm dev:web       # http://localhost:3000
pnpm dev:mobile    # Expo dev server — press w/i/a for web/iOS/Android
```

### 4. Create a test church

Since `church` rows aren't self-serve yet, insert one manually (Supabase
Studio → SQL editor, or `psql`) to get an invite code to test onboarding
with:

```sql
insert into church (name) values ('Test Church') returning invite_code;
```

## Notes on deviations from the original docs

Building the onboarding flow surfaced two gaps between `docs/schema.sql`
(the original design) and what's actually runnable — both fixed in the
Phase 1 migrations, not in the reference doc, so the design history stays
visible in `supabase/migrations/`:

- **`church.invite_code`** — the handoff doc's `POST
  /onboarding/join-church { church_invite_code }` endpoint needs a code to
  look up, but `church` had no such column. Added `invite_code` (auto
  generated, unique).
- **`person.email` / `person.phone`** — `POST /onboarding/match-person`
  matches a new signup to an existing PC-synced person "by phone/email,"
  but only `app_user` (the login, created *after* a match) had those
  fields. Added nullable `email`/`phone` to `person`, populated by the PC
  sync going forward, used only for matching.
- **`app_user.id`** — the original schema noted in a comment that it
  "matches Supabase auth.users.id" but didn't actually foreign-key it.
  Migrated it to `references auth.users(id)` so it's enforced, not just
  documented.

## What's next

Phase 2 (check-in) per the handoff doc's build order — highest priority
since it's child-safety critical, and deliberately built in isolation
before Phase 3+.

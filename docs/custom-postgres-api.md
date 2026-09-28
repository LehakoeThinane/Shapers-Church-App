# Custom PostgreSQL API migration

The custom API is a staged migration away from Supabase, not a parallel
production backend. Existing web and mobile screens still use Supabase until
their matching API endpoints are migrated and verified.

## Current foundation

`apps/api` provides a Fastify service with PostgreSQL migrations, JWT auth,
bcrypt password hashing, validated signup/login inputs, tenant-bound tokens,
and a protected `/me` endpoint. It does not call Supabase.

## Local startup

1. Copy `apps/api/.env.example` to `apps/api/.env` and replace the JWT secret
   with a unique value of at least 32 characters.
2. Start Postgres:

   ```powershell
   docker compose -f docker-compose.postgres.yml up -d
   ```

3. Apply the custom schema:

   ```powershell
   pnpm --filter api db:migrate
   ```

4. Start the API:

   ```powershell
   pnpm dev:api
   ```

It listens at `http://localhost:4000`; `GET /health` confirms availability.

## First administrator

After migrations, call `POST /internal/bootstrap` exactly once with the
separate `BOOTSTRAP_TOKEN`, church name/slug, and administrator credentials.
It creates the first church and assigns its first account the admin role.
The route permanently rejects requests after any church exists.

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/web/.env.local`
after migrating the public content, sermons, events, and approved testimonies
to Postgres. This moves only `/new-here/:slug` and its sermons/stories pages
to the custom API; signed-in screens remain on the existing backend until
their own endpoint migration is complete.

## Migration order

1. Deploy and monitor this identity API separately.
2. Move web/mobile auth and `/me` to it, with end-to-end tests.
3. Port one domain at a time (check-in first requires dedicated security
   review), preserving the server-side tenant checks currently in RLS.
4. Only retire the equivalent Supabase path after data backfill, dual-read
   verification, and rollback planning.

Never point the existing production clients at this API until their endpoints
have been implemented and tested; partial migration would break live users.

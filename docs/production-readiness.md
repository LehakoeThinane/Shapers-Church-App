# Production readiness

Use this checklist for every release. A feature is not complete until its real
data path, database policies, and failure states have all been verified.

- Apply migrations in numeric order to a non-production environment first.
- Verify each new table has RLS enabled and attempt cross-church reads and
  writes using two test accounts before production deployment.
- Exercise loading, empty, unauthorised, and failed-write states in both web
  and mobile clients.
- Confirm external integrations use live sandbox/production credentials and
  expose failures rather than returning synthetic success.
- Run `pnpm typecheck`, relevant tests, and `git diff --check` before review.
- Record the migration identifiers and verification evidence in the release PR.

## Current Purpose Journey migration order

1. `20260922090000_public_guest_access.sql`
2. `20260922090001_sermons.sql`
3. `20260922090002_growth_track.sql`
4. `20260922090003_testimony.sql`

These migrations are additive. Apply the accompanying seed only in local or
explicitly approved non-production environments; it is not a production
content publishing workflow.

# Shapers Church App — Developer Handoff

*Companion to `shapers-church-app-architecture.md` (the "why") and `schema.sql`
(the runnable schema). This document is the "what to build and in what order."*

---

## 1. Stack summary

- **Mobile**: React Native (Expo)
- **Web**: Next.js (React Native Web for shared components)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Hosting region**: Frankfurt (`eu-central-1`) — nearest available to South Africa; no Africa region exists yet. Confirm with legal/compliance before final commit (see architecture doc, Section 8).
- **Push notifications**: Expo push service (mobile), browser push (web)
- **External integration**: Planning Center (Check-Ins, People) via OAuth per church

---

## 2. Repo structure

```
/apps
  /mobile              — Expo app
  /web                 — Next.js app
/packages
  /ui                  — shared component library (used by both apps)
  /api-client           — typed fetch/query layer, shared by both apps
  /types                — shared TypeScript types (generated from schema.sql)
/supabase
  /migrations           — numbered SQL migrations (schema.sql split into ordered files)
  /functions
    /pc-checkin-sync     — writes check-ins to Planning Center
    /pc-milestone-sync   — writes milestones to Planning Center People
    /pc-health-check     — scheduled job, checks each church_integration's token
    /qr-token-generate    — weekly job, generates checkin_tag rows
/docs
  shapers-church-app-architecture.md
  shapers-developer-handoff.md
  schema.sql
```

**Why this shape**: `packages/` exists so mobile and web never diverge on business logic — a bug fix in `api-client` fixes both platforms at once. `supabase/functions` holds every background job as its own deployable unit, matching the "integration versioning" convention from the architecture doc (each provider gets its own folder, so a Planning Center API change doesn't ripple sideways).

---

## 3. API endpoint contracts

All endpoints are church-scoped: the authenticated JWT carries `church_id`, and every query is filtered by it at the database layer via RLS — the API layer doesn't need to re-implement tenant isolation, just pass the authenticated context through.

### Auth & onboarding
```
POST   /auth/signup                  { email | phone, password }
POST   /auth/login                   { email | phone, password }
POST   /onboarding/join-church       { church_invite_code }
POST   /onboarding/match-person      { first_name, last_name, phone|email }
                                      → matches to existing PC-synced person, or flags for staff review
```

### People & households
```
GET    /me                           → current person + household + role assignments
GET    /households/:id               → household + members (read-only, synced from PC)
GET    /people/:id                   → single person (scoped by permissions matrix)
```

### Check-in
```
GET    /checkin-tags/me              → this week's QR tokens for my children
POST   /checkin/scan                 { qr_token }             → creates checkin, writes to PC
POST   /checkin/:id/pickup           { qr_token }              → verifies match, marks checked_out_at
GET    /checkin/status/:person_id    → current check-in status (kids' staff / guardian only)
```

### Groups (circuits, cells, departments, committees)
```
GET    /groups                       ?type=cell|circuit|department|committee
GET    /groups/:id                   → group detail + members
GET    /groups/:id/members
POST   /groups/:id/meetings          { meeting_date, location }
POST   /meetings/:id/attendance      { person_id, present }[]
POST   /meetings/:id/report          { attendance_count, offering_amount, testimonies }
GET    /circuits/:id/reports         → aggregated reports across all cells in a circuit (circuit_leader+ only)
```

### Courses, quizzes & milestones
```
GET    /courses                      ?type=sermon_series|program
GET    /courses/:id                  → course + lessons
POST   /lessons/:id/complete         { quiz_score? }           → writes person_progress
                                                                  triggers milestone check if course fully complete
GET    /people/:id/milestones
```

### Announcements, events, prayer
```
GET    /announcements
POST   /announcements                 (admin only)
GET    /events                       ?upcoming=true
POST   /events/:id/rsvp              { status }
POST   /prayer-requests              { request_text, is_anonymous }
GET    /prayer-requests              (moderated view — admin only sees unapproved)
PATCH  /prayer-requests/:id/approve  (admin only)
```

### Notifications
```
GET    /notifications                ?unread=true
PATCH  /notifications/:id/read
GET    /notification-preferences
PATCH  /notification-preferences     { notification_type, push_enabled }
```

### Admin / integrations
```
GET    /admin/integrations           → connection status per provider
POST   /admin/integrations/connect   { provider, oauth_code }
GET    /admin/sync-failures          → failed-sync dashboard (checkin, milestone, etc.)
POST   /admin/sync-failures/:id/retry
GET    /admin/audit-log              ?entity_type=&actor_person_id=&from=&to=
```

---

## 4. Build order

Each phase assumes the previous one is functional — don't start Phase 3 group reporting UI before Phase 1's role/permission model actually gates anything, or you'll build screens against a security model that doesn't exist yet.

**Phase 0 — Infrastructure**
Supabase project provisioned (Frankfurt region), CI/CD pipeline, environment config for both apps, base RLS pattern applied to every table.

**Phase 1 — Identity & tenancy**
`church`, `person`, `household` (read-only stub sync), `app_user`, `role_assignment`. Auth flows (signup, login, onboarding match-to-PC-person). This is the foundation everything else depends on — nothing in later phases works without correct tenant scoping and role assignment.

**Phase 2 — Check-in**
`checkin`, `checkin_tag`, the weekly QR generation job, the Planning Center check-in write-back function, scan/pickup screens. This is the highest-stakes feature (child safety) — build and test it in isolation before layering anything else on top.

**Phase 3 — Groups**
`ministry_group`, `group_member`, `group_meeting`, `group_attendance`, `group_report`. Cell/circuit/department directory screens, meeting logging, exception-based reporting alerts.

**Phase 4 — Courses & milestones**
`course`, `lesson`, `quiz`, `person_progress`, `person_milestone`, the milestone Planning Center write-back function. Can be built in parallel with Phase 3 once Phase 1 is stable, since they don't depend on groups.

**Phase 5 — Announcements, events, prayer**
`announcement`, `event`, `event_rsvp`, `prayer_request`. Lower risk, can parallelize with Phase 3/4.

**Phase 6 — Notifications**
`notification`, `notification_preference`, Expo push integration, exception-triggered alerts wired to Phase 3's reporting and Phase 4's milestones.

**Phase 7 — Operational reliability**
`audit_log` wired into every sensitive action from prior phases, the failed-sync dashboard, per-tenant health checks on `church_integration`. This phase retrofits observability across everything already built — expect it to touch code in every prior phase, which is normal and why it's sequenced last rather than attempted alongside each feature.

---

## 5. Notes for whoever picks this up

- Read `shapers-church-app-architecture.md` first — it explains *why* households are read-only, why groups got generalized, and why Planning Center owns check-in validation. Building against this schema without that context risks "fixing" a deliberate design choice by accident.
- The RLS pattern in `schema.sql` is shown once — apply the same shape to every table, then layer permission-specific policies from the matrix in the architecture doc (Section 6).
- `ministry_group` and `app_user` are named to avoid Postgres reserved words (`group`, `user`) — don't rename them back.

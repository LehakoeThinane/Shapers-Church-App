# Shapers Church App — Architecture & Design Overview

*Living document — reflects all architecture decisions made through the design phase.*

---

## 1. Platform & tech approach

- **Cross-platform from day one**: React Native (Expo) for mobile, React Native Web / Next.js for the browser, sharing one UI component library and business logic layer. One codebase, not three.
- **Multi-tenant from day one**: every table carries a `church_id`. One deployment serves every church — a new church signing up requires no schema changes, just a new `church` row.
- **Recommended backend**: Supabase (Postgres + auth + storage + realtime), using row-level security policies to enforce tenant isolation and role permissions directly at the database layer, not just in app code.

**Layer stack:**
```
Mobile app (Expo) + Web app (Next.js)
        ↓
Shared UI & business logic (design system, API client, state)
        ↓
API & auth layer (tenant-scoped REST/GraphQL)
        ↓
Multi-tenant database (Postgres, church_id on every row)
```

---

## 2. Core identity model

- **`person`** is the universal record for any human — adult or child, logged in or not. This is the anchor entity everything else attaches to.
- **`user`** is a *login*, linked to a `person`. Not every person has one (children don't).
- **`household`** groups people into families. **Read-only, synced from Planning Center** — not self-managed in-app. Reasoning: household membership determines custody/pickup rights for kids' check-in, and PC's own security-tag process already requires churches to keep this accurate. Making it read-only avoids a second place this data can drift or be falsified, with no added admin burden since staff already maintain it in PC.

---

## 3. Groups (circuits, cells, departments, committees — unified)

Originally modeled as separate structures, then generalized into one polymorphic `group` table once it became clear cells, circuits, departments, and committees all need the same shape: membership, meetings, attendance, and reports.

- `group` — has a `group_type` (`circuit`, `cell`, `department`, `committee`, etc.) and an optional `parent_group_id` for nesting (a cell under a circuit, a committee under a department).
- `group_member` — links `person` to `group`, with a `role` (leader/assistant/member) and an `is_primary` flag (someone's main department vs. a secondary committee seat).
- `group_meeting` → `group_attendance` → `group_report` — meeting-level tracking, rolling up into reports (attendance count, offering, testimonies/notes) for leadership visibility.

**Reporting philosophy**: routine reports land quietly in dashboards. Only defined exceptions (zero attendance, unusual offering drop, a testimony flagged for follow-up) trigger a push notification — minimizing admin overhead on both the reporting and reviewing side.

**Scope decision**: department/committee *chat and full group browsing* is being pushed to **Planning Center Groups + PC Chat** rather than rebuilt in-app, since PC already covers this well (attendance, communication, resource sharing). The app may still read a lightweight summary of someone's department for display purposes.

---

## 4. Check-in (Planning Center Check-Ins integration)

Kids' check-in is safety-critical (custody, security tags) and already solved by Planning Center — **not rebuilt**, integrated.

- Per-church OAuth credentials stored in `church_integration` (encrypted token per church, since each church has its own PC account).
- **Tags: rotating weekly QR codes** (decided). Each week the app generates a fresh, signed QR token per child in `checkin_tag` (`person_id`, `week_start_date`, `qr_token`, `expires_at`). Parents view it in-app or print it themselves — no dedicated label printer or kiosk hardware required, since the code isn't generated per-instance in real time. Staff scan at drop-off (writes the check-in to PC, which validates custody/authorized-pickup rules and returns a security code) and scan again at pickup to confirm the match. Old screenshots/printouts stop working automatically once the week rolls over.
- PC remains the system of record; the app is an additional client into it, not a replacement.

---

## 5. Courses, quizzes & milestones

Handles both **sermon series companion content** (informal, no gating) and **formal programs** (membership, baptism classes — gated), using one schema:

- `course` — has a `course_type` and an optional `unlocks_milestone` field. Left empty for casual content; set (e.g. `"baptism"`) for formal programs.
- `lesson` → optional `quiz` → `quiz_question` — ordered content with optional graded quizzes.
- `person_progress` — tracks completion per person, per lesson.
- `person_milestone` — generic achievement record (`milestone_type`, `achieved_at`, optional `source_course_id`). Not hardcoded to baptism/membership — any future milestone (confirmation, ordination, dedication) is just a new value, and staff can backfill historical milestones manually without a course.

**Write-back decision**: completing a course that unlocks a milestone triggers a sync-worker write to Planning Center's People module, keeping PC as the source of truth for official membership/baptism status — same reasoning and same integration pattern as check-in. Two open implementation details:
- Failed writes need a `sync_status` field (`pending`/`synced`/`failed`) so staff can catch and retry failures rather than the app and PC silently disagreeing.
- The sync likely needs to become **two-way**: if staff update someone's status directly in PC, the app should periodically pull that back so its own display doesn't go stale.

---

## 6. Roles & permissions

Roles are **not exclusive** — a person can hold multiple role assignments at once (e.g. guardian *and* cell leader), each scoped to a specific circuit/cell/household. Modeled as a `role_assignment` table (`person_id`, `role`, `scope_type`, `scope_id`) rather than a single role column.

| Feature | Admin | Circuit leader | Cell leader | Kids' staff | Guardian | Member |
|---|---|---|---|---|---|---|
| Household/person data | All (view) | None | None | Own child, check-in only | Own household only | Own profile only |
| Check-in (create) | All | None | None | Any child, church-wide | Own children only | None |
| Group membership & reports | All | Own circuit's groups | Own group only | None | None | Own group (if member) |
| Group reports (submit) | — | — | Own group only | — | — | — |
| Group reports (view) | All | Own circuit only | Own group only | None | None | None |
| Announcements (create) | Yes | No | No | No | No | No |
| Events (RSVP) | Yes | Yes | Yes | Yes | Yes | Yes |
| Prayer requests (submit) | Yes | Yes | Yes | Yes | Yes | Yes |
| Prayer requests (moderate) | Yes | No | No | No | No | No |
| Integrations settings | Yes | No | No | No | No | No |

A circuit leader still holds a personal `group_member` row in one specific cell (their own fellowship), separate from their `role_assignment` as circuit leader (their oversight scope). These don't conflict — different tables, different questions.

This matrix maps closely onto Postgres row-level security policies: each row here becomes roughly one RLS policy per table.

---

## 7. What's built into the app vs. pushed to Planning Center

**Built in-app:**
- Cross-platform client + multi-tenant backend
- Person/household display (read-only sync)
- Check-in write-back
- Circuits/cells/departments/committees (generalized group model)
- Courses, quizzes, milestones (with PC write-back)
- Roles & permissions
- Announcements, events, prayer wall (MVP basics — not yet deep-designed)

**Deliberately pushed to Planning Center rather than rebuilt:**
- Household/custody management (source of truth, read-only sync)
- Kids' check-in validation logic
- Department/committee chat and full group browsing (PC Groups + PC Chat)
- Class/event signup and payment (PC Registrations)
- Official membership/baptism status (PC People, app writes into it)

**Explicitly deferred / not yet in scope:**
- Giving/donations (payment compliance weight — Stripe Connect, PCI scope)
- Full media/livestream hosting (embed links instead, e.g. YouTube/Vimeo)
- In-app chat (use PC Chat instead)

---

## 8. Decisions resolved

- **Check-in tags**: rotating weekly QR codes, in-app or self-printed. No dedicated printer hardware required. See Section 4.
- **Notification mechanism**: Expo push (mobile) + browser push fallback (web), backed by an in-app inbox so nothing is lost if push fails. `notification` table (recipient, type, payload, read status) + `notification_preference` table (per person, per notification type) — one system, reused for exception alerts, announcements, and any future notification type.
- **Onboarding flow**: sign up → find/join church → match to existing Planning Center `person` record (by phone/email or staff invite code) → household/cell/department memberships populate automatically from synced data → default role `member`. Unmatched signups are flagged for staff to link manually — the one deliberate human-in-the-loop step, kept for safety (prevents self-attaching to a household).
- **Data privacy/compliance (POPIA)**: registered Information Officer required; Section 34 requires guardian consent for processing a child's personal information, which is consistent with sourcing household/custody data from Planning Center rather than self-declaration; encryption at rest/in transit (Supabase default); defined retention period; documented access/correction/deletion process; breach notification procedure.
- **Deployment/hosting**: Supabase, confirmed. Caveat: no Africa region currently exists; nearest is Frankfurt, which adds real latency and is a legal question worth raising with compliance counsel (cross-border transfer to a GDPR-regime region may satisfy POPIA's "adequate protection" test, but that determination isn't a technical one).
- **Sync worker, generalized two-way**: `sync_field_map` config table (`provider`, `local_table`, `local_field`, `remote_field`, `direction`) — any future two-way field is a new config row, not new code.

## 9. Remaining church policy calls (not technical)

- **Circuit leader's personal cell assignment**: keep their prior cell (default recommendation) vs. a dedicated leaders' cell — schema supports either; needs a decision from church leadership, not engineering.

---

## 10. Operational reliability

For a platform handling children's safety data, custody, and financial reports, "does it work" isn't enough — the system needs to make its own failures visible rather than relying on someone noticing something's wrong.

- **Audit log**: one generic `audit_log` table (`id`, `church_id`, `actor_person_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`). Every sensitive action — check-in, household edits, role changes, milestone writes, financial report edits — writes one row. Generic by design, matching the `group`/`course` pattern: a new sensitive action later is a new `action` value, not a new table.
- **Failed-sync dashboard**: surfaces the `sync_status` field (already designed for `checkin_tag` and `person_milestone`) as an actual admin screen — every `pending`/`failed` write-back to Planning Center, with a retry action. One dashboard, reused across every synced entity.
- **Per-tenant health checks**: `church_integration` gains `last_synced_at` and `status` (`active`/`token_expired`/`error`). A scheduled job checks each church's PC connection independently, so one church's expired token surfaces on a dashboard rather than via a parent's complaint on a Sunday morning.
- **Event pattern, right-sized**: rather than a message broker, use Postgres triggers + Supabase Edge Functions — e.g. a row insert on `person_milestone` triggers a function that handles the PC sync and notification. Decouples steps (`CourseCompleted → Milestone → PC sync → Notification`) without new infrastructure to operate, appropriate for current scale. Worth revisiting if/when the platform grows to multiple engineering teams.
- **Integration versioning (folder convention)**: structure integration code as `integration/planning_center/v1/`, `mappers/`, `webhooks/` rather than one flat service. Costs nothing now, avoids a painful rewrite when Planning Center's API changes.

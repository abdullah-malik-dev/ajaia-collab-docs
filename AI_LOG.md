# AI_LOG

One line per interaction where AI output was accepted, changed, or rejected.
Format: `time | step | accepted/changed/rejected | note`

- 00:00 | setup | accepted | Claude summarised the brief and flagged the dual DB driver (PGlite dev / Neon prod) as the main risk; agreed to isolate it in one getDb() and test early.
- 00:00 | setup | accepted | Repo initialised at D:\ajaia-collab-docs with personal git identity and github-personal remote; gh CLI not installed, GitHub repo to be created manually as private.
- 00:25 | setup | changed | User asked to evaluate Supabase + built-in auth; Claude recommended keeping PGlite/Neon + mock auth (Supabase free projects pause after inactivity, real auth ~45-60 min). User kept the plan.
- 00:30 | setup | accepted | Installed gh CLI via winget; device login handed to user to complete manually in the personal account.
- 00:40 | step 1 | accepted | Next.js 14 scaffold (App Router, TS, Tailwind, src dir) committed; deps installed. npm resolved TipTap v3 (not v2) and zod v4; flagged for decision.
- 00:45 | step 1 | changed | @types/node bumped 20 -> 22 to satisfy vitest peer dep; @types/mammoth dropped (mammoth ships its own types).
- 01:15 | step 1 | accepted | DB layer: Drizzle schema, getDb() singleton (PGlite when DATABASE_URL unset, Neon otherwise), CREATE TABLE IF NOT EXISTS + seed on first use. Verified on in-memory PGlite.
- 01:25 | step 1 | accepted | Mock auth: httpOnly cookie with seeded user id, edge middleware (presence check only, 401 JSON for /api), /login page with server actions. Verified sign-in/out and redirects in browser.
- 01:25 | design | accepted | Visual direction: cool grey canvas, paper white, single Source Sans 3 family, one muted ink-blue accent, no shadowed cards. Tokens in tailwind.config.ts.
- 01:50 | step 2 | accepted | access.ts pure role rules; ServiceError -> HTTP status mapping; route() wrapper gives one JSON error shape; zod v4 schemas (title 1-200, content ~1 MB cap, baseUpdatedAt ISO).
- 01:50 | step 2 | accepted | documents service: list owned/shared with owner name, create, get-with-role (no access = 404), update with 409 conflict guarded by a conditional UPDATE, delete owner-only (403 for editors/viewers).
- 01:55 | step 2 | accepted | Dashboard: two sections, role badge, hover Rename/Delete on owned rows, empty states; verified create, rename, delete, 400/403/404/409 via browser and curl.

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
- 02:25 | step 3 | changed | TipTap v3 StarterKit already bundles Underline; dropped @tiptap/extension-underline and disabled link/strike/code/blockquote/hr so the content model matches the toolbar. Added Placeholder.
- 02:25 | step 3 | accepted | useAutosave: 800 ms debounce, one request in flight, pending edits saved in a follow-up, 409 -> conflict state blocks further saves until "Reload latest"; beforeunload warning while unsaved.
- 02:30 | step 3 | accepted | Verified in browser: typing -> Saving -> Saved and persisted; Alice's API rename made Bob's next save 409 with banner; Reload latest pulled her title and discarded stale text; Carol sees View only. Fixed focus ring on editor body.
- 02:50 | step 4 | accepted | shares service (owner-only list/add/remove, upsert on re-share, unknown email -> 404 with hint, self-share -> 400), routes under /api/documents/[id]/shares, native <dialog> Share UI. Verified: editor/viewer get 403, downgrading Bob to viewer makes his PATCH 403, removing Carol makes her GET 404.
- 03:10 | step 5 | accepted | Import: extension-based type detection, txt -> escaped paragraphs with <br>, md -> marked (gfm), docx -> mammoth, then generateJSON with the editor's own StarterKit config (moved to lib/editor-extensions.ts so editor and importer share one schema). 415 for other types, 413 over 2 MB, both client-checked too.
- 03:12 | step 5 | changed | mammoth drops underline by default; added styleMap "u => u" after the docx fixture lost its underline mark.
- 03:30 | extra | changed | User asked for last-saved time and download/PDF. Claude pushed back on server-side PDF (30-45 min); agreed on "Saved HH:MM", Download as Markdown/HTML from the editor's current JSON, and Print or save as PDF via the browser with a print stylesheet. Export moved off the cuts list.
- 03:35 | extra | accepted | lib/export.ts Markdown serializer (headings, nested lists, bold/italic/underline, hard breaks) checked against a fixture; Download menu closes on outside click/Escape.
- 03:50 | step 6 | accepted | Vitest: access matrix (4 roles x 4 permissions), import conversion (md nodes/marks, txt escaping and breaks, 415/413 rejections, title derivation), service flow on in-memory PGlite (Alice shares with Bob as viewer -> Bob reads, update forbidden, Carol not found; upgrade/remove/delete; 409 on stale base; JSON round-trip), Markdown export. 29 tests green on first run.

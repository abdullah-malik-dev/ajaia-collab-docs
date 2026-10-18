# AI_LOG

One line per interaction where AI output was accepted, changed, or rejected.
Format: `time | step | accepted/changed/rejected | note`

- 00:00 | setup | accepted | Claude summarised the brief and flagged the dual DB driver (PGlite dev / Neon prod) as the main risk; agreed to isolate it in one getDb() and test early.
- 00:00 | setup | accepted | Repo initialised at D:\ajaia-collab-docs with personal git identity and github-personal remote; gh CLI not installed, GitHub repo to be created manually as private.
- 00:25 | setup | changed | User asked to evaluate Supabase + built-in auth; Claude recommended keeping PGlite/Neon + mock auth (Supabase free projects pause after inactivity, real auth ~45-60 min). User kept the plan.
- 00:30 | setup | accepted | Installed gh CLI via winget; device login handed to user to complete manually in the personal account.
- 00:40 | step 1 | accepted | Next.js 14 scaffold (App Router, TS, Tailwind, src dir) committed; deps installed. npm resolved TipTap v3 (not v2) and zod v4; flagged for decision.
- 00:45 | step 1 | changed | @types/node bumped 20 -> 22 to satisfy vitest peer dep; @types/mammoth dropped (mammoth ships its own types).

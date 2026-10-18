# AI workflow

## Tools

- **Claude Code** in the Claude desktop app, model Claude Fable 5.1, used as a pair programmer for the whole session. It had a terminal, the file system, a built-in browser pane for driving the running app, and `curl` for the API.
- Claude skills installed for the UI work: `frontend-design` (loaded and followed for the visual direction), plus `impeccable`, `ui-ux-pro-max` and `ui-styling` installed for reference.
- No other AI tools. No code was copied from other projects.

## How the session ran

I set the scope, the order of steps and the time budget up front (scaffold, DB and login; dashboard; editor and autosave; sharing; import; tests; deploy; docs) and asked for small, reviewable steps with a diff and a working demo after each. Claude built each step, ran it in the browser and with `curl`, showed me the diff, and waited for my go. I made every product decision; Claude was asked to push back when I over-scoped, and did.

`AI_LOG.md` in the repository has the step-by-step record of what was accepted, changed or rejected.

## Where AI sped me up

- **Scaffolding and plumbing**: Next.js setup, Drizzle schema, the PGlite/Neon switch, zod schemas, the route wrapper with a consistent error shape. This is the work where typing speed is the bottleneck.
- **Verification loops**: after each step Claude drove the running app in its browser pane and hit the API with `curl` for every error path (400, 403, 404, 409, 413, 415) before I looked at the diff. Several things were caught this way that I would have found later: the focus ring drawn around the whole editor body, mammoth dropping underline from `.docx`, the heading of the mobile editor overflowing.
- **Tests**: the four Vitest suites were written in one pass and were green on the first run, because the services were designed around an injectable database handle from the start.
- **Documentation drafts**: these files were drafted by Claude from the session and edited by me.

## What I changed or rejected

- **Supabase with built-in auth.** I floated switching the database to Supabase and using its auth. Claude pushed back: free Supabase projects pause after inactivity (a dead live URL for the reviewer), and real auth would cost about an hour. I kept PGlite locally, Neon in production, and mock auth, and listed real auth under "what's next".
- **TipTap version.** The scope said v2; npm resolved v3. Claude recommended staying on v3 (Underline already in the StarterKit, cleaner SSR) and I agreed.
- **Export and PDF.** I asked for download and PDF after the feature freeze. Claude pushed back on a server-rendered PDF and proposed Markdown and HTML downloads plus browser print-to-PDF. I accepted that version.
- **Honest critique of the UI.** When I asked whether the UI was top notch, the answer was "clean and competent, not top notch" with a concrete list. I approved the polish pass (icon toolbar, richer formatting, links, word count, serif body for the document, loading skeletons, error page, favicon, touch-visible row actions, mobile fixes) and declined tables and images as a different tier of work. Later I asked for text alignment and highlight colours, which were added through TipTap extensions.
- **Access requests.** I asked whether viewers could request edit access like Google Docs. Claude estimated 45 to 50 minutes and recommended only documenting it; I corrected the remaining time and chose to build it, including requests from anyone holding a link. Claude flagged that the "You need access" page reveals a document exists and I accepted that trade-off.
- **Conflict handling.** I chose to discard local edits on "Reload latest" rather than attempt a merge, since a merge is real-time co-editing by another name.

## How I verified the work

- Every step was exercised in the browser as different users: sign-in and sign-out, create, rename, delete, typing with the save status visible, a forced 409 by editing as Alice through the API while Bob had the document open, "Reload latest", Carol's read-only view, the share dialog with an unknown email, import of `.md`, `.txt` and a hand-built `.docx`, and the Download menu.
- Every API error path was hit with `curl` and the responses checked.
- `npm test` (36 tests), `npm run lint`, `npx tsc --noEmit` and `npm run build` all pass.
- The production deployment was checked by signing in and editing on the live URL.

# Submission

**Candidate:** Abdullah Malik
**Role:** Full Stack Product Engineer, Ajaia
**Live URL:** LIVE_URL_PLACEHOLDER
**Repository:** https://github.com/abdullah-malik-dev/ajaia-collab-docs (private; access on request)

## Contents of this folder

| Item                | What it is                                                            |
| ------------------- | --------------------------------------------------------------------- |
| `source/`           | The repository (without `node_modules`, `.next` and `.data`)          |
| `README.md`         | Local setup, seeded users, supported file types, deploy steps         |
| `ARCHITECTURE.md`   | Priorities, data model, access model, trade-offs, what's next         |
| `AI_WORKFLOW.md`    | Tools used, where AI helped, what I changed or rejected, verification |
| `AI_LOG.md`         | One line per accepted, changed or rejected AI output, in order        |
| `SUBMISSION.md`     | This file                                                             |
| `VIDEO_URL.txt`     | Link to the walkthrough video                                         |
| `screenshots/`      | Login, dashboard, editor, share dialog, conflict banner, mobile       |

## Test accounts

No passwords. Pick a person on the login page.

| User  | Email            | On the Welcome document |
| ----- | ---------------- | ----------------------- |
| Alice | alice@ajaia.test | Owner                   |
| Bob   | bob@ajaia.test   | Editor                  |
| Carol | carol@ajaia.test | Viewer                  |

Suggested walkthrough: sign in as Alice, open Welcome, share it; in a private window sign in as Bob, edit the same document, then save from both sides to see the conflict banner; sign in as Carol to see read-only mode; import a `.md` file from the dashboard.

## Working

- Mock sign-in, dashboard with owned and shared documents, create, inline rename, delete
- Rich-text editor (headings, bold, italic, underline, strikethrough, code, links, lists, quotes, code blocks, rules, undo/redo), word count
- Autosave with status and last saved time, 409 conflict detection with "Reload latest", unsaved-changes warning
- Sharing by email as viewer or editor, role changes, removal; all rules enforced server-side
- Import of `.txt`, `.md`, `.docx` up to 2 MB as new documents; clear errors for other types and sizes
- Download as Markdown or HTML; print or save as PDF
- 29 Vitest tests; production build; deployed on Vercel with Neon Postgres

## Incomplete or simplified

- Authentication is a mock (seeded users, unsigned cookie)
- PDF export is the browser's print dialog, not a server-generated file
- On a conflict, local unsaved edits are discarded when reloading; there is no merge
- Tables, images, colours and text alignment are not supported in the editor or on import

## Deliberately cut

Real-time co-editing, comments, version history, real authentication.

## Next, with 2 to 4 more hours

Live updates and presence, real auth, Drizzle migrations, version history (snapshot per save), Playwright test for the two-user conflict flow. Details in ARCHITECTURE.md.

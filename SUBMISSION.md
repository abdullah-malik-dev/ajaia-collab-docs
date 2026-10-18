# Submission

**Candidate:** Abdullah Malik
**Role:** Full Stack Product Engineer, Ajaia
**Live URL:** https://ajaia-collab-docs-tau.vercel.app
**Repository:** https://github.com/abdullah-malik-dev/ajaia-collab-docs (private; access on request)
**Drive folder:** https://drive.google.com/drive/folders/1mLSF0J_RbFJ60g8wAjflM0TwGUBZlHa0?usp=sharing
**Walkthrough video:** https://www.loom.com/share/a622b55301934d64b372e1c5e65d8d31

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
| `screenshots/`      | Login, dashboard, editor, share dialog, conflict banner, viewer, mobile, access request |

## Test accounts

No passwords. Pick a person on the login page, or add yourself with any name and email (a known email signs you in as that person).

| User  | Email            | On the Welcome document |
| ----- | ---------------- | ----------------------- |
| Alice | alice@ajaia.test | Owner                   |
| Bob   | bob@ajaia.test   | Editor                  |
| Carol | carol@ajaia.test | Viewer                  |

Suggested walkthrough: sign in as Alice, open Welcome, share it; in a private window sign in as Bob, edit the same document, then save from both sides to see the conflict banner; sign in as Carol to see read-only mode and click "Request edit access"; back as Alice, approve it from the Share dialog; import a `.md` file from the dashboard.

## Working

- Mock sign-in with seeded users plus a no-password sign-up by name and email, dashboard with owned and shared documents, create, inline rename, delete
- Rich-text editor (headings, bold, italic, underline, strikethrough, code, links, highlight colours, text alignment, lists, quotes, code blocks, rules, undo/redo), word count
- Autosave with status and last saved time, 409 conflict detection with "Reload latest", unsaved-changes warning
- Sharing by email as viewer or editor, role changes, removal; all rules enforced server-side
- Access requests: viewers can ask for edit access, link holders can ask to view or edit, owner approves or declines in the Share dialog
- Import of `.txt`, `.md`, `.docx` up to 2 MB as new documents; clear errors for other types and sizes
- Download as Markdown or HTML; print or save as PDF
- 40 Vitest tests; production build; deployed on Vercel with Neon Postgres

## Incomplete or simplified

- Authentication is a mock (seeded users or name-and-email sign-up, no passwords, unsigned cookie)
- PDF export is the browser's print dialog, not a server-generated file
- On a conflict, local unsaved edits are discarded when reloading; there is no merge
- Tables, images and font colours are not supported in the editor or on import
- Access requests are visible only when the owner opens the Share dialog; there is no notification

## Deliberately cut

Real-time co-editing, comments, version history, real authentication.

## Next, with 2 to 4 more hours

Live updates and presence, real auth, Drizzle migrations, version history (snapshot per save), Playwright test for the two-user conflict flow. Details in ARCHITECTURE.md.

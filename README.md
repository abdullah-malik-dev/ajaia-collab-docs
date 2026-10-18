# Ajaia Docs

Live demo: https://ajaia-collab-docs-tau.vercel.app
Walkthrough video: https://www.loom.com/share/a622b55301934d64b372e1c5e65d8d31

A lightweight collaborative document editor in the spirit of Google Docs: create, edit and share rich-text documents with viewer or editor access, autosave with conflict detection, and import from `.txt`, `.md` and `.docx`.

Built for the Ajaia Full Stack Product Engineer take-home. See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions, [AI_WORKFLOW.md](AI_WORKFLOW.md) for how AI tooling was used, and [SUBMISSION.md](SUBMISSION.md) for the submission checklist.

## Run it locally

Requires Node 20 or newer. No database setup needed: without a `DATABASE_URL` the app runs on an embedded Postgres (PGlite) stored in `./.data`, creates its tables and seeds demo data on first start.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and pick a user.

Other scripts:

```bash
npm test          # Vitest: access rules, import conversion, service flows, export
npm run build     # production build
npm run lint
```

To point at a real Postgres instead, copy `.env.example` to `.env.local` and set `DATABASE_URL`. Tables are created with `CREATE TABLE IF NOT EXISTS` on first use, so no migration step is needed.

## Seeded users

Sign-in is a mock: you pick a person, no password. Three accounts are seeded so sharing can be seen from each side. You can also add yourself with a name and email on the login page; entering a known email signs you in as that person. Anyone created this way can be shared with by email.

| User  | Email              | On the "Welcome" document |
| ----- | ------------------ | ------------------------- |
| Alice | alice@ajaia.test   | Owner                     |
| Bob   | bob@ajaia.test     | Editor                    |
| Carol | carol@ajaia.test   | Viewer                    |

Open the app in two browsers (or one normal and one private window) as different users to see sharing, read-only mode and the conflict check.

## What it does

- **Dashboard**: "My documents" and "Shared with me" (owner name and role badge), create, rename inline, delete.
- **Editor**: headings, bold, italic, underline, strikethrough, inline code, links, highlight colours, text alignment, bullet and numbered lists, quotes, code blocks, horizontal rules, undo and redo. Word count.
- **Autosave**: saves 800 ms after you stop typing, with Saved / Saving / Unsaved / Error states and the last saved time. The browser warns before you close a tab with unsaved changes.
- **Conflict detection**: every save carries the timestamp the editor last saw. If someone else saved in between, the server answers 409 and the editor offers "Reload latest".
- **Sharing**: the owner shares by email as Viewer or Editor, can change roles and remove people. Viewers get a read-only editor.
- **Access requests**: a viewer can ask for edit access, and anyone with a document link can ask to view or edit. The owner sees requests in the Share dialog and approves or declines; approving grants the requested role.
- **Import**: `.txt`, `.md` and `.docx` files up to 2 MB become new, editable documents.
- **Download**: Markdown, HTML, or "Print or save as PDF" through the browser's print dialog.

## Supported import formats

| Format           | How it is converted                                                       |
| ---------------- | ------------------------------------------------------------------------- |
| `.txt`           | Blank lines become paragraphs, single newlines become line breaks, HTML is escaped |
| `.md`, `.markdown` | Parsed with `marked` (GitHub-flavoured); headings, lists, emphasis, links and code are kept |
| `.docx`          | Converted with `mammoth`; headings, lists, bold, italic and underline are kept |

Anything the editor can't represent (tables, images, font colours) is flattened to text. Other file types are rejected with a clear message, as are files over 2 MB.

## Deploy (Vercel + Neon)

1. Push the repository to GitHub and import it at vercel.com/new. The defaults for a Next.js project are correct.
2. In the Vercel project, open **Storage**, choose **Neon** (free tier) and connect it. The integration sets `DATABASE_URL` on the project.
3. Redeploy. On the first request the app creates its tables and seeds the three users and the Welcome document.

The same code path serves both environments: `src/db/client.ts` picks the Neon HTTP driver when `DATABASE_URL` is set and PGlite otherwise.

## Project layout

```
src/app            Next.js App Router pages and route handlers (thin)
src/server         Services: documents, shares, users, import. Take a db handle.
src/lib/access.ts  Pure role rules: resolveRole, canView, canEdit, canShare, canDelete
src/lib            Validation (zod), API helpers, export, session
src/db             Drizzle schema, client (PGlite or Neon), bootstrap and seed
src/components     Editor, toolbar, autosave hook, share dialog, dashboard pieces
tests              Vitest suites
```

## Deliberately not built

Real-time co-editing, comments, version history, real authentication, and server-rendered PDF export. See ARCHITECTURE.md for why and what would come next.

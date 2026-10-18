# Architecture

## What I prioritised and why

The brief rewards product judgement and finishing over feature count, so the order of work was: the thing that must never go wrong (saving and access control), then the thing a reviewer touches first (the editor and dashboard), then breadth (sharing, import), then verification and polish.

Three decisions shaped everything else:

1. **Server-enforced access in one pure module.** `src/lib/access.ts` has no I/O and answers four questions: can this role view, edit, share, delete. Every service calls it; routes never make access decisions. The matrix is unit tested, and the service tests prove the rules hold against a real database.
2. **Optimistic concurrency instead of real-time sync.** Real-time co-editing (CRDTs, websockets) is the one feature that would have consumed the whole window. The honest alternative is to make concurrent edits safe rather than seamless: each save carries `baseUpdatedAt`, the server refuses stale saves with 409, and the editor shows exactly what happened and how to recover.
3. **Zero-setup local development.** The reviewer should be able to run `npm install && npm run dev` and be inside the product in a minute. PGlite (Postgres in WASM) gives a real Postgres locally with no Docker or account, and the same Drizzle code runs on Neon in production.

## Data model

```
users            id uuid PK, name, email UNIQUE
documents        id uuid PK, title, content jsonb, owner_id -> users, created_at, updated_at
document_shares  (document_id -> documents, user_id -> users) PK, role 'viewer' | 'editor'
access_requests  (document_id, user_id) PK, requested_role, status 'pending' | 'approved' | 'declined', created_at
```

- `content` is the editor's own JSON (TipTap / ProseMirror). Storing the document model rather than HTML means formatting round-trips exactly, the server can validate shape and size, and exports are generated from one source of truth.
- `updated_at` doubles as the concurrency token. It is set by the server on every write.
- Shares are a composite-key table, so re-sharing is an upsert that changes the role. Deleting a document or a user cascades.
- Tables are created with `CREATE TABLE IF NOT EXISTS` on first use and demo data is seeded when the users table is empty. For a product with a release process this would be Drizzle migrations; for a take-home it keeps the "clone and run" promise.

## Access model

| Role    | View | Edit title and content | Manage sharing | Delete |
| ------- | ---- | ---------------------- | -------------- | ------ |
| Owner   | yes  | yes                    | yes            | yes    |
| Editor  | yes  | yes                    | no             | no     |
| Viewer  | yes  | no                     | no             | no     |
| Nobody  | 404  | 404                    | 404            | 404    |

- A user with no access gets 404 from the API, so ids can't be probed programmatically. The document page is the one place that distinguishes "doesn't exist" from "not shared with you": a signed-in user who lands on a real document's URL sees a "You need access" page with a request form, the same trade-off Google Docs makes for people holding a link.
- **Access requests** flow one way: anyone signed in can ask for `viewer` or `editor` (one open request per user per document, re-asking reopens it), the owner approves or declines from the Share dialog, and approving is an upsert into `document_shares` at the requested role. Asking for a role you already have, or for your own document, is rejected.
- A viewer attempting an edit gets 403 with a plain-language message. The UI never shows them an editable surface in the first place, but the server does not trust the UI.
- Authentication is a mock by design: an httpOnly cookie holds a seeded user id. The edge middleware only checks the cookie exists (it can't reach the database); pages and routes verify the user. Swapping in real auth means replacing `getCurrentUser()` in `src/lib/session.ts`.

## Request flow

```
route handler (src/app/api/**)      thin: auth, zod parse, call service, JSON
   -> service (src/server/*)        takes a Db handle; throws ServiceError(code)
        -> access rules (src/lib/access.ts)
        -> drizzle queries
route() wrapper maps ServiceError and ZodError to one JSON error shape:
   { error: { code, message, details? } } with the matching HTTP status
```

Services take the database as an argument so tests run them against an in-memory PGlite with no mocking.

## Autosave and conflicts

`useAutosave` keeps a single pending patch (title and/or content) and flushes it 800 ms after the last change. Only one request is in flight; edits made during a save are merged into the next request so `baseUpdatedAt` always reflects the last server response. On 409 the hook freezes further saves and the editor shows a banner with "Reload latest", which fetches the server version and resets the base. A `beforeunload` guard fires while anything is unsaved.

The server-side check is a conditional `UPDATE ... WHERE updated_at = <base>`, so two requests racing past the read still can't both win.

## Import

Conversion happens server-side in `src/server/import.ts`: the file is turned into HTML (`mammoth` for docx, `marked` for markdown, escaped paragraphs for text) and then into editor JSON with `@tiptap/html` using the same extension set the editor runs. That shared schema (`src/lib/editor-extensions.ts`) is what guarantees an imported file is fully editable, and that anything outside the schema degrades to text rather than breaking.

## Trade-offs

- **Last write wins after reload.** On conflict the local unsaved edits are discarded when the user reloads. Merging would be real-time co-editing by another name.
- **Role check costs two queries per request** (document, then shares). Fine at this scale; a join or a cached role would come with a real auth layer.
- **PGlite in a Next dev server** must be a process-wide singleton (hot reload would otherwise open the data directory twice). `getDb()` caches on `globalThis`.
- **Neon over HTTP** means no interactive transactions. The code avoids them; the one place that matters (update with concurrency check) is a single conditional statement.
- **Mock auth cookie is unsigned.** Acceptable only because the accounts are demo data; called out in the README.
- **PDF is the browser's print dialog**, not a server render. It is how Google Docs does it too, and the print stylesheet makes the output clean, but there is no PDF file produced on the server.

## What I would do with 2 to 4 more hours

1. **Notifications for access requests** (email or an in-app inbox) so owners don't have to open the Share dialog to see them.
2. **Presence and live updates without full co-editing**: poll or subscribe to `updated_at` so a viewer sees new content without reloading, and an editor learns about a conflict before they type into it.
3. **Real authentication** (NextAuth or Clerk) replacing the cookie, with the seeded users becoming real accounts.
4. **Drizzle migrations** instead of create-if-not-exists, and a `createdAt`-ordered activity line on the dashboard.
5. **Version history**: snapshot `content` on every save into a `document_versions` table and show a restore list. The data model already makes this a single insert.
6. **Playwright smoke test** for the two-user conflict flow, which today is verified by hand.

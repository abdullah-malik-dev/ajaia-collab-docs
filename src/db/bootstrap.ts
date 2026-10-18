import { sql } from "drizzle-orm";
import type { Db } from "./client";
import { documentShares, documents, users, type DocContent } from "./schema";

/**
 * Creates tables if they do not exist and seeds demo data on an empty database.
 * Idempotent: safe to run on every cold start.
 */
export async function bootstrap(db: Db) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE
    )`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      content jsonb NOT NULL,
      owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS document_shares (
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('viewer', 'editor')),
      PRIMARY KEY (document_id, user_id)
    )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_owner_idx ON documents(owner_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS document_shares_user_idx ON document_shares(user_id)`);

  await seedIfEmpty(db);
}

export const SEED_USERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Alice", email: "alice@ajaia.test" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Bob", email: "bob@ajaia.test" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Carol", email: "carol@ajaia.test" },
] as const;

export const WELCOME_DOC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

async function seedIfEmpty(db: Db) {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;

  await db.insert(users).values([...SEED_USERS]);
  await db.insert(documents).values({
    id: WELCOME_DOC_ID,
    title: "Welcome",
    content: welcomeContent(),
    ownerId: SEED_USERS[0].id,
  });
  await db.insert(documentShares).values([
    { documentId: WELCOME_DOC_ID, userId: SEED_USERS[1].id, role: "editor" },
    { documentId: WELCOME_DOC_ID, userId: SEED_USERS[2].id, role: "viewer" },
  ]);
}

function p(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function li(text: string) {
  return { type: "listItem", content: [p(text)] };
}

function welcomeContent(): DocContent {
  return {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome" }] },
      p("This is a shared document. Alice owns it, Bob can edit it, and Carol can only read it."),
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Things to try" }] },
      {
        type: "bulletList",
        content: [
          li("Edit this text. It saves on its own a moment after you stop typing."),
          li("Open the same document as another user in a second browser to see the conflict check."),
          li("Share a document of your own by email from the Share button."),
          li("Import a .txt, .md or .docx file from the dashboard."),
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Formatting: " },
          { type: "text", marks: [{ type: "bold" }], text: "bold" },
          { type: "text", text: ", " },
          { type: "text", marks: [{ type: "italic" }], text: "italic" },
          { type: "text", text: " and " },
          { type: "text", marks: [{ type: "underline" }], text: "underline" },
          { type: "text", text: " round-trip through the database exactly as typed." },
        ],
      },
    ],
  };
}

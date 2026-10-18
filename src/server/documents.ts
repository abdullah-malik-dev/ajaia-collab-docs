import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { documentShares, documents, users, type DocContent, type Document, type ShareRole } from "@/db/schema";
import { canDelete, canEdit, resolveRole, type Role } from "@/lib/access";
import { conflict, forbidden, notFound } from "./errors";
import { isUuid } from "./users";

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerId: string;
  ownerName: string;
  role: Exclude<Role, null>;
};

export type DocumentWithRole = { doc: Document; role: Exclude<Role, null> };

export const EMPTY_CONTENT: DocContent = { type: "doc", content: [{ type: "paragraph" }] };

export async function listDocumentsForUser(db: Db, userId: string) {
  const owned = await db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      ownerId: documents.ownerId,
      ownerName: users.name,
    })
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));

  const shared = await db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      ownerId: documents.ownerId,
      ownerName: users.name,
      role: documentShares.role,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));

  return {
    owned: owned.map((d): DocumentSummary => ({ ...d, role: "owner" })),
    shared: shared as DocumentSummary[],
  };
}

export async function createDocument(db: Db, ownerId: string, input: { title?: string; content?: DocContent }) {
  const [doc] = await db
    .insert(documents)
    .values({
      id: crypto.randomUUID(),
      title: input.title ?? "Untitled document",
      content: input.content ?? EMPTY_CONTENT,
      ownerId,
    })
    .returning();
  return doc;
}

/** Loads a document and the acting user's role. Unknown ids and no-access both read as not found. */
export async function getDocumentForUser(db: Db, docId: string, userId: string): Promise<DocumentWithRole> {
  if (!isUuid(docId)) throw notFound();
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) throw notFound();
  const shares = await db
    .select({ userId: documentShares.userId, role: documentShares.role })
    .from(documentShares)
    .where(eq(documentShares.documentId, docId));
  const role = resolveRole({ ownerId: doc.ownerId, shares }, userId);
  if (!role) throw notFound();
  return { doc, role };
}

export type UpdateInput = { title?: string; content?: DocContent; baseUpdatedAt?: string };

export async function updateDocument(db: Db, docId: string, userId: string, input: UpdateInput): Promise<Document> {
  const { doc, role } = await getDocumentForUser(db, docId, userId);
  if (!canEdit(role)) throw forbidden("You can only view this document.");

  if (input.baseUpdatedAt && doc.updatedAt.toISOString() !== input.baseUpdatedAt) {
    throw conflict("Someone else saved this document after you opened it.", {
      updatedAt: doc.updatedAt.toISOString(),
    });
  }

  const patch: Partial<typeof documents.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;

  // Guard against a save that lands between the check above and this write.
  const where = input.baseUpdatedAt
    ? and(eq(documents.id, docId), eq(documents.updatedAt, doc.updatedAt))
    : eq(documents.id, docId);
  const [updated] = await db.update(documents).set(patch).where(where).returning();
  if (!updated) {
    throw conflict("Someone else saved this document after you opened it.");
  }
  return updated;
}

export async function deleteDocument(db: Db, docId: string, userId: string): Promise<void> {
  const { role } = await getDocumentForUser(db, docId, userId);
  if (!canDelete(role)) throw forbidden("Only the owner can delete this document.");
  await db.delete(documents).where(eq(documents.id, docId));
}

export type { ShareRole };

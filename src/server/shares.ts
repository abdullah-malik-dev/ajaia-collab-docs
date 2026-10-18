import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { documentShares, users, type ShareRole } from "@/db/schema";
import { canShare } from "@/lib/access";
import { getDocumentForUser } from "./documents";
import { forbidden, ServiceError } from "./errors";
import { findUserByEmail, isUuid } from "./users";

export type ShareEntry = { userId: string; name: string; email: string; role: ShareRole };

/** Owner-only: who a document is shared with. */
export async function listShares(db: Db, docId: string, actorId: string): Promise<ShareEntry[]> {
  await requireOwner(db, docId, actorId);
  return db
    .select({ userId: users.id, name: users.name, email: users.email, role: documentShares.role })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, docId))
    .orderBy(users.name);
}

/** Owner-only: share with a user by email, or change their role if already shared. */
export async function addShare(
  db: Db,
  docId: string,
  actorId: string,
  input: { email: string; role: ShareRole },
): Promise<ShareEntry> {
  const { doc } = await requireOwner(db, docId, actorId);
  const target = await findUserByEmail(db, input.email);
  if (!target) {
    throw new ServiceError("not_found", "No account with that email. Try alice@, bob@ or carol@ajaia.test.");
  }
  if (target.id === doc.ownerId) {
    throw new ServiceError("validation", "You already own this document.");
  }
  await db
    .insert(documentShares)
    .values({ documentId: docId, userId: target.id, role: input.role })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role: input.role },
    });
  return { userId: target.id, name: target.name, email: target.email, role: input.role };
}

/** Owner-only. Removing someone who isn't shared with is a no-op. */
export async function removeShare(db: Db, docId: string, actorId: string, userId: string): Promise<void> {
  await requireOwner(db, docId, actorId);
  if (!isUuid(userId)) return;
  await db
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, docId), eq(documentShares.userId, userId)));
}

async function requireOwner(db: Db, docId: string, actorId: string) {
  const loaded = await getDocumentForUser(db, docId, actorId);
  if (!canShare(loaded.role)) throw forbidden("Only the owner can change who has access.");
  return loaded;
}

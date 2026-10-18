import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { accessRequests, documents, documentShares, users, type ShareRole } from "@/db/schema";
import { canShare, resolveRole, type Role } from "@/lib/access";
import { forbidden, notFound, ServiceError } from "./errors";
import { isUuid } from "./users";

export type AccessRequestEntry = {
  userId: string;
  name: string;
  email: string;
  requestedRole: ShareRole;
  status: "pending" | "approved" | "declined";
  createdAt: Date;
};

const RANK: Record<Exclude<Role, null>, number> = { viewer: 1, editor: 2, owner: 3 };

/**
 * Anyone signed in can ask for access to a document they know the id of, or
 * for a higher role than they have. One open request per user per document.
 */
export async function requestAccess(
  db: Db,
  docId: string,
  userId: string,
  requestedRole: ShareRole,
): Promise<AccessRequestEntry> {
  if (!isUuid(docId)) throw notFound();
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) throw notFound();

  const shares = await db
    .select({ userId: documentShares.userId, role: documentShares.role })
    .from(documentShares)
    .where(eq(documentShares.documentId, docId));
  const current = resolveRole({ ownerId: doc.ownerId, shares }, userId);
  if (current === "owner") throw new ServiceError("validation", "You own this document.");
  if (current && RANK[current] >= RANK[requestedRole]) {
    throw new ServiceError("validation", `You can already ${requestedRole === "editor" ? "edit" : "view"} this document.`);
  }

  const [row] = await db
    .insert(accessRequests)
    .values({ documentId: docId, userId, requestedRole, status: "pending" })
    .onConflictDoUpdate({
      target: [accessRequests.documentId, accessRequests.userId],
      set: { requestedRole, status: "pending", createdAt: new Date() },
    })
    .returning();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return { userId, name: user.name, email: user.email, requestedRole: row.requestedRole, status: row.status, createdAt: row.createdAt };
}

/** The caller's own open request on a document, if any. */
export async function myPendingRequest(db: Db, docId: string, userId: string): Promise<ShareRole | null> {
  if (!isUuid(docId)) return null;
  const [row] = await db
    .select({ requestedRole: accessRequests.requestedRole })
    .from(accessRequests)
    .where(and(eq(accessRequests.documentId, docId), eq(accessRequests.userId, userId), eq(accessRequests.status, "pending")))
    .limit(1);
  return row?.requestedRole ?? null;
}

/** Owner-only: open requests, newest first. */
export async function listPendingRequests(db: Db, docId: string, actorId: string): Promise<AccessRequestEntry[]> {
  await requireOwner(db, docId, actorId);
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      requestedRole: accessRequests.requestedRole,
      status: accessRequests.status,
      createdAt: accessRequests.createdAt,
    })
    .from(accessRequests)
    .innerJoin(users, eq(users.id, accessRequests.userId))
    .where(and(eq(accessRequests.documentId, docId), eq(accessRequests.status, "pending")))
    .orderBy(desc(accessRequests.createdAt));
}

/** Owner-only. Approving grants the requested role; declining just closes the request. */
export async function resolveRequest(
  db: Db,
  docId: string,
  actorId: string,
  requesterId: string,
  decision: "approve" | "decline",
): Promise<void> {
  await requireOwner(db, docId, actorId);
  if (!isUuid(requesterId)) throw notFound("Request");
  const [req] = await db
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.documentId, docId), eq(accessRequests.userId, requesterId), eq(accessRequests.status, "pending")))
    .limit(1);
  if (!req) throw notFound("Request");

  if (decision === "approve") {
    await db
      .insert(documentShares)
      .values({ documentId: docId, userId: requesterId, role: req.requestedRole })
      .onConflictDoUpdate({
        target: [documentShares.documentId, documentShares.userId],
        set: { role: req.requestedRole },
      });
  }
  await db
    .update(accessRequests)
    .set({ status: decision === "approve" ? "approved" : "declined" })
    .where(and(eq(accessRequests.documentId, docId), eq(accessRequests.userId, requesterId)));
}

export async function documentExists(db: Db, docId: string): Promise<boolean> {
  if (!isUuid(docId)) return false;
  const rows = await db.select({ id: documents.id }).from(documents).where(eq(documents.id, docId)).limit(1);
  return rows.length > 0;
}

async function requireOwner(db: Db, docId: string, actorId: string) {
  if (!isUuid(docId)) throw notFound();
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) throw notFound();
  const shares = await db
    .select({ userId: documentShares.userId, role: documentShares.role })
    .from(documentShares)
    .where(eq(documentShares.documentId, docId));
  const role = resolveRole({ ownerId: doc.ownerId, shares }, actorId);
  if (!role) throw notFound();
  if (!canShare(role)) throw forbidden("Only the owner can manage access requests.");
  return doc;
}

import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/db/client";
import { SEED_USERS } from "@/db/bootstrap";
import { createDocument, getDocumentForUser, updateDocument } from "@/server/documents";
import { listPendingRequests, myPendingRequest, requestAccess, resolveRequest } from "@/server/requests";
import { addShare } from "@/server/shares";

const [alice, bob, carol] = SEED_USERS;

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});

describe("access requests", () => {
  let docId: string;

  it("someone with the link but no access can ask, and the owner sees it", async () => {
    const doc = await createDocument(db, alice.id, { title: "Plan" });
    docId = doc.id;
    await expect(getDocumentForUser(db, docId, bob.id)).rejects.toMatchObject({ code: "not_found" });

    const req = await requestAccess(db, docId, bob.id, "viewer");
    expect(req).toMatchObject({ userId: bob.id, requestedRole: "viewer", status: "pending" });
    expect(await myPendingRequest(db, docId, bob.id)).toBe("viewer");

    const pending = await listPendingRequests(db, docId, alice.id);
    expect(pending.map((r) => r.userId)).toEqual([bob.id]);
  });

  it("only the owner can list or resolve requests", async () => {
    await expect(listPendingRequests(db, docId, bob.id)).rejects.toMatchObject({ code: "not_found" });
    await addShare(db, docId, alice.id, { email: carol.email, role: "editor" });
    await expect(listPendingRequests(db, docId, carol.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(resolveRequest(db, docId, carol.id, bob.id, "approve")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("declining closes the request without granting access", async () => {
    await resolveRequest(db, docId, alice.id, bob.id, "decline");
    expect(await myPendingRequest(db, docId, bob.id)).toBeNull();
    await expect(getDocumentForUser(db, docId, bob.id)).rejects.toMatchObject({ code: "not_found" });
    expect(await listPendingRequests(db, docId, alice.id)).toEqual([]);
  });

  it("re-requesting reopens it, and approving grants the requested role", async () => {
    await requestAccess(db, docId, bob.id, "viewer");
    await resolveRequest(db, docId, alice.id, bob.id, "approve");
    const { role } = await getDocumentForUser(db, docId, bob.id);
    expect(role).toBe("viewer");
    await expect(resolveRequest(db, docId, alice.id, bob.id, "approve")).rejects.toMatchObject({ code: "not_found" });
  });

  it("a viewer can ask for edit access and gets it on approval", async () => {
    await expect(updateDocument(db, docId, bob.id, { title: "nope" })).rejects.toMatchObject({ code: "forbidden" });
    await requestAccess(db, docId, bob.id, "editor");
    await resolveRequest(db, docId, alice.id, bob.id, "approve");
    const updated = await updateDocument(db, docId, bob.id, { title: "Plan v2" });
    expect(updated.title).toBe("Plan v2");
  });

  it("rejects pointless requests", async () => {
    await expect(requestAccess(db, docId, alice.id, "editor")).rejects.toMatchObject({ code: "validation" });
    await expect(requestAccess(db, docId, bob.id, "viewer")).rejects.toMatchObject({ code: "validation" });
    await expect(requestAccess(db, "99999999-9999-4999-8999-999999999999", bob.id, "viewer")).rejects.toMatchObject({ code: "not_found" });
  });
});

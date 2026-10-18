import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/db/client";
import { SEED_USERS } from "@/db/bootstrap";
import { createDocument, deleteDocument, getDocumentForUser, listDocumentsForUser, updateDocument } from "@/server/documents";
import { addShare, listShares, removeShare } from "@/server/shares";

const [alice, bob, carol] = SEED_USERS;

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});

describe("sharing and access through the services", () => {
  let docId: string;

  it("Alice creates a document and shares it with Bob as viewer", async () => {
    const doc = await createDocument(db, alice.id, { title: "Roadmap" });
    docId = doc.id;
    const share = await addShare(db, docId, alice.id, { email: "bob@ajaia.test", role: "viewer" });
    expect(share).toMatchObject({ userId: bob.id, role: "viewer" });
    expect(await listShares(db, docId, alice.id)).toHaveLength(1);
  });

  it("Bob can read it and sees it under shared with me", async () => {
    const { doc, role } = await getDocumentForUser(db, docId, bob.id);
    expect(doc.title).toBe("Roadmap");
    expect(role).toBe("viewer");
    const lists = await listDocumentsForUser(db, bob.id);
    expect(lists.shared.map((d) => d.id)).toContain(docId);
    expect(lists.shared.find((d) => d.id === docId)).toMatchObject({ ownerName: "Alice", role: "viewer" });
  });

  it("Bob's update is rejected as forbidden", async () => {
    await expect(updateDocument(db, docId, bob.id, { title: "Hijacked" })).rejects.toMatchObject({ code: "forbidden" });
    const { doc } = await getDocumentForUser(db, docId, alice.id);
    expect(doc.title).toBe("Roadmap");
  });

  it("Carol gets not found, and cannot share or delete either", async () => {
    await expect(getDocumentForUser(db, docId, carol.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(addShare(db, docId, carol.id, { email: "bob@ajaia.test", role: "editor" })).rejects.toMatchObject({ code: "not_found" });
    await expect(deleteDocument(db, docId, carol.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("re-sharing with a new role upgrades Bob, who can then edit", async () => {
    await addShare(db, docId, alice.id, { email: "BOB@ajaia.test", role: "editor" });
    expect(await listShares(db, docId, alice.id)).toHaveLength(1);
    const updated = await updateDocument(db, docId, bob.id, { title: "Roadmap v2" });
    expect(updated.title).toBe("Roadmap v2");
  });

  it("Bob cannot manage sharing or delete even as editor", async () => {
    await expect(listShares(db, docId, bob.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(deleteDocument(db, docId, bob.id)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("removing Bob's share makes the document not found for him", async () => {
    await removeShare(db, docId, alice.id, bob.id);
    await expect(getDocumentForUser(db, docId, bob.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("owner can delete, after which it is gone for everyone", async () => {
    await deleteDocument(db, docId, alice.id);
    await expect(getDocumentForUser(db, docId, alice.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("concurrent edits", () => {
  it("rejects a save based on a stale timestamp with conflict", async () => {
    const doc = await createDocument(db, alice.id, { title: "Spec" });
    const base = doc.updatedAt.toISOString();

    const first = await updateDocument(db, doc.id, alice.id, { title: "Spec A", baseUpdatedAt: base });
    expect(first.title).toBe("Spec A");

    await expect(updateDocument(db, doc.id, alice.id, { title: "Spec B", baseUpdatedAt: base })).rejects.toMatchObject({
      code: "conflict",
      details: { updatedAt: first.updatedAt.toISOString() },
    });

    const second = await updateDocument(db, doc.id, alice.id, { title: "Spec B", baseUpdatedAt: first.updatedAt.toISOString() });
    expect(second.title).toBe("Spec B");
  });

  it("round-trips content JSON exactly", async () => {
    const content = {
      type: "doc" as const,
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H" }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "underline" }], text: "u" }] },
      ],
    };
    const doc = await createDocument(db, alice.id, { title: "Round trip", content });
    const { doc: loaded } = await getDocumentForUser(db, doc.id, alice.id);
    expect(loaded.content).toEqual(content);
  });
});

describe("share validation", () => {
  it("rejects unknown emails and self-shares", async () => {
    const doc = await createDocument(db, alice.id, {});
    await expect(addShare(db, doc.id, alice.id, { email: "dave@ajaia.test", role: "viewer" })).rejects.toMatchObject({ code: "not_found" });
    await expect(addShare(db, doc.id, alice.id, { email: "alice@ajaia.test", role: "viewer" })).rejects.toMatchObject({ code: "validation" });
  });
});

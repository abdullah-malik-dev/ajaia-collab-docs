import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "@/db/client";
import { SEED_USERS } from "@/db/bootstrap";
import { addShare } from "@/server/shares";
import { createDocument, getDocumentForUser } from "@/server/documents";
import { findOrCreateUser, findUserByEmail } from "@/server/users";

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});

describe("lightweight sign-up", () => {
  it("creates a new user and normalises the email", async () => {
    const { user, created } = await findOrCreateUser(db, { name: "  Dana ", email: " Dana@Example.com " });
    expect(created).toBe(true);
    expect(user).toMatchObject({ name: "Dana", email: "dana@example.com" });
    expect(await findUserByEmail(db, "DANA@example.com")).toMatchObject({ id: user.id });
  });

  it("returns the existing user for a known email instead of duplicating", async () => {
    const { user, created } = await findOrCreateUser(db, { name: "Someone Else", email: "alice@ajaia.test" });
    expect(created).toBe(false);
    expect(user.id).toBe(SEED_USERS[0].id);
    expect(user.name).toBe("Alice");
  });

  it("a signed-up user can be shared with by email", async () => {
    const { user: dana } = await findOrCreateUser(db, { name: "Dana", email: "dana@example.com" });
    const doc = await createDocument(db, SEED_USERS[0].id, { title: "For Dana" });
    await addShare(db, doc.id, SEED_USERS[0].id, { email: "dana@example.com", role: "editor" });
    const { role } = await getDocumentForUser(db, doc.id, dana.id);
    expect(role).toBe("editor");
  });
});

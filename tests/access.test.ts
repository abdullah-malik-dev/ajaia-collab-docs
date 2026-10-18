import { describe, expect, it } from "vitest";
import { canDelete, canEdit, canShare, canView, resolveRole, type Role } from "@/lib/access";

const owner = "owner-id";
const editor = "editor-id";
const viewer = "viewer-id";
const stranger = "stranger-id";

const doc = {
  ownerId: owner,
  shares: [
    { userId: editor, role: "editor" as const },
    { userId: viewer, role: "viewer" as const },
  ],
};

describe("resolveRole", () => {
  it("gives the owner the owner role even if they also appear in shares", () => {
    const withSelfShare = { ...doc, shares: [...doc.shares, { userId: owner, role: "viewer" as const }] };
    expect(resolveRole(withSelfShare, owner)).toBe("owner");
  });
  it("returns the share role for shared users", () => {
    expect(resolveRole(doc, editor)).toBe("editor");
    expect(resolveRole(doc, viewer)).toBe("viewer");
  });
  it("returns null for everyone else", () => {
    expect(resolveRole(doc, stranger)).toBeNull();
    expect(resolveRole({ ownerId: owner, shares: [] }, editor)).toBeNull();
  });
});

describe("permission matrix", () => {
  const matrix: Array<[Role, boolean, boolean, boolean, boolean]> = [
    // role,     view,  edit,  share, delete
    ["owner", true, true, true, true],
    ["editor", true, true, false, false],
    ["viewer", true, false, false, false],
    [null, false, false, false, false],
  ];

  it.each(matrix)("%s: view=%s edit=%s share=%s delete=%s", (role, view, edit, share, del) => {
    expect(canView(role)).toBe(view);
    expect(canEdit(role)).toBe(edit);
    expect(canShare(role)).toBe(share);
    expect(canDelete(role)).toBe(del);
  });
});

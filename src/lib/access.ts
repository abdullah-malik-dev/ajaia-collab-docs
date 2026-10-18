import type { ShareRole } from "@/db/schema";

/** Effective role of a user on a document. `null` means no access at all. */
export type Role = "owner" | ShareRole | null;

export type AccessInput = {
  ownerId: string;
  shares: ReadonlyArray<{ userId: string; role: ShareRole }>;
};

export function resolveRole(doc: AccessInput, userId: string): Role {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export function canView(role: Role): boolean {
  return role !== null;
}

/** Edit content and title. */
export function canEdit(role: Role): boolean {
  return role === "owner" || role === "editor";
}

/** Add or remove shares. */
export function canShare(role: Role): boolean {
  return role === "owner";
}

export function canDelete(role: Role): boolean {
  return role === "owner";
}

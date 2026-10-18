import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RoleBadge } from "@/components/RoleBadge";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { getDb } from "@/db/client";
import { canEdit } from "@/lib/access";
import { requireUser } from "@/lib/session";
import { getDocumentForUser } from "@/server/documents";
import { ServiceError } from "@/server/errors";
import { findUserById } from "@/server/users";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const db = await getDb();
  let loaded;
  try {
    loaded = await getDocumentForUser(db, params.id, user.id);
  } catch (e) {
    if (e instanceof ServiceError && e.code === "not_found") notFound();
    throw e;
  }
  const { doc, role } = loaded;
  const owner = role === "owner" ? user : await findUserById(db, doc.ownerId);

  return (
    <>
      <AppHeader user={user}>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span>{role === "owner" ? "Your document" : `Shared by ${owner?.name ?? "someone"}`}</span>
          <RoleBadge role={role} />
        </div>
      </AppHeader>
      <DocumentEditor
        doc={{ id: doc.id, title: doc.title, content: doc.content, updatedAt: doc.updatedAt.toISOString() }}
        canEdit={canEdit(role)}
        ownerName={owner?.name ?? "the owner"}
      />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RoleBadge } from "@/components/RoleBadge";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { RequestAccess } from "@/components/share/RequestAccess";
import { ShareButton } from "@/components/share/ShareDialog";
import { getDb } from "@/db/client";
import { canEdit, canShare } from "@/lib/access";
import { requireUser } from "@/lib/session";
import { getDocumentForUser, type DocumentWithRole } from "@/server/documents";
import { ServiceError } from "@/server/errors";
import { documentExists, listPendingRequests, myPendingRequest } from "@/server/requests";
import { findUserById } from "@/server/users";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const db = await getDb();
  let loaded: DocumentWithRole;
  try {
    loaded = await getDocumentForUser(db, params.id, user.id);
  } catch (e) {
    if (e instanceof ServiceError && e.code === "not_found") {
      // Exists but not shared with this user: let them ask for access.
      if (await documentExists(db, params.id)) {
        const pending = await myPendingRequest(db, params.id, user.id);
        return (
          <>
            <AppHeader user={user} />
            <main className="mx-auto max-w-page px-6 py-24 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">You need access</h1>
              <p className="mt-2 text-ink-muted">
                This document hasn&apos;t been shared with you. Ask the owner and they can approve it from the Share
                dialog.
              </p>
              <RequestAccess docId={params.id} pending={pending} variant="page" />
              <Link href="/" className="mt-8 inline-block text-sm text-accent hover:underline">
                Back to your documents
              </Link>
            </main>
          </>
        );
      }
      notFound();
    }
    throw e;
  }
  const { doc, role } = loaded;
  const owner = role === "owner" ? user : await findUserById(db, doc.ownerId);
  const pendingCount = canShare(role) ? (await listPendingRequests(db, doc.id, user.id)).length : 0;
  const myRequest = role === "viewer" ? await myPendingRequest(db, doc.id, user.id) : null;

  return (
    <>
      <AppHeader user={user}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="hidden sm:inline">{role === "owner" ? "Your document" : `Shared by ${owner?.name ?? "someone"}`}</span>
            <RoleBadge role={role} />
          </div>
          {canShare(role) && (
            <ShareButton
              docId={doc.id}
              docTitle={doc.title}
              owner={{ name: user.name, email: user.email }}
              pendingCount={pendingCount}
            />
          )}
        </div>
      </AppHeader>
      <DocumentEditor
        doc={{ id: doc.id, title: doc.title, content: doc.content, updatedAt: doc.updatedAt.toISOString() }}
        canEdit={canEdit(role)}
        ownerName={owner?.name ?? "the owner"}
        requestEdit={role === "viewer" ? <RequestAccess docId={doc.id} pending={myRequest} variant="inline" /> : null}
      />
    </>
  );
}

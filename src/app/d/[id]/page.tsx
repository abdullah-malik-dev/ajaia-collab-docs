import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RoleBadge } from "@/components/RoleBadge";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { getDocumentForUser } from "@/server/documents";
import { ServiceError } from "@/server/errors";

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

  return (
    <>
      <AppHeader user={user}>
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{doc.title}</span>
          <RoleBadge role={role} />
        </div>
      </AppHeader>
      <main className="mx-auto max-w-page px-6 py-10">
        <p className="text-ink-muted">Editor comes in the next step.</p>
      </main>
    </>
  );
}

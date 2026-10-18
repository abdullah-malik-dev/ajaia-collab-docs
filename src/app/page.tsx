import { AppHeader } from "@/components/AppHeader";
import { DocumentRow, type RowDoc } from "@/components/dashboard/DocumentRow";
import { ImportButton } from "@/components/dashboard/ImportButton";
import { NewDocumentButton } from "@/components/dashboard/NewDocumentButton";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/session";
import { listDocumentsForUser, type DocumentSummary } from "@/server/documents";

export const dynamic = "force-dynamic";

const toRow = (d: DocumentSummary): RowDoc => ({
  id: d.id,
  title: d.title,
  updatedAt: d.updatedAt.toISOString(),
  ownerName: d.ownerName,
  role: d.role,
});

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();
  const { owned, shared } = await listDocumentsForUser(db, user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-page px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="mt-1 text-ink-muted">Everything you own, and everything shared with you.</p>
          </div>
          <div className="flex items-start gap-3">
            <ImportButton />
            <NewDocumentButton />
          </div>
        </div>

        <Section title="My documents" count={owned.length}>
          {owned.length === 0 ? (
            <Empty>You haven&apos;t created anything yet. Start with a new document.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {owned.map((d) => (
                <DocumentRow key={d.id} doc={toRow(d)} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Shared with me" count={shared.length}>
          {shared.length === 0 ? (
            <Empty>Nothing shared with you yet. When someone shares a document, it shows up here.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {shared.map((d) => (
                <DocumentRow key={d.id} doc={toRow(d)} />
              ))}
            </ul>
          )}
        </Section>
      </main>
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-ink-muted">
        {title}
        <span className="text-ink-faint">{count}</span>
      </h2>
      <div className="rounded border border-line bg-paper">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-ink-muted">{children}</p>;
}

import { requireUser } from "@/lib/session";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-page px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <form action={signOut} className="flex items-center gap-3 text-sm text-ink-muted">
          <span>{user.name}</span>
          <button type="submit" className="hover:text-accent">
            Sign out
          </button>
        </form>
      </header>
      <p className="mt-8 text-ink-muted">Dashboard comes in the next step.</p>
    </main>
  );
}

import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { User } from "@/db/schema";

export function AppHeader({ user, children }: { user: User; children?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-page items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight hover:text-accent">
          Ajaia Docs
        </Link>
        <div className="min-w-0 flex-1">{children}</div>
        <form action={signOut} className="flex shrink-0 items-center gap-3 text-sm text-ink-muted">
          <span className="hidden sm:inline">{user.name}</span>
          <button type="submit" className="hover:text-accent">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

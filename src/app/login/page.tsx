import { getDb } from "@/db/client";
import { listUsers } from "@/server/users";
import { signInAs } from "./actions";
import { ContinueButton } from "./ContinueButton";
import { SignUpForm } from "./SignUpForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const db = await getDb();
  // Only the seeded demo people are listed; everyone else signs in by email below.
  const users = (await listUsers(db)).filter((u) => u.email.endsWith("@ajaia.test"));
  const next = searchParams.next ?? "/";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Ajaia Docs</h1>
        <p className="mt-2 text-ink-muted">
          Pick a person to continue as, or add yourself below. There are no passwords; the three
          seeded accounts let you see sharing from each side.
        </p>

        {searchParams.error === "unknown-user" && (
          <p className="mt-4 rounded border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            That account doesn&apos;t exist. Choose one of the people below.
          </p>
        )}

        <ul className="mt-8 divide-y divide-line border-y border-line">
          {users.map((u) => (
            <li key={u.id}>
              <form action={signInAs}>
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="next" value={next} />
                <ContinueButton name={u.name} email={u.email} />
              </form>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-ink-faint">
          Alice owns the Welcome document. Bob can edit it, Carol can read it.
        </p>

        <SignUpForm next={next} />
      </div>
    </main>
  );
}

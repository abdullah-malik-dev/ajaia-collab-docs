import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-page px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">That document isn&apos;t here</h1>
      <p className="mt-2 text-ink-muted">
        It may have been deleted, or it hasn&apos;t been shared with you.
      </p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        Back to your documents
      </Link>
    </main>
  );
}

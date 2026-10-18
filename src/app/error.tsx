"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-page px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-ink-muted">
        The page couldn&apos;t load. Your saved work is safe; try again or go back to your documents.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-accent px-3.5 py-2 text-sm font-medium text-paper hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link href="/" className="rounded border border-line-strong px-3.5 py-2 text-sm font-medium hover:text-accent">
          Back to documents
        </Link>
      </div>
    </main>
  );
}

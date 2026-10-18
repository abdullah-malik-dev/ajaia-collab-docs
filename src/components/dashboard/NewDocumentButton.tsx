"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";

export function NewDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const doc = await api<{ id: string }>("/api/documents", { method: "POST", json: {} });
      router.push(`/d/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the document.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="rounded bg-accent px-3.5 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? "Creating…" : "New document"}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}

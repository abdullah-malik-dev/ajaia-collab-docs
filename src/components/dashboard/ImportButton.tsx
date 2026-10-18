"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/client-api";

const ACCEPT = ".txt,.md,.markdown,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("That file is over 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const doc = await api<{ id: string }>("/api/import", { method: "POST", body: form });
      router.push(`/d/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't import that file.");
      setBusy(false);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Choose a file to import"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded border border-line-strong bg-paper px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {busy ? "Importing…" : "Import file"}
      </button>
      <span className={`text-xs ${error ? "text-danger" : "text-ink-faint"}`}>
        {error ?? ".txt, .md or .docx, up to 2 MB"}
      </span>
    </div>
  );
}

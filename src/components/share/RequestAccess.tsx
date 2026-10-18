"use client";

import { useState } from "react";
import type { ShareRole } from "@/db/schema";
import { api } from "@/lib/client-api";

type Props = {
  docId: string;
  /** Open request already on file for this user, if any. */
  pending: ShareRole | null;
  /** "inline": viewer asking for edit access. "page": no access at all, choose a role. */
  variant: "inline" | "page";
};

export function RequestAccess({ docId, pending, variant }: Props) {
  const [role, setRole] = useState<ShareRole>(variant === "inline" ? "editor" : "editor");
  const [sent, setSent] = useState<ShareRole | null>(pending);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(requested: ShareRole) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/documents/${docId}/requests`, { method: "POST", json: { role: requested } });
      setSent(requested);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the request.");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2">
        {sent === "editor" ? (
          <span className="text-ink-faint">Edit access requested. The owner will see it when they open sharing.</span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("editor")}
            className="font-medium text-accent hover:underline disabled:opacity-60"
          >
            {busy ? "Sending…" : "Request edit access"}
          </button>
        )}
        {error && <span className="text-danger">{error}</span>}
      </span>
    );
  }

  return (
    <div className="mt-6">
      {sent ? (
        <p className="rounded border border-line bg-paper px-4 py-3 text-sm text-ink-muted">
          You asked to {sent === "editor" ? "edit" : "view"} this document. The owner will see your request the next time
          they open sharing. Check back later.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(role);
          }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ShareRole)}
            aria-label="Access level"
            className="rounded border border-line-strong bg-paper px-2 py-2 text-sm"
          >
            <option value="viewer">Ask to view</option>
            <option value="editor">Ask to edit</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-accent px-3.5 py-2 text-sm font-medium text-paper hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? "Sending…" : "Request access"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

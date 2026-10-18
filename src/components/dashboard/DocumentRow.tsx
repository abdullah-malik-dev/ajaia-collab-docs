"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import { api } from "@/lib/client-api";
import { timeAgo } from "@/lib/format";
import { TITLE_MAX } from "@/lib/validation";

export type RowDoc = {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: "owner" | "editor" | "viewer";
};

export function DocumentRow({ doc }: { doc: RowDoc }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "rename" | "confirm" | "deleting">("view");
  const [title, setTitle] = useState(doc.title);
  const [error, setError] = useState<string | null>(null);

  async function saveTitle() {
    const next = title.trim();
    if (!next || next === doc.title) {
      setTitle(doc.title);
      setMode("view");
      return;
    }
    try {
      await api(`/api/documents/${doc.id}`, { method: "PATCH", json: { title: next } });
      setMode("view");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't rename.");
    }
  }

  async function remove() {
    setMode("deleting");
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete.");
      setMode("view");
    }
  }

  const isOwner = doc.role === "owner";

  return (
    <li className="group flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        {mode === "rename" ? (
          <input
            autoFocus
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitle(doc.title);
                setMode("view");
              }
            }}
            aria-label="Document title"
            className="w-full rounded border border-line-strong bg-paper px-2 py-1 text-base font-medium"
          />
        ) : (
          <Link
            href={`/d/${doc.id}`}
            className="block truncate text-base font-medium hover:text-accent"
          >
            {doc.title}
          </Link>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-sm text-ink-muted">
          {!isOwner && <span>Shared by {doc.ownerName}</span>}
          {!isOwner && <RoleBadge role={doc.role} />}
          <span>Edited {timeAgo(doc.updatedAt)}</span>
          {error && <span className="text-danger">{error}</span>}
        </div>
      </div>
      {isOwner && mode === "view" && (
        <div className="flex shrink-0 gap-3 text-sm text-ink-faint">
          <button type="button" onClick={() => setMode("rename")} className="hover:text-accent">
            Rename
          </button>
          <button type="button" onClick={() => setMode("confirm")} className="hover:text-danger">
            Delete
          </button>
        </div>
      )}
      {mode === "confirm" && (
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-ink-muted">Delete this document?</span>
          <button
            type="button"
            onClick={remove}
            className="rounded bg-danger px-2.5 py-1 font-medium text-paper hover:opacity-90"
          >
            Delete
          </button>
          <button type="button" onClick={() => setMode("view")} className="px-1 text-ink-muted hover:text-ink">
            Keep
          </button>
        </div>
      )}
      {mode === "deleting" && <span className="text-sm text-ink-faint">Deleting…</span>}
    </li>
  );
}

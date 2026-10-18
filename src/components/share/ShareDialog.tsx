"use client";

import { useEffect, useRef, useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import type { ShareRole } from "@/db/schema";
import { api } from "@/lib/client-api";

type Share = { userId: string; name: string; email: string; role: ShareRole };

type Props = { docId: string; docTitle: string; owner: { name: string; email: string } };

export function ShareButton({ docId, docTitle, owner }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
        className="rounded border border-line-strong bg-paper px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
      >
        Share
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="w-full max-w-md rounded border border-line bg-paper p-0 text-ink shadow-none backdrop:bg-ink/30"
      >
        {open && (
          <ShareForm
            docId={docId}
            docTitle={docTitle}
            owner={owner}
            onClose={() => ref.current?.close()}
          />
        )}
      </dialog>
    </>
  );
}

function ShareForm({ docId, docTitle, owner, onClose }: Props & { onClose: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Share[]>(`/api/documents/${docId}/shares`)
      .then(setShares)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load sharing."));
  }, [docId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const share = await api<Share>(`/api/documents/${docId}/shares`, {
        method: "POST",
        json: { email, role },
      });
      setShares((prev) => [...(prev ?? []).filter((s) => s.userId !== share.userId), share]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setError(null);
    const prev = shares;
    setShares((s) => (s ?? []).filter((x) => x.userId !== userId));
    try {
      await api(`/api/documents/${docId}/shares/${userId}`, { method: "DELETE" });
    } catch (err) {
      setShares(prev);
      setError(err instanceof Error ? err.message : "Couldn't remove access.");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Share “{docTitle}”</h2>
          <p className="mt-1 text-sm text-ink-muted">People you add can open it from their dashboard.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
          ✕
        </button>
      </div>

      <form onSubmit={add} className="mt-5 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@ajaia.test"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded border border-line-strong px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ShareRole)}
          aria-label="Role"
          className="rounded border border-line-strong bg-paper px-2 py-2 text-sm"
        >
          <option value="editor">Can edit</option>
          <option value="viewer">Can view</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-accent px-3 py-2 text-sm font-medium text-paper hover:bg-accent-hover disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <ul className="mt-5 divide-y divide-line border-t border-line">
        <li className="flex items-center justify-between py-3 text-sm">
          <span>
            <span className="font-medium">{owner.name}</span>
            <span className="ml-2 text-ink-muted">{owner.email}</span>
          </span>
          <RoleBadge role="owner" />
        </li>
        {shares === null && !error && <li className="py-3 text-sm text-ink-faint">Loading…</li>}
        {shares?.map((s) => (
          <li key={s.userId} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-ink-muted">{s.email}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <RoleBadge role={s.role} />
              <button type="button" onClick={() => remove(s.userId)} className="text-ink-faint hover:text-danger">
                Remove
              </button>
            </span>
          </li>
        ))}
        {shares?.length === 0 && (
          <li className="py-3 text-sm text-ink-muted">Only you can see this document so far.</li>
        )}
      </ul>
    </div>
  );
}

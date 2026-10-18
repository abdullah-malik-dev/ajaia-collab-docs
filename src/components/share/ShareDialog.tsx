"use client";

import { useEffect, useRef, useState } from "react";
import { RoleBadge } from "@/components/RoleBadge";
import type { ShareRole } from "@/db/schema";
import { api } from "@/lib/client-api";

type Share = { userId: string; name: string; email: string; role: ShareRole };
type Request = { userId: string; name: string; email: string; requestedRole: ShareRole };

type Props = {
  docId: string;
  docTitle: string;
  owner: { name: string; email: string };
  /** Open access requests when the page rendered; shown as a count on the button. */
  pendingCount?: number;
};

export function ShareButton({ docId, docTitle, owner, pendingCount = 0 }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(pendingCount);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
        className="inline-flex items-center gap-2 rounded border border-line-strong bg-paper px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
      >
        Share
        {count > 0 && (
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-paper"
            title={`${count} access request${count === 1 ? "" : "s"}`}
          >
            {count}
          </span>
        )}
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
            onPendingChange={setCount}
            onClose={() => ref.current?.close()}
          />
        )}
      </dialog>
    </>
  );
}

function ShareForm({
  docId,
  docTitle,
  owner,
  onClose,
  onPendingChange,
}: Omit<Props, "pendingCount"> & { onClose: () => void; onPendingChange: (n: number) => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Share[]>(`/api/documents/${docId}/shares`)
      .then(setShares)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load sharing."));
    api<Request[]>(`/api/documents/${docId}/requests`)
      .then((r) => {
        setRequests(r);
        onPendingChange(r.length);
      })
      .catch(() => {});
  }, [docId, onPendingChange]);

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

  async function decide(req: Request, decision: "approve" | "decline") {
    setError(null);
    try {
      await api(`/api/documents/${docId}/requests/${req.userId}`, { method: "PATCH", json: { decision } });
      const next = requests.filter((r) => r.userId !== req.userId);
      setRequests(next);
      onPendingChange(next.length);
      if (decision === "approve") {
        setShares((prev) => [
          ...(prev ?? []).filter((s) => s.userId !== req.userId),
          { userId: req.userId, name: req.name, email: req.email, role: req.requestedRole },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the request.");
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

      {requests.length > 0 && (
        <section className="mt-5 rounded border border-accent/30 bg-accent-soft/50 p-3">
          <h3 className="text-sm font-medium">Access requests</h3>
          <ul className="mt-2 divide-y divide-line/70">
            {requests.map((r) => (
              <li key={r.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-ink-muted">wants to {r.requestedRole === "editor" ? "edit" : "view"}</span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => decide(r, "approve")}
                    className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-paper hover:bg-accent-hover"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(r, "decline")}
                    className="rounded border border-line-strong px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

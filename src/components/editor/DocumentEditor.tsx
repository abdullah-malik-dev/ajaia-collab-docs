"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import type { DocContent } from "@/db/schema";
import { api } from "@/lib/client-api";
import { baseExtensions } from "@/lib/editor-extensions";
import { TITLE_MAX } from "@/lib/validation";
import { DownloadMenu } from "./DownloadMenu";
import { Toolbar } from "./Toolbar";
import { useAutosave, type SaveStatus } from "./useAutosave";

export type EditorDoc = {
  id: string;
  title: string;
  content: DocContent;
  updatedAt: string;
};

type Props = {
  doc: EditorDoc;
  canEdit: boolean;
  ownerName: string;
};

const DEFAULT_TITLE = "Untitled document";

const extensions = [...baseExtensions(), Placeholder.configure({ placeholder: "Start writing…" })];

export function DocumentEditor({ doc, canEdit, ownerName }: Props) {
  const [title, setTitle] = useState(doc.title);
  const { status, errorMessage, lastSavedAt, queue, flush, reset, hasUnsavedChanges } = useAutosave(doc.id, doc.updatedAt);

  const editor = useEditor({
    extensions,
    content: doc.content as JSONContent,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap-editor", "aria-label": "Document body" },
    },
    onUpdate: ({ editor: e }) => queue({ content: e.getJSON() as DocContent }),
  });

  useEffect(() => {
    document.title = `${title || DEFAULT_TITLE} – Ajaia Docs`;
  }, [title]);

  function onTitleChange(value: string) {
    setTitle(value);
    const trimmed = value.trim();
    if (trimmed) queue({ title: trimmed });
  }

  function onTitleBlur() {
    if (!title.trim()) {
      setTitle(DEFAULT_TITLE);
      queue({ title: DEFAULT_TITLE });
    }
  }

  async function reloadLatest() {
    const latest = await api<EditorDoc>(`/api/documents/${doc.id}`);
    editor?.commands.setContent(latest.content as JSONContent, { emitUpdate: false });
    setTitle(latest.title);
    reset(latest.updatedAt);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="print:hidden sticky top-0 z-10 border-b border-line bg-paper">
        <div className="mx-auto max-w-page px-6 pt-4">
          <div className="flex items-center gap-4">
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleBlur}
              readOnly={!canEdit}
              maxLength={TITLE_MAX}
              aria-label="Document title"
              placeholder={DEFAULT_TITLE}
              className="min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight placeholder:text-ink-faint focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 read-only:cursor-default"
            />
            {canEdit ? (
              <StatusLabel status={status} errorMessage={errorMessage} lastSavedAt={lastSavedAt} onRetry={flush} />
            ) : (
              <span className="shrink-0 text-sm text-ink-muted">View only</span>
            )}
            <DownloadMenu editor={editor} title={title || DEFAULT_TITLE} />
          </div>
          <div className="mt-2 pb-2">
            {canEdit && editor ? (
              <Toolbar editor={editor} />
            ) : (
              <p className="py-1 text-sm text-ink-muted">
                You can read this document. Ask {ownerName} for edit access to make changes.
              </p>
            )}
          </div>
        </div>
        {status === "conflict" && (
          <ConflictBanner onReload={reloadLatest} />
        )}
      </div>

      <div className="flex-1 px-4 py-8 sm:px-6 print:p-0">
        <div className="mx-auto min-h-[60vh] max-w-page rounded-sm border border-line bg-paper px-8 py-10 sm:px-16 sm:py-14 print:min-h-0 print:max-w-none print:border-0 print:p-0">
          <EditorContent editor={editor} />
        </div>
      </div>
      {hasUnsavedChanges && <span className="sr-only" aria-live="polite">You have unsaved changes.</span>}
    </div>
  );
}

function StatusLabel({
  status,
  errorMessage,
  lastSavedAt,
  onRetry,
}: {
  status: SaveStatus;
  errorMessage: string | null;
  lastSavedAt: string;
  onRetry: () => void;
}) {
  const base = "shrink-0 text-sm";
  switch (status) {
    case "saved":
      return (
        <span className={`${base} text-ink-faint`} title={new Date(lastSavedAt).toLocaleString()}>
          Saved <SavedTime iso={lastSavedAt} />
        </span>
      );
    case "dirty":
      return <span className={`${base} text-ink-faint`}>Unsaved changes</span>;
    case "saving":
      return <span className={`${base} text-ink-muted`}>Saving…</span>;
    case "error":
      return (
        <span className={`${base} text-danger`}>
          {errorMessage ?? "Couldn't save."}{" "}
          <button type="button" onClick={onRetry} className="underline">
            Retry
          </button>
        </span>
      );
    case "conflict":
      return <span className={`${base} text-danger`}>Not saved</span>;
  }
}

/** Rendered after mount only: the local time differs between server and browser. */
function SavedTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
  }, [iso]);
  return <>{text}</>;
}

function ConflictBanner({ onReload }: { onReload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="border-t border-danger/30 bg-danger-soft">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm text-danger">
        <span>
          Someone else saved this document after you opened it. Reload to see their version; your
          unsaved edits here will be discarded.
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onReload();
            } finally {
              setBusy(false);
            }
          }}
          className="rounded bg-danger px-3 py-1.5 font-medium text-paper hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Reloading…" : "Reload latest"}
        </button>
      </div>
    </div>
  );
}

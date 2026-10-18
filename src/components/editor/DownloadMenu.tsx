"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { DocContent } from "@/db/schema";
import { docToMarkdown, downloadText, fileNameFor, wrapHtmlDocument } from "@/lib/export";

type Props = { editor: Editor | null; title: string };

/** Exports come from the editor's current content, so unsaved edits are included. */
export function DownloadMenu({ editor, title }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute("open");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function asMarkdown() {
    if (!editor) return;
    downloadText(fileNameFor(title, "md"), "text/markdown", docToMarkdown(editor.getJSON() as DocContent));
    close();
  }
  function asHtml() {
    if (!editor) return;
    downloadText(fileNameFor(title, "html"), "text/html", wrapHtmlDocument(title, editor.getHTML()));
    close();
  }
  function print() {
    close();
    window.print();
  }

  const item =
    "block w-full px-3 py-2 text-left text-sm text-ink hover:bg-canvas disabled:opacity-50";

  return (
    <details ref={ref} className="relative shrink-0">
      <summary className="cursor-pointer select-none list-none rounded border border-line-strong bg-paper px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden">
        Download
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-56 rounded border border-line bg-paper py-1">
        <button type="button" onClick={asMarkdown} disabled={!editor} className={item}>
          Markdown (.md)
        </button>
        <button type="button" onClick={asHtml} disabled={!editor} className={item}>
          Web page (.html)
        </button>
        <button type="button" onClick={print} className={`${item} border-t border-line`}>
          Print or save as PDF
        </button>
      </div>
    </details>
  );
}

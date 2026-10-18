"use client";

import { useEditorState, type Editor } from "@tiptap/react";

type Item = {
  label: string;
  title: string;
  active?: keyof ActiveState;
  run: (e: Editor) => boolean;
  enabled?: (e: Editor) => boolean;
  className?: string;
};

type ActiveState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  bulletList: boolean;
  orderedList: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const GROUPS: Item[][] = [
  [
    { label: "Undo", title: "Undo (Ctrl+Z)", run: (e) => e.chain().focus().undo().run(), enabled: (e) => e.can().undo() },
    { label: "Redo", title: "Redo (Ctrl+Y)", run: (e) => e.chain().focus().redo().run(), enabled: (e) => e.can().redo() },
  ],
  [
    { label: "B", title: "Bold (Ctrl+B)", active: "bold", run: (e) => e.chain().focus().toggleBold().run(), className: "font-bold" },
    { label: "I", title: "Italic (Ctrl+I)", active: "italic", run: (e) => e.chain().focus().toggleItalic().run(), className: "italic" },
    { label: "U", title: "Underline (Ctrl+U)", active: "underline", run: (e) => e.chain().focus().toggleUnderline().run(), className: "underline" },
  ],
  [
    { label: "H1", title: "Heading 1", active: "h1", run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "H2", title: "Heading 2", active: "h2", run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "Heading 3", active: "h3", run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  ],
  [
    { label: "• List", title: "Bullet list", active: "bulletList", run: (e) => e.chain().focus().toggleBulletList().run() },
    { label: "1. List", title: "Numbered list", active: "orderedList", run: (e) => e.chain().focus().toggleOrderedList().run() },
  ],
];

export function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }): ActiveState => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5 border-r border-line pr-1.5 last:border-r-0 mr-1">
          {group.map((item) => {
            const active = item.active ? state[item.active] : false;
            const enabled = item.enabled ? item.enabled(editor) : true;
            return (
              <button
                key={item.label}
                type="button"
                title={item.title}
                aria-label={item.title}
                aria-pressed={item.active ? active : undefined}
                disabled={!enabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => item.run(editor)}
                className={`min-w-8 rounded px-2 py-1 text-sm leading-5 transition-colors disabled:opacity-40 ${
                  active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-canvas hover:text-ink"
                } ${item.className ?? ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

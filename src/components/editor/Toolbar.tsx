"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Redo2,
  SquareCode,
  Strikethrough,
  TextQuote,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HIGHLIGHT_COLORS } from "@/lib/editor-extensions";

type State = ReturnType<typeof select>;

function select({ editor: e }: { editor: Editor }) {
  return {
    bold: e.isActive("bold"),
    italic: e.isActive("italic"),
    underline: e.isActive("underline"),
    strike: e.isActive("strike"),
    code: e.isActive("code"),
    link: e.isActive("link"),
    bulletList: e.isActive("bulletList"),
    orderedList: e.isActive("orderedList"),
    blockquote: e.isActive("blockquote"),
    codeBlock: e.isActive("codeBlock"),
    heading: e.isActive("heading", { level: 1 })
      ? "1"
      : e.isActive("heading", { level: 2 })
        ? "2"
        : e.isActive("heading", { level: 3 })
          ? "3"
          : "0",
    canUndo: e.can().undo(),
    canRedo: e.can().redo(),
    highlight: e.isActive("highlight"),
    highlightColor: (e.getAttributes("highlight").color as string | undefined) ?? null,
    align: e.isActive({ textAlign: "center" })
      ? "center"
      : e.isActive({ textAlign: "right" })
        ? "right"
        : e.isActive({ textAlign: "justify" })
          ? "justify"
          : "left",
    alignCenter: e.isActive({ textAlign: "center" }),
    alignRight: e.isActive({ textAlign: "right" }),
    alignJustify: e.isActive({ textAlign: "justify" }),
    alignLeft: !e.isActive({ textAlign: "center" }) && !e.isActive({ textAlign: "right" }) && !e.isActive({ textAlign: "justify" }),
  };
}

type Item = {
  icon: LucideIcon;
  title: string;
  active?: keyof State;
  enabled?: keyof State;
  run: (e: Editor) => boolean;
};

const MARKS: Item[] = [
  { icon: Bold, title: "Bold (Ctrl+B)", active: "bold", run: (e) => e.chain().focus().toggleBold().run() },
  { icon: Italic, title: "Italic (Ctrl+I)", active: "italic", run: (e) => e.chain().focus().toggleItalic().run() },
  { icon: Underline, title: "Underline (Ctrl+U)", active: "underline", run: (e) => e.chain().focus().toggleUnderline().run() },
  { icon: Strikethrough, title: "Strikethrough (Ctrl+Shift+S)", active: "strike", run: (e) => e.chain().focus().toggleStrike().run() },
  { icon: Code, title: "Inline code (Ctrl+E)", active: "code", run: (e) => e.chain().focus().toggleCode().run() },
];

const BLOCKS: Item[] = [
  { icon: List, title: "Bullet list (Ctrl+Shift+8)", active: "bulletList", run: (e) => e.chain().focus().toggleBulletList().run() },
  { icon: ListOrdered, title: "Numbered list (Ctrl+Shift+7)", active: "orderedList", run: (e) => e.chain().focus().toggleOrderedList().run() },
  { icon: TextQuote, title: "Quote (Ctrl+Shift+B)", active: "blockquote", run: (e) => e.chain().focus().toggleBlockquote().run() },
  { icon: SquareCode, title: "Code block (Ctrl+Alt+C)", active: "codeBlock", run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { icon: Minus, title: "Horizontal rule", run: (e) => e.chain().focus().setHorizontalRule().run() },
];

const ALIGN: Item[] = [
  { icon: AlignLeft, title: "Align left (Ctrl+Shift+L)", active: "alignLeft", run: (e) => e.chain().focus().setTextAlign("left").run() },
  { icon: AlignCenter, title: "Align center (Ctrl+Shift+E)", active: "alignCenter", run: (e) => e.chain().focus().setTextAlign("center").run() },
  { icon: AlignRight, title: "Align right (Ctrl+Shift+R)", active: "alignRight", run: (e) => e.chain().focus().setTextAlign("right").run() },
  { icon: AlignJustify, title: "Justify (Ctrl+Shift+J)", active: "alignJustify", run: (e) => e.chain().focus().setTextAlign("justify").run() },
];

const HISTORY: Item[] = [
  { icon: Undo2, title: "Undo (Ctrl+Z)", enabled: "canUndo", run: (e) => e.chain().focus().undo().run() },
  { icon: Redo2, title: "Redo (Ctrl+Y)", enabled: "canRedo", run: (e) => e.chain().focus().redo().run() },
];

export function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({ editor, selector: select });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [highlightOpen, setHighlightOpen] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!highlightRef.current?.contains(e.target as Node)) setHighlightOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [highlightOpen]);

  function openLink() {
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  }

  function applyLink(e: React.FormEvent) {
    e.preventDefault();
    const url = normalizeUrl(linkUrl);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
    setLinkOpen(false);
  }

  function setHeading(value: string) {
    const chain = editor.chain().focus();
    if (value === "0") chain.setParagraph().run();
    else chain.setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
  }

  return (
    <div className="relative">
      <div role="toolbar" aria-label="Formatting" className="no-scrollbar -mx-6 flex items-center gap-x-1 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:gap-y-1 sm:overflow-visible sm:px-0">
        <Group>
          {HISTORY.map((item) => (
            <IconButton key={item.title} item={item} state={state} editor={editor} />
          ))}
        </Group>
        <Group>
          <select
            aria-label="Text style"
            value={state.heading}
            onChange={(e) => setHeading(e.target.value)}
            className="h-8 rounded border-0 bg-transparent pl-1 pr-6 text-sm text-ink hover:bg-canvas focus-visible:ring-1"
          >
            <option value="0">Normal text</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </Group>
        <Group>
          {MARKS.map((item) => (
            <IconButton key={item.title} item={item} state={state} editor={editor} />
          ))}
          <div ref={highlightRef} className="relative">
            <button
              type="button"
              title="Highlight (Ctrl+Shift+H)"
              aria-label="Highlight"
              aria-pressed={state.highlight}
              aria-expanded={highlightOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHighlightOpen((o) => !o)}
              className={btnClass(state.highlight)}
            >
              <Highlighter size={16} strokeWidth={2} />
            </button>
            {highlightOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded border border-line bg-paper p-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={`Highlight ${c.name.toLowerCase()}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color: c.value }).run();
                      setHighlightOpen(false);
                    }}
                    className={`h-6 w-6 rounded-sm border ${state.highlightColor === c.value ? "border-ink" : "border-line-strong"}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                  className="ml-1 px-1.5 text-xs text-ink-muted hover:text-ink"
                >
                  None
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            title="Link (Ctrl+K)"
            aria-label="Link"
            aria-pressed={state.link}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLink}
            className={btnClass(state.link)}
          >
            <Link size={16} strokeWidth={2} />
          </button>
        </Group>
        <Group>
          {ALIGN.map((item) => (
            <IconButton key={item.title} item={item} state={state} editor={editor} />
          ))}
        </Group>
        <Group last>
          {BLOCKS.map((item) => (
            <IconButton key={item.title} item={item} state={state} editor={editor} />
          ))}
        </Group>
      </div>

      {linkOpen && (
        <form
          onSubmit={applyLink}
          className="absolute left-0 top-full z-20 mt-1 flex w-80 max-w-[calc(100vw-3rem)] items-center gap-2 rounded border border-line bg-paper p-2"
        >
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setLinkOpen(false)}
            placeholder="https://example.com"
            aria-label="Link URL"
            className="min-w-0 flex-1 rounded border border-line-strong px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded bg-accent px-2.5 py-1 text-sm font-medium text-paper hover:bg-accent-hover">
            {linkUrl.trim() ? "Apply" : "Remove"}
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="px-1 text-sm text-ink-muted hover:text-ink">
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

function Group({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-0.5 ${last ? "" : "mr-1 border-r border-line pr-1.5"}`}>{children}</div>
  );
}

function IconButton({ item, state, editor }: { item: Item; state: State; editor: Editor }) {
  const active = item.active ? Boolean(state[item.active]) : false;
  const enabled = item.enabled ? Boolean(state[item.enabled]) : true;
  const Icon = item.icon;
  return (
    <button
      type="button"
      title={item.title}
      aria-label={item.title}
      aria-pressed={item.active ? active : undefined}
      disabled={!enabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => item.run(editor)}
      className={btnClass(active)}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

function btnClass(active: boolean) {
  return `inline-flex h-8 w-8 items-center justify-center rounded transition-colors disabled:opacity-35 ${
    active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-canvas hover:text-ink"
  }`;
}

function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^(https?:|mailto:)/i.test(s)) return s;
  return `https://${s}`;
}

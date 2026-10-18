import type { DocContent } from "@/db/schema";

type Node = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

/**
 * TipTap JSON -> Markdown for the schema this app uses: headings, paragraphs,
 * lists, blockquotes, code blocks, rules, hard breaks, and the inline marks.
 */
export function docToMarkdown(doc: DocContent): string {
  return blocks((doc as Node).content ?? [], 0).join("\n\n").trim() + "\n";
}

function blocks(nodes: Node[], indent: number): string[] {
  return nodes.map((n) => block(n, indent)).filter((s): s is string => s !== null);
}

function block(node: Node, indent: number): string | null {
  const pad = "  ".repeat(indent);
  switch (node.type) {
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      return `${pad}${"#".repeat(Math.min(Math.max(level, 1), 6))} ${inline(node.content ?? [])}`;
    }
    case "paragraph":
      return pad + inline(node.content ?? []);
    case "bulletList":
      return (node.content ?? []).map((item) => listItem(item, indent, "- ")).join("\n");
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1);
      return (node.content ?? []).map((item, i) => listItem(item, indent, `${start + i}. `)).join("\n");
    }
    case "blockquote":
      return blocks(node.content ?? [], 0)
        .join("\n\n")
        .split("\n")
        .map((line) => `${pad}> ${line}`)
        .join("\n");
    case "codeBlock": {
      const lang = typeof node.attrs?.language === "string" ? node.attrs.language : "";
      const text = (node.content ?? []).map((n) => n.text ?? "").join("");
      return `${pad}\`\`\`${lang}\n${text}\n${pad}\`\`\``;
    }
    case "horizontalRule":
      return `${pad}---`;
    default:
      return node.content ? blocks(node.content, indent).join("\n\n") : null;
  }
}

function listItem(item: Node, indent: number, marker: string): string {
  const pad = "  ".repeat(indent);
  const [first, ...rest] = item.content ?? [];
  const head = first ? (block(first, 0) ?? "") : "";
  const tail = rest.map((n) => block(n, indent + 1)).filter(Boolean);
  return [pad + marker + head.trimStart(), ...tail].join("\n");
}

function inline(nodes: Node[]): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n";
      if (n.type !== "text") return "";
      let t = n.text ?? "";
      const marks = n.marks ?? [];
      const has = (type: string) => marks.some((m) => m.type === type);
      if (has("code")) return `\`${t}\``;
      if (has("bold")) t = `**${t}**`;
      if (has("italic")) t = `_${t}_`;
      if (has("strike")) t = `~~${t}~~`;
      if (has("underline")) t = `<u>${t}</u>`;
      const link = marks.find((m) => m.type === "link");
      if (link && typeof link.attrs?.href === "string") t = `[${t}](${link.attrs.href})`;
      return t;
    })
    .join("");
}

/** Standalone HTML file with minimal, readable styling. */
export function wrapHtmlDocument(title: string, bodyHtml: string): string {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
  body { max-width: 44rem; margin: 3rem auto; padding: 0 1.5rem; font: 17px/1.6 Georgia, serif; color: #1c2127; }
  h1 { font-size: 2rem; line-height: 1.2; } h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; }
  ul, ol { padding-left: 1.5rem; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 3px solid #d8dde3; color: #5f6b78; }
  code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #edeff2; padding: 0 0.25em; border-radius: 3px; }
  pre { background: #edeff2; padding: 1rem; border-radius: 4px; overflow-x: auto; } pre code { background: none; padding: 0; }
  hr { border: 0; border-top: 1px solid #d8dde3; margin: 2rem 0; }
  a { color: #2e5c8a; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

export function fileNameFor(title: string, ext: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "document"}.${ext}`;
}

export function downloadText(name: string, mime: string, text: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Word count over the document's text, blocks separated by whitespace. */
export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

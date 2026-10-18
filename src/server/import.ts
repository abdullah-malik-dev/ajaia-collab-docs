import { generateJSON } from "@tiptap/html";
import mammoth from "mammoth";
import { marked } from "marked";
import type { DocContent } from "@/db/schema";
import { baseExtensions } from "@/lib/editor-extensions";
import { TITLE_MAX, UPLOAD_MAX_BYTES } from "@/lib/validation";
import { ServiceError } from "./errors";

export const SUPPORTED_EXTENSIONS = ["txt", "md", "docx"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export const SUPPORTED_TYPES_LABEL = ".txt, .md or .docx";

export type Upload = { name: string; bytes: Uint8Array };

/**
 * Converts an uploaded file to a title and TipTap JSON. Type is decided by
 * file extension; browser-supplied MIME types are too inconsistent to trust.
 */
export async function convertUpload(upload: Upload): Promise<{ title: string; content: DocContent }> {
  if (upload.bytes.byteLength > UPLOAD_MAX_BYTES) {
    throw new ServiceError("file_too_large", `That file is over 2 MB. Try a smaller ${SUPPORTED_TYPES_LABEL} file.`);
  }
  const ext = extensionOf(upload.name);
  if (!ext) {
    throw new ServiceError(
      "unsupported_file",
      `That file type isn't supported. Choose a ${SUPPORTED_TYPES_LABEL} file.`,
    );
  }
  const html = await toHtml(ext, upload.bytes);
  const content = htmlToDoc(html);
  return { title: titleFromName(upload.name), content };
}

export function extensionOf(name: string): SupportedExtension | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "markdown") return "md";
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext) ? (ext as SupportedExtension) : null;
}

async function toHtml(ext: SupportedExtension, bytes: Uint8Array): Promise<string> {
  switch (ext) {
    case "txt":
      return plainTextToHtml(new TextDecoder("utf-8").decode(bytes));
    case "md":
      return marked.parse(new TextDecoder("utf-8").decode(bytes), { async: false, gfm: true });
    case "docx": {
      const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) }, { styleMap: ["u => u"] });
      return result.value;
    }
  }
}

/** Blank lines separate paragraphs; single newlines become line breaks. */
export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "<p></p>";
  return normalized
    .split(/\n{2,}/)
    .map((para) => `<p>${para.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("");
}

/** Parses HTML with the editor's own schema; anything outside it is dropped or flattened to text. */
export function htmlToDoc(html: string): DocContent {
  const json = generateJSON(html, baseExtensions()) as DocContent;
  if (!json.content || json.content.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return json;
}

export function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, TITLE_MAX);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

/**
 * The document schema, shared by the editor and the server-side importer so
 * imported files produce exactly what the editor can render and edit.
 *
 * Blocks: paragraph, H1-H3, bullet/numbered lists, blockquote, code block, rule.
 * Marks: bold, italic, underline, strikethrough, inline code, link, highlight.
 * Attributes: text alignment on paragraphs and headings.
 */
export const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FFF3A3" },
  { name: "Green", value: "#CDEFD3" },
  { name: "Blue", value: "#CFE3F7" },
  { name: "Pink", value: "#F8D5E3" },
] as const;

export function baseExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
    Highlight.configure({ multicolor: true }),
  ];
}

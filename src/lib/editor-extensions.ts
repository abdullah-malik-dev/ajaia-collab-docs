import StarterKit from "@tiptap/starter-kit";

/**
 * The document schema, shared by the editor and the server-side importer so
 * imported files produce exactly what the editor can render and edit.
 *
 * Blocks: paragraph, H1-H3, bullet/numbered lists, blockquote, code block, rule.
 * Marks: bold, italic, underline, strikethrough, inline code, link.
 */
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
  ];
}

import StarterKit from "@tiptap/starter-kit";

/**
 * The document schema: bold, italic, underline, H1-H3, bullet and numbered
 * lists, hard breaks. Shared by the editor and the server-side importer so
 * imported files produce exactly what the editor can render and edit.
 */
export function baseExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: false,
      strike: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
    }),
  ];
}

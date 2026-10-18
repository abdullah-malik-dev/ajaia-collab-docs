import { describe, expect, it } from "vitest";
import { ServiceError } from "@/server/errors";
import { convertUpload, extensionOf, plainTextToHtml, titleFromName } from "@/server/import";
import { UPLOAD_MAX_BYTES } from "@/lib/validation";

const enc = new TextEncoder();

type Node = { type: string; attrs?: Record<string, unknown>; content?: Node[]; text?: string; marks?: { type: string }[] };

describe("markdown import", () => {
  it("maps headings, lists and marks to TipTap nodes", async () => {
    const md = [
      "# Title",
      "",
      "Some **bold** and *italic* text.",
      "",
      "## Section",
      "",
      "- one",
      "- two",
      "",
      "1. first",
      "2. second",
      "",
    ].join("\n");
    const { title, content } = await convertUpload({ name: "Project-notes.md", bytes: enc.encode(md) });
    const nodes = content.content as Node[];

    expect(title).toBe("Project notes");
    expect(nodes.map((n) => n.type)).toEqual(["heading", "paragraph", "heading", "bulletList", "orderedList"]);
    expect(nodes[0].attrs?.level).toBe(1);
    expect(nodes[2].attrs?.level).toBe(2);

    const para = nodes[1].content!;
    expect(para.find((t) => t.text === "bold")?.marks).toEqual([{ type: "bold" }]);
    expect(para.find((t) => t.text === "italic")?.marks).toEqual([{ type: "italic" }]);

    expect(nodes[3].content).toHaveLength(2);
    expect(nodes[3].content![0].type).toBe("listItem");
    expect(nodes[4].content).toHaveLength(2);
  });

  it("flattens unsupported markdown (links, code) to plain text", async () => {
    const { content } = await convertUpload({ name: "x.md", bytes: enc.encode("[link](https://a.b) and `code`") });
    const para = (content.content as Node[])[0];
    const text = para.content!.map((t) => t.text).join("");
    expect(text).toBe("link and code");
    expect(para.content!.every((t) => !t.marks || t.marks.length === 0)).toBe(true);
  });
});

describe("plain text import", () => {
  it("escapes HTML and splits paragraphs on blank lines", () => {
    expect(plainTextToHtml("a <b>x</b>\nb\n\nc & d")).toBe("<p>a &lt;b&gt;x&lt;/b&gt;<br>b</p><p>c &amp; d</p>");
  });
  it("produces paragraphs with hard breaks", async () => {
    const { content } = await convertUpload({ name: "n.txt", bytes: enc.encode("line one\nline two\n\nnext") });
    const nodes = content.content as Node[];
    expect(nodes.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    expect(nodes[0].content!.map((n) => n.type)).toEqual(["text", "hardBreak", "text"]);
  });
  it("gives an empty file one empty paragraph", async () => {
    const { content } = await convertUpload({ name: "empty.txt", bytes: enc.encode("  \n ") });
    expect(content.content).toEqual([{ type: "paragraph" }]);
  });
});

describe("rejections", () => {
  it("rejects unsupported types with unsupported_file", async () => {
    await expect(convertUpload({ name: "slides.pdf", bytes: enc.encode("%PDF") })).rejects.toMatchObject({
      code: "unsupported_file",
    });
    await expect(convertUpload({ name: "noext", bytes: enc.encode("x") })).rejects.toBeInstanceOf(ServiceError);
  });
  it("rejects files over the size cap with file_too_large", async () => {
    const bytes = new Uint8Array(UPLOAD_MAX_BYTES + 1);
    await expect(convertUpload({ name: "big.txt", bytes })).rejects.toMatchObject({ code: "file_too_large" });
  });
});

describe("helpers", () => {
  it("detects extensions case-insensitively and maps .markdown to md", () => {
    expect(extensionOf("A.TXT")).toBe("txt");
    expect(extensionOf("readme.markdown")).toBe("md");
    expect(extensionOf("report.DOCX")).toBe("docx");
    expect(extensionOf("archive.zip")).toBeNull();
  });
  it("derives a readable title from the file name", () => {
    expect(titleFromName("my_weekly-report.docx")).toBe("my weekly report");
    expect(titleFromName(".md")).toBe("Imported document");
  });
});

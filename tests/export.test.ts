import { describe, expect, it } from "vitest";
import { docToMarkdown, fileNameFor } from "@/lib/export";

const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const li = (...nodes: unknown[]) => ({ type: "listItem", content: nodes });

describe("docToMarkdown", () => {
  it("serializes headings, marks, nested lists and hard breaks", () => {
    const doc = {
      type: "doc" as const,
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Some " },
            { type: "text", marks: [{ type: "bold" }], text: "bold" },
            { type: "text", text: " and " },
            { type: "text", marks: [{ type: "italic" }, { type: "underline" }], text: "both" },
            { type: "text", text: " " },
            { type: "text", marks: [{ type: "highlight", attrs: { color: "#FFF3A3" } }], text: "hot" },
          ],
        },
        { type: "bulletList", content: [li(p("one")), li(p("two"), { type: "bulletList", content: [li(p("nested"))] })] },
        { type: "orderedList", content: [li(p("first")), li(p("second"))] },
        { type: "paragraph", content: [{ type: "text", text: "line a" }, { type: "hardBreak" }, { type: "text", text: "line b" }] },
      ],
    };
    expect(docToMarkdown(doc)).toBe(
      [
        "# Title",
        "",
        "Some **bold** and <u>_both_</u> <mark>hot</mark>",
        "",
        "- one",
        "- two",
        "  - nested",
        "",
        "1. first",
        "2. second",
        "",
        "line a  ",
        "line b",
        "",
      ].join("\n"),
    );
  });
});

describe("fileNameFor", () => {
  it("slugifies titles and falls back sensibly", () => {
    expect(fileNameFor("Welcome to Ajaia Docs!", "md")).toBe("welcome-to-ajaia-docs.md");
    expect(fileNameFor("???", "html")).toBe("document.html");
  });
});

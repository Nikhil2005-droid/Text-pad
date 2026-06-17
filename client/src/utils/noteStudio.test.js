import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractPlainTextFromHtml,
  getNoteEditorMetrics,
  getNoteTextSizeOption,
  getRichTextWordCount,
  normalizeNoteHtml,
  plainTextToNoteHtml,
} from "./noteStudio.js";

describe("noteStudio utilities", () => {
  it("converts plain text into safe paragraph HTML", () => {
    assert.equal(
      plainTextToNoteHtml("First line\n<script>alert(1)</script>"),
      "<p>First line</p><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>"
    );
  });

  it("uses a blank paragraph for empty notes", () => {
    assert.equal(plainTextToNoteHtml("   "), "<p><br /></p>");
  });

  it("normalizes unsupported block tags and strips unsupported inline markup", () => {
    assert.equal(
      normalizeNoteHtml(
        '<div><span data-script-session="x">Hello</span> <b>bold</b> <i>soft</i> <img src=x /></div>'
      ),
      "<p>Hello <strong>bold</strong> <em>soft</em> </p>"
    );
  });

  it("falls back to plain text when HTML has no note block tags", () => {
    assert.equal(
      normalizeNoteHtml("<strong>Loose</strong> text", "fallback"),
      "<p>Loose text</p>"
    );
  });

  it("extracts plain text from normalized note HTML without browser APIs", () => {
    assert.equal(
      extractPlainTextFromHtml("<p>Alpha<br />Beta</p><h2>Heading</h2>"),
      "Alpha\nBeta\nHeading"
    );
  });

  it("counts rich text words from HTML", () => {
    assert.equal(
      getRichTextWordCount("<p>One two</p><p>three&nbsp;four</p>"),
      4
    );
  });

  it("falls back to comfortable text size for unknown values", () => {
    assert.equal(getNoteTextSizeOption("unknown").value, "comfortable");
  });

  it("calculates note metrics from language and text-size settings", () => {
    assert.deepEqual(
      getNoteEditorMetrics({ fontSize: "1.08rem", lineHeight: 2.2 }, "compact"),
      {
        fontSizeRem: 1.015,
        lineHeightRem: 2.024,
        ruleGapRem: 2.024,
        pageHeightPx: 980,
        pagePaddingX: 72,
        pagePaddingTop: 88,
        pagePaddingBottom: 92,
      }
    );
  });
});

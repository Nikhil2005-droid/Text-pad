export const DEFAULT_NOTE_TEXT_SIZE = "comfortable";
export const DEFAULT_NOTE_RULED_LINES = true;

const NOTE_TEXT_SIZE_LIBRARY = {
  compact: {
    value: "compact",
    label: "Compact",
    description: "Tighter text for denser pages and shorter page breaks.",
    previewGlyph: "A-",
    fontScale: 0.94,
    lineHeightScale: 0.92,
  },
  comfortable: {
    value: "comfortable",
    label: "Comfortable",
    description: "Balanced page rhythm for everyday writing.",
    previewGlyph: "A",
    fontScale: 1,
    lineHeightScale: 1,
  },
  large: {
    value: "large",
    label: "Large",
    description: "More generous reading size with a softer page cadence.",
    previewGlyph: "A+",
    fontScale: 1.14,
    lineHeightScale: 1.1,
  },
  grand: {
    value: "grand",
    label: "Grand",
    description: "Premium oversized text for focused writing and presentation notes.",
    previewGlyph: "AA",
    fontScale: 1.28,
    lineHeightScale: 1.18,
  },
};

export const NOTE_TEXT_SIZE_OPTIONS = Object.values(NOTE_TEXT_SIZE_LIBRARY);

const BLOCK_TAG_PATTERN = /<(\/?)(div|article|section)\b/gi;
const BOLD_TAG_PATTERN = /<(\/?)b\b/gi;
const ITALIC_TAG_PATTERN = /<(\/?)i\b/gi;
const NBSP_PATTERN = /\u00a0/g;

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeBlockLine(value = "") {
  const trimmed = value.replace(/\r/g, "");
  return trimmed.length > 0 ? trimmed : "<br />";
}

export function plainTextToNoteHtml(value = "") {
  const safeValue = typeof value === "string" ? value : "";
  const normalized = safeValue.replace(/\r/g, "");
  if (!normalized.trim()) {
    return "<p><br /></p>";
  }

  const paragraphs = normalized.split("\n").map((line) => {
    const escaped = escapeHtml(line);
    return `<p>${normalizeBlockLine(escaped)}</p>`;
  });

  return paragraphs.join("");
}

export function normalizeNoteHtml(html = "", fallbackPlainText = "") {
  const rawValue = typeof html === "string" ? html.trim() : "";
  if (!rawValue) {
    return plainTextToNoteHtml(fallbackPlainText);
  }

  const normalized = rawValue
    .replace(BLOCK_TAG_PATTERN, "<$1p")
    .replace(BOLD_TAG_PATTERN, "<$1strong")
    .replace(ITALIC_TAG_PATTERN, "<$1em")
    .replace(/\sdata-script-session="[^"]*"/gi, "")
    .replace(/<\/?span\b[^>]*>/gi, "")
    .replace(/<(?!\/?(p|h1|h2|h3|h4|strong|em|br)\b)[^>]+>/gi, "")
    .trim();

  if (!normalized) {
    return plainTextToNoteHtml(fallbackPlainText);
  }

  if (!/<(p|h1|h2|h3|h4)\b/i.test(normalized)) {
    return plainTextToNoteHtml(extractPlainTextFromHtml(normalized) || fallbackPlainText);
  }

  return normalized;
}

export function extractPlainTextFromHtml(html = "") {
  const normalized = typeof html === "string" ? html.trim() : "";
  if (!normalized) {
    return "";
  }

  if (typeof document === "undefined") {
    return normalized
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h1|h2|h3|h4)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(NBSP_PATTERN, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const container = document.createElement("div");
  container.innerHTML = normalized;

  const blockNodes = Array.from(
    container.querySelectorAll("p, h1, h2, h3, h4")
  );

  const text = blockNodes.length
    ? blockNodes
        .map((node) => node.textContent?.replace(NBSP_PATTERN, " ").trimEnd() ?? "")
        .join("\n")
    : container.textContent?.replace(NBSP_PATTERN, " ") ?? "";

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function getNoteTextSizeOption(value = DEFAULT_NOTE_TEXT_SIZE) {
  return NOTE_TEXT_SIZE_LIBRARY[value] ?? NOTE_TEXT_SIZE_LIBRARY[DEFAULT_NOTE_TEXT_SIZE];
}

function toRem(value) {
  const numeric = Number.parseFloat(`${value}`);
  return Number.isFinite(numeric) ? numeric : 1;
}

export function getNoteEditorMetrics(languageOption, textSize = DEFAULT_NOTE_TEXT_SIZE) {
  const sizeOption = getNoteTextSizeOption(textSize);
  const baseFontSize = toRem(languageOption?.fontSize ?? "1rem");
  const baseLineHeight = Number.parseFloat(`${languageOption?.lineHeight ?? 1.85}`);

  const fontSizeRem = Number((baseFontSize * sizeOption.fontScale).toFixed(3));
  const lineHeightRem = Number(
    (baseLineHeight * sizeOption.lineHeightScale).toFixed(3)
  );

  return {
    fontSizeRem,
    lineHeightRem,
    ruleGapRem: lineHeightRem,
    pageHeightPx: 980,
    pagePaddingX: 72,
    pagePaddingTop: 88,
    pagePaddingBottom: 92,
  };
}

export function getRichTextWordCount(value = "") {
  const text = extractPlainTextFromHtml(value);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

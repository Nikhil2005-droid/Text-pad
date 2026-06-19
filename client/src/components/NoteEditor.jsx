import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { transliterateTextAPI } from "../api.js";
import {
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_FONT_STYLE,
  DEFAULT_NOTE_LANGUAGE,
  getGoogleTransliterationLanguageCode,
  getLanguageDigitMap,
  getLanguageTransliterationMessage,
  getNoteFontClassName,
  getNoteFontOptions,
  getNoteLanguageOption,
  getNoteSurfaceStyle,
  getScriptLanguageConfig,
  normalizeNoteColor,
  transliterateRomanInput,
} from "../languages/index.js";
import {
  DEFAULT_NOTE_TEXT_SIZE,
  extractPlainTextFromHtml,
  getNoteEditorMetrics,
  getRichTextWordCount,
  normalizeNoteHtml,
} from "../utils/noteStudio.js";
import { AUTO_REPLACE_DEFAULTS } from "../utils/autoReplace.js";
import { useGoogleTransliterationStatus } from "./editor/hooks/useGoogleTransliterationStatus.js";
import NoteEditorEmptyState from "./editor/ui/NoteEditorEmptyState.jsx";
import NoteEditorHeader from "./editor/ui/NoteEditorHeader.jsx";
import NoteStudioPanel from "./editor/ui/NoteStudioPanel.jsx";
import NoteScriptKeyboard from "./NoteScriptKeyboard.jsx";
import StatusState from "./StatusState.jsx";

const SCRIPT_BOUNDARY_PATTERN = /^[,.;:!?()[\]{}'"-]$/;
const ROMAN_LETTER_PATTERN = /^[A-Za-z]$/;
const DEFAULT_EDITOR_HEIGHT = 420;

function normalizeCommandBlockTag(value = "") {
  return `${value}`.replace(/[<>]/g, "").trim().toLowerCase() || "p";
}

export default function NoteEditor({
  activeNoteId,
  isLoadingNotes,
  hasNotes,
  title,
  content,
  contentHtml,
  setTitle,
  setContent,
  onSave,
  onFinishSave,
  onCreateNote,
  isDirty,
  saveStatus,
  lastSavedAt,
  autoReplaceEnabled = true,
  ruledLinesEnabled = true,
  noteLanguage = DEFAULT_NOTE_LANGUAGE,
  onNoteLanguageChange,
  isUpdatingNoteLanguage = false,
  noteFontStyle = DEFAULT_NOTE_FONT_STYLE,
  onNoteFontStyleChange,
  isUpdatingNoteFont = false,
  noteColor = DEFAULT_NOTE_COLOR,
  onNoteColorChange,
  isUpdatingNoteColor = false,
  noteTextSize = DEFAULT_NOTE_TEXT_SIZE,
  onNoteTextSizeChange,
  noteRuledLines = true,
  onNoteRuledLinesChange,
  isFocusMode = false,
  onToggleFocusMode,
}) {
  const isSaving = saveStatus === "saving";
  const titleInputRef = useRef(null);
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const editorHeightFloorRef = useRef(DEFAULT_EDITOR_HEIGHT);
  const resizeStateRef = useRef(null);
  const savedEditorSelectionRef = useRef(null);
  const isEditorFocusedRef = useRef(false);
  const lastSyncedNoteIdRef = useRef(null);
  const activeFieldRef = useRef("content");
  const transliterationDebounceRef = useRef(0);
  const transliterationSessionRef = useRef({
    language: "",
    field: "",
    start: 0,
    roman: "",
    output: "",
    range: null,
  });
  const googleTransliterationStatus = useGoogleTransliterationStatus();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const [isEditorResizing, setIsEditorResizing] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editorFormatting, setEditorFormatting] = useState({
    bold: false,
    italic: false,
    blockTag: "p",
  });
  const normalizedNoteColor = normalizeNoteColor(noteColor);
  const noteLanguageOption = getNoteLanguageOption(noteLanguage);
  const noteFontOptions = getNoteFontOptions(noteLanguage);
  const noteFontClassName = getNoteFontClassName(noteLanguage, noteFontStyle);
  const noteSurfaceStyle = getNoteSurfaceStyle(normalizedNoteColor);
  const effectiveRuledLines = Boolean(
    typeof noteRuledLines === "boolean" ? noteRuledLines : ruledLinesEnabled
  );
  const editorMetrics = useMemo(
    () => getNoteEditorMetrics(noteLanguageOption, noteTextSize),
    [noteLanguageOption, noteTextSize]
  );
  const hasScriptKeyboard = noteLanguage !== DEFAULT_NOTE_LANGUAGE;
  const scriptLanguageConfig = getScriptLanguageConfig(noteLanguage);
  const googleLanguageCode = getGoogleTransliterationLanguageCode(noteLanguage);
  const languageDigitMap = getLanguageDigitMap(noteLanguage);
  const hasLocalRomanInput = Boolean(scriptLanguageConfig?.supportsLocalRomanInput);
  const isGoogleTransliterationEnabled = Boolean(
    googleLanguageCode &&
      googleTransliterationStatus.configured &&
      googleTransliterationStatus.supportedLanguages.includes(googleLanguageCode)
  );
  const isPhysicalScriptTypingEnabled =
    hasLocalRomanInput || isGoogleTransliterationEnabled;
  const scriptKeyboardHints = isPhysicalScriptTypingEnabled
    ? scriptLanguageConfig?.physicalHints
    : [];
  const scriptKeyboardInteractionLabel = isPhysicalScriptTypingEnabled
    ? scriptLanguageConfig?.interactionLabel
    : undefined;

  const resetTransliterationSession = useCallback(() => {
    window.clearTimeout(transliterationDebounceRef.current);
    transliterationSessionRef.current = {
      language: "",
      field: "",
      start: 0,
      roman: "",
      output: "",
    };
  }, []);

  const measureEditorContentHeight = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return DEFAULT_EDITOR_HEIGHT;

    const previousHeight = editor.style.height;
    editor.style.height = "auto";
    const measuredHeight = Math.max(DEFAULT_EDITOR_HEIGHT, editor.scrollHeight || 0);
    editor.style.height = previousHeight;
    return measuredHeight;
  }, []);

  const setTextareaHeight = useCallback((targetHeight, { measureContent = false } = {}) => {
    const editor = editorRef.current;
    if (!editor) return 0;

    const contentHeight =
      measureContent || !editor.style.height
        ? (() => {
            editor.style.height = "auto";
            return Math.max(DEFAULT_EDITOR_HEIGHT, editor.scrollHeight || 0);
          })()
        : measureEditorContentHeight();

    const surfaceInner = editor.closest(".note-editor-surface-inner");
    let minContainerHeight = DEFAULT_EDITOR_HEIGHT;
    if (surfaceInner) {
      const cs = window.getComputedStyle(surfaceInner);
      const paddingTop = parseFloat(cs.paddingTop) || 0;
      const paddingBottom = parseFloat(cs.paddingBottom) || 0;
      const resizeZone = surfaceInner.querySelector(".note-editor-resize-zone");
      const resizeZoneHeight = resizeZone ? resizeZone.offsetHeight : 24;
      minContainerHeight = Math.max(
        DEFAULT_EDITOR_HEIGHT,
        surfaceInner.clientHeight - paddingTop - paddingBottom - resizeZoneHeight
      );
    }

    const hasManuallyResized = editorHeightFloorRef.current !== DEFAULT_EDITOR_HEIGHT;

    const nextHeight = Math.max(
      hasManuallyResized ? 0 : minContainerHeight,
      DEFAULT_EDITOR_HEIGHT,
      targetHeight || 0,
      contentHeight
    );
    editor.style.height = `${nextHeight}px`;
    return nextHeight;
  }, [measureEditorContentHeight]);

  const updateTextareaLayout = useCallback(() => {
    if (resizeStateRef.current) return;
    setTextareaHeight(editorHeightFloorRef.current, { measureContent: true });
  }, [setTextareaHeight]);

  const stopResizeCursor = useCallback(() => {
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    if (noteLanguage === DEFAULT_NOTE_LANGUAGE) {
      setIsKeyboardOpen(false);
    }
  }, [noteLanguage]);

  useEffect(() => {
    try {
      document.execCommand?.("defaultParagraphSeparator", false, "p");
    } catch {
      // ignore legacy command support gaps
    }
  }, []);

  useEffect(() => {
    resetTransliterationSession();
  }, [noteLanguage, resetTransliterationSession]);

  useLayoutEffect(() => {
    editorHeightFloorRef.current = DEFAULT_EDITOR_HEIGHT;
  }, [activeNoteId]);

  useEffect(
    () => () => {
      resizeStateRef.current = null;
      stopResizeCursor();
    },
    [stopResizeCursor]
  );

  const drawRuledLines = useCallback(() => {
    if (!effectiveRuledLines) return;
    const ta = editorRef.current;
    const canvas = canvasRef.current;
    if (!ta || !canvas) return;

    const cs = window.getComputedStyle(ta);
    const dpr = window.devicePixelRatio || 1;

    const w = ta.clientWidth;
    const h = ta.clientHeight;
    if (w <= 0 || h <= 0) return;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const fontSize = parseFloat(cs.fontSize) || 16;
    const lineHeight =
      cs.lineHeight === "normal"
        ? fontSize * 1.4
        : parseFloat(cs.lineHeight) || fontSize * 1.4;

    const padTop = parseFloat(cs.paddingTop) || 0;
    const scrollTop = ta.scrollTop || 0;
    const scrollOffset = ((scrollTop % lineHeight) + lineHeight) % lineHeight;
    const ruleInset = Math.max(2, Math.round(fontSize * 0.14));

    ctx.strokeStyle = cs.getPropertyValue("--tp-rule-color") || "rgba(28, 39, 56, 0.11)";
    ctx.lineWidth = 1;

    let y = padTop + lineHeight - ruleInset - scrollOffset;
    const x1 = 0;
    const x2 = w;
    const snap = (value) => Math.round(value) + 0.5;

    while (y <= h + lineHeight) {
      ctx.beginPath();
      ctx.moveTo(x1, snap(y));
      ctx.lineTo(x2, snap(y));
      ctx.stroke();
      y += lineHeight;
    }
  }, [effectiveRuledLines]);

  const syncEditorHeightFloor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editorHeightFloorRef.current = Math.max(
      DEFAULT_EDITOR_HEIGHT,
      editor.offsetHeight || editor.clientHeight || 0
    );
    if (effectiveRuledLines) {
      drawRuledLines();
    }
  }, [drawRuledLines, effectiveRuledLines]);

  const handleEditorResizeStart = useCallback(
    (event) => {
      if (isSaving || event.button !== 0) return;

      const editor = editorRef.current;
      if (!editor) return;

      event.preventDefault();
      const startHeight = Math.max(
        DEFAULT_EDITOR_HEIGHT,
        editor.offsetHeight || editor.clientHeight || 0
      );

      editorHeightFloorRef.current = startHeight;
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeight,
      };
      setIsEditorResizing(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [isSaving]
  );

  const handleEditorResizeMove = useCallback(
    (event) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      event.preventDefault();
      const nextFloor = Math.max(
        DEFAULT_EDITOR_HEIGHT,
        resizeState.startHeight + (event.clientY - resizeState.startY)
      );

      editorHeightFloorRef.current = nextFloor;
      setTextareaHeight(nextFloor);
      if (effectiveRuledLines) {
        drawRuledLines();
      }
    },
    [drawRuledLines, effectiveRuledLines, setTextareaHeight]
  );

  const finishEditorResize = useCallback(
    (event) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) return;

      resizeStateRef.current = null;
      setIsEditorResizing(false);
      stopResizeCursor();
      syncEditorHeightFloor();
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
    [stopResizeCursor, syncEditorHeightFloor]
  );

  const syncContentFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return {
        html: normalizeNoteHtml(contentHtml, content),
        plainText: content ?? "",
      };
    }

    const normalizedHtml = normalizeNoteHtml(
      editor.innerHTML,
      editor.textContent ?? ""
    );
    const plainText = extractPlainTextFromHtml(normalizedHtml);
    setContent({ html: normalizedHtml, plainText });
    updateTextareaLayout();
    if (effectiveRuledLines) {
      drawRuledLines();
    }

    return {
      html: normalizedHtml,
      plainText,
    };
  }, [
    content,
    contentHtml,
    drawRuledLines,
    effectiveRuledLines,
    setContent,
    updateTextareaLayout,
  ]);

  const getEditorSelectionRange = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection?.();
    if (!editor || !selection?.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const startInside =
      range.startContainer === editor || editor.contains(range.startContainer);
    const endInside =
      range.endContainer === editor || editor.contains(range.endContainer);

    if (!startInside || !endInside) {
      return null;
    }

    return range.cloneRange();
  }, []);

  const restoreEditorSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection?.();
    const savedRange = savedEditorSelectionRef.current;
    if (!editor || !selection || !savedRange) return false;

    try {
      const startInside =
        savedRange.startContainer === editor ||
        editor.contains(savedRange.startContainer);
      const endInside =
        savedRange.endContainer === editor || editor.contains(savedRange.endContainer);
      if (!startInside || !endInside) {
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(savedRange);
      return true;
    } catch {
      return false;
    }
  }, []);

  const focusContentEditor = useCallback(
    ({ restoreSelection: shouldRestoreSelection = true } = {}) => {
      const editor = editorRef.current;
      if (!editor) return false;

      editor.focus();
      if (shouldRestoreSelection && restoreEditorSelection()) {
        return true;
      }

      const selection = document.getSelection?.();
      if (!selection) return false;

      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      savedEditorSelectionRef.current = range.cloneRange();
      return true;
    },
    [restoreEditorSelection]
  );

  const keepEditorCaretVisible = useCallback(() => {
    const editor = editorRef.current;
    const surface = editor?.closest(".note-editor-surface");
    const selection = document.getSelection?.();
    if (!editor || !surface || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0).cloneRange();
    const startInside =
      range.startContainer === editor || editor.contains(range.startContainer);
    const endInside =
      range.endContainer === editor || editor.contains(range.endContainer);
    if (!startInside || !endInside) return;

    window.requestAnimationFrame(() => {
      const caretRect =
        range.getClientRects?.()[0] ?? range.getBoundingClientRect?.();
      const surfaceRect = surface.getBoundingClientRect();
      if (!caretRect || !surfaceRect || caretRect.height === 0) return;

      const topBuffer = 72;
      const bottomBuffer = 160;

      if (caretRect.bottom > surfaceRect.bottom - bottomBuffer) {
        surface.scrollTop += caretRect.bottom - surfaceRect.bottom + bottomBuffer;
        return;
      }

      if (caretRect.top < surfaceRect.top + topBuffer) {
        surface.scrollTop -= surfaceRect.top + topBuffer - caretRect.top;
      }
    });
  }, []);

  const updateEditorFormatting = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection?.();
    if (!editor || !selection?.rangeCount) {
      setEditorFormatting({
        bold: false,
        italic: false,
        blockTag: "p",
      });
      return;
    }

    const range = selection.getRangeAt(0);
    const startInside =
      range.startContainer === editor || editor.contains(range.startContainer);
    const endInside =
      range.endContainer === editor || editor.contains(range.endContainer);
    if (!startInside || !endInside) {
      return;
    }

    let bold = false;
    let italic = false;
    let blockTag = "p";

    try {
      bold = Boolean(document.queryCommandState?.("bold"));
    } catch {
      bold = false;
    }

    try {
      italic = Boolean(document.queryCommandState?.("italic"));
    } catch {
      italic = false;
    }

    try {
      blockTag = normalizeCommandBlockTag(document.queryCommandValue?.("formatBlock"));
    } catch {
      blockTag = "p";
    }

    setEditorFormatting({
      bold,
      italic,
      blockTag: ["h1", "h2", "h3", "h4"].includes(blockTag) ? blockTag : "p",
    });
    savedEditorSelectionRef.current = range.cloneRange();
  }, []);

  const replaceEditorRangeText = useCallback(
    (targetRange, text, { shouldFocus = true } = {}) => {
      const editor = editorRef.current;
      const selection = document.getSelection?.();
      if (!editor || !targetRange || !selection) return null;

      const range = targetRange.cloneRange();

      try {
        range.deleteContents();

        let textRange = null;
        let caretRange = range.cloneRange();

        if (text) {
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);

          textRange = document.createRange();
          textRange.setStart(textNode, 0);
          textRange.setEnd(textNode, text.length);

          caretRange = document.createRange();
          caretRange.setStart(textNode, text.length);
          caretRange.collapse(true);
        }

        selection.removeAllRanges();
        selection.addRange(caretRange);
        savedEditorSelectionRef.current = caretRange.cloneRange();

        if (shouldFocus) {
          editor.focus();
        }

        syncContentFromEditor();
        updateEditorFormatting();

        return {
          textRange,
          caretRange,
        };
      } catch {
        return null;
      }
    },
    [syncContentFromEditor, updateEditorFormatting]
  );

  const getEditorInsertionRange = useCallback(() => {
    const currentRange = getEditorSelectionRange();
    if (currentRange) {
      return currentRange;
    }

    const editor = editorRef.current;
    const savedRange = savedEditorSelectionRef.current;
    if (
      editor &&
      savedRange &&
      (savedRange.startContainer === editor ||
        editor.contains(savedRange.startContainer)) &&
      (savedRange.endContainer === editor || editor.contains(savedRange.endContainer))
    ) {
      return savedRange.cloneRange();
    }

    if (!editor) return null;

    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(editor);
    fallbackRange.collapse(false);
    return fallbackRange;
  }, [getEditorSelectionRange]);

  const insertTextIntoEditor = useCallback(
    (text, options = {}) => {
      if (!text || isSaving) return null;

      focusContentEditor();
      const range = options.range ?? getEditorInsertionRange();
      if (!range) return null;

      return replaceEditorRangeText(range, text, options);
    },
    [focusContentEditor, getEditorInsertionRange, isSaving, replaceEditorRangeText]
  );

  const getCollapsedEditorTextSelection = useCallback(() => {
    const currentRange = getEditorSelectionRange();
    if (!currentRange?.collapsed) {
      return null;
    }

    const { startContainer, startOffset } = currentRange;
    if (startContainer.nodeType === Node.TEXT_NODE) {
      return {
        textNode: startContainer,
        offset: startOffset,
      };
    }

    if (startContainer.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    let candidate = startOffset > 0 ? startContainer.childNodes[startOffset - 1] : null;
    while (candidate?.lastChild) {
      candidate = candidate.lastChild;
    }

    if (candidate?.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    return {
      textNode: candidate,
      offset: candidate.textContent?.length ?? 0,
    };
  }, [getEditorSelectionRange]);

  const runRichTextCommand = useCallback(
    (command, value) => {
      if (isSaving) return;

      activeFieldRef.current = "content";
      focusContentEditor();

      try {
        document.execCommand?.("styleWithCSS", false, false);
      } catch {
        // ignore
      }

      try {
        if (typeof value === "undefined") {
          document.execCommand?.(command, false);
        } else {
          document.execCommand?.(command, false, value);
        }
      } catch {
        // ignore
      }

      syncContentFromEditor();
      updateEditorFormatting();
    },
    [focusContentEditor, isSaving, syncContentFromEditor, updateEditorFormatting]
  );

  const applyBlockStyle = useCallback(
    (blockTag) => {
      const nextTag = editorFormatting.blockTag === blockTag ? "p" : blockTag;
      runRichTextCommand("formatBlock", `<${nextTag}>`);
    },
    [editorFormatting.blockTag, runRichTextCommand]
  );

  const insertSymbol = useCallback(
    (symbol) => {
      if (!symbol || isSaving) return;
      resetTransliterationSession();

      const isTitleTarget = activeFieldRef.current === "title";
      if (!isTitleTarget) {
        focusContentEditor();

        try {
          if (document.execCommand?.("insertText", false, symbol)) {
            syncContentFromEditor();
            updateEditorFormatting();
            keepEditorCaretVisible();
            return;
          }
        } catch {
          // ignore and fallback
        }

        if (insertTextIntoEditor(symbol)) {
          keepEditorCaretVisible();
        }
        return;
      }

      const field = titleInputRef.current;
      const start = field?.selectionStart ?? title.length;
      const end = field?.selectionEnd ?? title.length;
      const nextValue = `${title.slice(0, start)}${symbol}${title.slice(end)}`;

      setTitle(nextValue);

      window.requestAnimationFrame(() => {
        const nextField = titleInputRef.current;
        if (!nextField) return;
        nextField.focus();
        const caretPosition = start + symbol.length;
        if (typeof nextField.setSelectionRange === "function") {
          nextField.setSelectionRange(caretPosition, caretPosition);
        }
      });
    },
    [
      focusContentEditor,
      insertTextIntoEditor,
      isSaving,
      keepEditorCaretVisible,
      resetTransliterationSession,
      setTitle,
      syncContentFromEditor,
      title,
      updateEditorFormatting,
    ]
  );

  const replaceInputFieldRange = useCallback(
    ({
      fieldRef,
      value,
      setValue,
      start,
      end,
      replacement,
      shouldFocus = true,
    }) => {
      const safeValue = fieldRef.current?.value ?? value ?? "";
      const nextValue = `${safeValue.slice(0, start)}${replacement}${safeValue.slice(
        end
      )}`;
      setValue(nextValue);

      window.requestAnimationFrame(() => {
        const field = fieldRef.current;
        if (!field) return;

        if (shouldFocus) {
          field.focus();
        }
        const nextCaret = start + replacement.length;
        if (shouldFocus && typeof field.setSelectionRange === "function") {
          field.setSelectionRange(nextCaret, nextCaret);
        }
      });
    },
    []
  );

  const fetchGoogleScriptTransliteration = useCallback(async (roman) => {
    if (!isGoogleTransliterationEnabled || !roman) {
      return "";
    }

    const data = await transliterateTextAPI({
      text: roman,
      language: noteLanguage,
    });
    return typeof data?.transliteratedText === "string" ? data.transliteratedText : "";
  }, [isGoogleTransliterationEnabled, noteLanguage]);

  const getAutoReplaceMatch = useCallback(
    (value = "") => {
      if (!autoReplaceEnabled || !value) return null;

      for (const [pattern, replacement] of AUTO_REPLACE_DEFAULTS) {
        if (value.endsWith(pattern)) {
          return { pattern, replacement };
        }
      }

      return null;
    },
    [autoReplaceEnabled]
  );

  const tryAutoReplaceInputField = useCallback(
    ({ event, fieldRef, value, setValue }) => {
      if (
        !autoReplaceEnabled ||
        isSaving ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return false;
      }

      if (typeof event.key !== "string" || event.key.length !== 1) {
        return false;
      }

      const field = fieldRef.current;
      if (!field) return false;

      const selectionStart = field.selectionStart ?? value.length;
      const selectionEnd = field.selectionEnd ?? value.length;
      if (selectionStart !== selectionEnd) {
        return false;
      }

      const lookBehind = `${value.slice(
        Math.max(0, selectionStart - 6),
        selectionStart
      )}${event.key}`;
      const match = getAutoReplaceMatch(lookBehind);
      if (!match) {
        return false;
      }

      event.preventDefault();
      resetTransliterationSession();
      replaceInputFieldRange({
        fieldRef,
        value,
        setValue,
        start: selectionStart - (match.pattern.length - event.key.length),
        end: selectionStart,
        replacement: match.replacement,
      });
      return true;
    },
    [
      autoReplaceEnabled,
      getAutoReplaceMatch,
      isSaving,
      replaceInputFieldRange,
      resetTransliterationSession,
    ]
  );

  const tryAutoReplaceEditor = useCallback(
    (event) => {
      if (
        !autoReplaceEnabled ||
        isSaving ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return false;
      }

      if (typeof event.key !== "string" || event.key.length !== 1) {
        return false;
      }

      const selection = getCollapsedEditorTextSelection();
      if (!selection?.textNode) {
        return false;
      }

      const lookBehind = `${selection.textNode.textContent?.slice(
        Math.max(0, selection.offset - 6),
        selection.offset
      )}${event.key}`;
      const match = getAutoReplaceMatch(lookBehind);
      if (!match) {
        return false;
      }

      const targetRange = document.createRange();
      targetRange.setStart(
        selection.textNode,
        Math.max(0, selection.offset - (match.pattern.length - event.key.length))
      );
      targetRange.setEnd(selection.textNode, selection.offset);

      event.preventDefault();
      resetTransliterationSession();
      replaceEditorRangeText(targetRange, match.replacement);
      return true;
    },
    [
      autoReplaceEnabled,
      getAutoReplaceMatch,
      getCollapsedEditorTextSelection,
      isSaving,
      replaceEditorRangeText,
      resetTransliterationSession,
    ]
  );

  const runGoogleInputTransliteration = useCallback(
    async ({
      fieldRef,
      setValue,
      start,
      roman,
      shouldFocus = true,
    }) => {
      const replacement = await fetchGoogleScriptTransliteration(roman);
      if (!replacement) {
        return false;
      }

      const session = transliterationSessionRef.current;
      if (
        session.language !== noteLanguage ||
        session.field !== "title" ||
        session.start !== start ||
        session.roman !== roman
      ) {
        return false;
      }

      replaceInputFieldRange({
        fieldRef,
        value: fieldRef.current?.value ?? "",
        setValue,
        start,
        end: start + session.output.length,
        replacement,
        shouldFocus,
      });

      transliterationSessionRef.current = {
        ...session,
        output: replacement,
      };
      return true;
    },
    [fetchGoogleScriptTransliteration, noteLanguage, replaceInputFieldRange]
  );

  const scheduleGoogleInputTransliteration = useCallback(
    ({ fieldRef, setValue, start, roman }) => {
      if (!isGoogleTransliterationEnabled || !roman) {
        return;
      }

      window.clearTimeout(transliterationDebounceRef.current);
      transliterationDebounceRef.current = window.setTimeout(() => {
        void runGoogleInputTransliteration({
          fieldRef,
          setValue,
          start,
          roman,
        }).catch(() => {
          // Keep the local or in-progress transliteration result when Google isn't reachable.
        });
      }, hasLocalRomanInput ? 180 : 140);
    },
    [
      hasLocalRomanInput,
      isGoogleTransliterationEnabled,
      runGoogleInputTransliteration,
    ]
  );

  const finalizeInputScriptSession = useCallback(
    async ({
      fieldRef,
      setValue,
      boundaryText = "",
      shouldFocus = true,
    }) => {
      const session = transliterationSessionRef.current;
      if (session.field !== "title" || !session.output) {
        resetTransliterationSession();
        return;
      }

      window.clearTimeout(transliterationDebounceRef.current);

      if (boundaryText) {
        replaceInputFieldRange({
          fieldRef,
          value: fieldRef.current?.value ?? "",
          setValue,
          start: session.start,
          end: session.start + session.output.length,
          replacement: `${session.output}${boundaryText}`,
          shouldFocus,
        });
      }

      const clearSessionIfCurrent = () => {
        const currentSession = transliterationSessionRef.current;
        if (
          currentSession.language === session.language &&
          currentSession.field === session.field &&
          currentSession.start === session.start &&
          currentSession.roman === session.roman &&
          currentSession.output === session.output
        ) {
          resetTransliterationSession();
        }
      };

      clearSessionIfCurrent();

      if (isGoogleTransliterationEnabled && session.roman) {
        try {
          const replacement = await fetchGoogleScriptTransliteration(session.roman);
          if (!replacement || replacement === session.output) {
            return;
          }

          const liveValue = fieldRef.current?.value ?? "";
          const liveOutput = liveValue.slice(
            session.start,
            session.start + session.output.length
          );
          if (liveOutput !== session.output) {
            return;
          }

          replaceInputFieldRange({
            fieldRef,
            value: liveValue,
            setValue,
            start: session.start,
            end: session.start + session.output.length,
            replacement,
            shouldFocus,
          });
        } catch {
          // Fall back to the current inline output if Google can't respond in time.
        }
      }
    },
    [
      fetchGoogleScriptTransliteration,
      isGoogleTransliterationEnabled,
      replaceInputFieldRange,
      resetTransliterationSession,
    ]
  );

  const handleTitleFieldBlur = useCallback(
    ({ fieldRef, setValue }) => {
      const session = transliterationSessionRef.current;
      if (
        session.language === noteLanguage &&
        session.field === "title" &&
        session.output &&
        session.roman &&
        isGoogleTransliterationEnabled
      ) {
        void finalizeInputScriptSession({
          fieldRef,
          setValue,
          shouldFocus: false,
        });
        return;
      }

      resetTransliterationSession();
    },
    [
      finalizeInputScriptSession,
      isGoogleTransliterationEnabled,
      noteLanguage,
      resetTransliterationSession,
    ]
  );

  const handleTitleFieldKeyDown = useCallback(
    ({ event, fieldRef, value, setValue }) => {
      if (tryAutoReplaceInputField({ event, fieldRef, value, setValue })) {
        return;
      }

      if (
        !isPhysicalScriptTypingEnabled ||
        isSaving ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const field = fieldRef.current;
      if (!field) return;

      const selectionStart = field.selectionStart ?? value.length;
      const selectionEnd = field.selectionEnd ?? value.length;
      const session = transliterationSessionRef.current;
      const hasActiveSession =
        session.language === noteLanguage &&
        session.field === "title" &&
        session.output &&
        selectionStart === selectionEnd &&
        selectionStart === session.start + session.output.length;

      if (event.key === "Backspace") {
        if (!hasActiveSession) {
          resetTransliterationSession();
          return;
        }

        event.preventDefault();
        const nextRoman = session.roman.slice(0, -1);
        const nextOutput = transliterateRomanInput(noteLanguage, nextRoman);
        replaceInputFieldRange({
          fieldRef,
          value,
          setValue,
          start: session.start,
          end: session.start + session.output.length,
          replacement: nextOutput,
        });

        if (!nextRoman) {
          resetTransliterationSession();
          return;
        }

        transliterationSessionRef.current = {
          language: noteLanguage,
          field: "title",
          start: session.start,
          roman: nextRoman,
          output: nextOutput,
          range: null,
        };
        scheduleGoogleInputTransliteration({
          fieldRef,
          setValue,
          start: session.start,
          roman: nextRoman,
        });
        return;
      }

      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "Tab" ||
        SCRIPT_BOUNDARY_PATTERN.test(event.key)
      ) {
        if (!hasActiveSession) {
          resetTransliterationSession();
          return;
        }

        if (isGoogleTransliterationEnabled) {
          event.preventDefault();
          const boundaryText =
            event.key === "Enter" ? "\n" : event.key === "Tab" ? "\t" : event.key;
          void finalizeInputScriptSession({
            fieldRef,
            setValue,
            boundaryText,
          });
          return;
        }

        resetTransliterationSession();
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        if (languageDigitMap) {
          event.preventDefault();
          resetTransliterationSession();
          replaceInputFieldRange({
            fieldRef,
            value,
            setValue,
            start: selectionStart,
            end: selectionEnd,
            replacement: languageDigitMap[event.key] ?? event.key,
          });
          return;
        }

        if (hasActiveSession && isGoogleTransliterationEnabled) {
          event.preventDefault();
          void finalizeInputScriptSession({
            fieldRef,
            setValue,
            boundaryText: event.key,
          });
          return;
        }

        resetTransliterationSession();
        return;
      }

      if (!ROMAN_LETTER_PATTERN.test(event.key)) {
        if (
          event.key.startsWith("Arrow") ||
          event.key === "Home" ||
          event.key === "End" ||
          event.key === "PageUp" ||
          event.key === "PageDown"
        ) {
          resetTransliterationSession();
        }
        return;
      }

      event.preventDefault();

      const nextSession = hasActiveSession
        ? session
        : {
            language: noteLanguage,
            field: "title",
            start: selectionStart,
            roman: "",
            output: "",
            range: null,
          };

      const nextRoman = `${nextSession.roman}${event.key}`;
      const nextOutput = transliterateRomanInput(noteLanguage, nextRoman);

      replaceInputFieldRange({
        fieldRef,
        value,
        setValue,
        start: nextSession.start,
        end: hasActiveSession
          ? nextSession.start + nextSession.output.length
          : selectionEnd,
        replacement: nextOutput,
      });

      transliterationSessionRef.current = {
        language: noteLanguage,
        field: "title",
        start: nextSession.start,
        roman: nextRoman,
        output: nextOutput,
        range: null,
      };
      scheduleGoogleInputTransliteration({
        fieldRef,
        setValue,
        start: nextSession.start,
        roman: nextRoman,
      });
    },
    [
      finalizeInputScriptSession,
      isGoogleTransliterationEnabled,
      isPhysicalScriptTypingEnabled,
      isSaving,
      languageDigitMap,
      noteLanguage,
      replaceInputFieldRange,
      resetTransliterationSession,
      scheduleGoogleInputTransliteration,
      tryAutoReplaceInputField,
    ]
  );

  const isSelectionAtEditorSessionEnd = useCallback(
    (sessionRange) => {
      const currentRange = getEditorSelectionRange();
      if (!currentRange || !currentRange.collapsed || !sessionRange) {
        return false;
      }

      return (
        currentRange.startContainer === sessionRange.endContainer &&
        currentRange.startOffset === sessionRange.endOffset
      );
    },
    [getEditorSelectionRange]
  );

  const runGoogleEditorTransliteration = useCallback(
    async ({ roman, shouldFocus = true }) => {
      const replacement = await fetchGoogleScriptTransliteration(roman);
      if (!replacement) {
        return false;
      }

      const session = transliterationSessionRef.current;
      if (
        session.language !== noteLanguage ||
        session.field !== "content" ||
        session.roman !== roman ||
        !session.range
      ) {
        return false;
      }

      const result = replaceEditorRangeText(session.range, replacement, {
        shouldFocus,
      });
      if (!result?.textRange) {
        return false;
      }

      transliterationSessionRef.current = {
        ...session,
        output: replacement,
        range: result.textRange.cloneRange(),
      };
      return true;
    },
    [fetchGoogleScriptTransliteration, noteLanguage, replaceEditorRangeText]
  );

  const scheduleGoogleEditorTransliteration = useCallback(
    ({ roman }) => {
      if (!isGoogleTransliterationEnabled || !roman) {
        return;
      }

      window.clearTimeout(transliterationDebounceRef.current);
      transliterationDebounceRef.current = window.setTimeout(() => {
        void runGoogleEditorTransliteration({ roman }).catch(() => {
          // Keep the local or in-progress transliteration result when Google isn't reachable.
        });
      }, hasLocalRomanInput ? 180 : 140);
    },
    [
      hasLocalRomanInput,
      isGoogleTransliterationEnabled,
      runGoogleEditorTransliteration,
    ]
  );

  const insertEditorBoundary = useCallback(
    (boundaryKey) => {
      if (!boundaryKey) return;

      focusContentEditor();

      try {
        if (boundaryKey === "Enter") {
          document.execCommand?.("insertParagraph", false);
        } else if (boundaryKey === "Tab") {
          document.execCommand?.("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
        } else {
          document.execCommand?.("insertText", false, boundaryKey);
        }
      } catch {
        if (boundaryKey === "Tab") {
          insertTextIntoEditor("    ");
        } else if (boundaryKey !== "Enter") {
          insertTextIntoEditor(boundaryKey);
        }
      }

      syncContentFromEditor();
      updateEditorFormatting();
    },
    [
      focusContentEditor,
      insertTextIntoEditor,
      syncContentFromEditor,
      updateEditorFormatting,
    ]
  );

  const finalizeContentScriptSession = useCallback(
    async ({ boundaryKey = "", shouldFocus = true } = {}) => {
      const session = transliterationSessionRef.current;
      if (session.field !== "content" || !session.output) {
        resetTransliterationSession();
        return;
      }

      window.clearTimeout(transliterationDebounceRef.current);

      if (isGoogleTransliterationEnabled && session.roman && session.range) {
        try {
          await runGoogleEditorTransliteration({
            roman: session.roman,
            shouldFocus,
          });
        } catch {
          // Fall back to the current inline output if Google can't respond in time.
        }
      } else if (shouldFocus) {
        focusContentEditor();
      }

      resetTransliterationSession();

      if (boundaryKey) {
        insertEditorBoundary(boundaryKey);
        return;
      }

      syncContentFromEditor();
      updateEditorFormatting();
    },
    [
      focusContentEditor,
      insertEditorBoundary,
      isGoogleTransliterationEnabled,
      resetTransliterationSession,
      runGoogleEditorTransliteration,
      syncContentFromEditor,
      updateEditorFormatting,
    ]
  );

  const handleContentEditorBlur = useCallback(() => {
    isEditorFocusedRef.current = false;
    setIsEditorFocused(false);

    const session = transliterationSessionRef.current;
    if (
      session.language === noteLanguage &&
      session.field === "content" &&
      session.output &&
      session.roman &&
      isGoogleTransliterationEnabled
    ) {
      void finalizeContentScriptSession({ shouldFocus: false });
      return;
    }

    resetTransliterationSession();
    const normalized = syncContentFromEditor();
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== normalized.html) {
      editor.innerHTML = normalized.html;
    }
    setEditorFormatting({
      bold: false,
      italic: false,
      blockTag: "p",
    });
  }, [
    finalizeContentScriptSession,
    isGoogleTransliterationEnabled,
    noteLanguage,
    resetTransliterationSession,
    syncContentFromEditor,
  ]);

  const handleContentEditorKeyDown = useCallback(
    (event) => {
      const modKey = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modKey && !event.altKey && key === "b") {
        event.preventDefault();
        runRichTextCommand("bold");
        return;
      }

      if (modKey && !event.altKey && key === "i") {
        event.preventDefault();
        runRichTextCommand("italic");
        return;
      }

      if (tryAutoReplaceEditor(event)) {
        return;
      }

      // Physical keyboard transliteration is enabled on the content editor.
      if (
        !isPhysicalScriptTypingEnabled ||
        isSaving ||
        event.isComposing ||
        modKey ||
        event.altKey
      ) {
        return;
      }

      const currentRange = getEditorSelectionRange();
      if (!currentRange) return;

      const session = transliterationSessionRef.current;
      const hasActiveSession =
        session.language === noteLanguage &&
        session.field === "content" &&
        session.output &&
        session.range &&
        currentRange.collapsed &&
        isSelectionAtEditorSessionEnd(session.range);

      if (event.key === "Backspace") {
        if (!hasActiveSession) {
          resetTransliterationSession();
          return;
        }

        event.preventDefault();
        const nextRoman = session.roman.slice(0, -1);
        const nextOutput = transliterateRomanInput(noteLanguage, nextRoman);
        const result = replaceEditorRangeText(session.range, nextOutput);

        if (!nextRoman) {
          resetTransliterationSession();
          return;
        }

        transliterationSessionRef.current = {
          language: noteLanguage,
          field: "content",
          start: 0,
          roman: nextRoman,
          output: nextOutput,
          range: result?.textRange ? result.textRange.cloneRange() : session.range,
        };
        scheduleGoogleEditorTransliteration({
          roman: nextRoman,
        });
        return;
      }

      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "Tab" ||
        SCRIPT_BOUNDARY_PATTERN.test(event.key)
      ) {
        if (!hasActiveSession) {
          resetTransliterationSession();
          return;
        }

        if (isGoogleTransliterationEnabled) {
          event.preventDefault();
          void finalizeContentScriptSession({
            boundaryKey: event.key,
          });
          return;
        }

        resetTransliterationSession();
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        if (languageDigitMap) {
          event.preventDefault();
          resetTransliterationSession();
          insertTextIntoEditor(languageDigitMap[event.key] ?? event.key);
          return;
        }

        if (hasActiveSession && isGoogleTransliterationEnabled) {
          event.preventDefault();
          void finalizeContentScriptSession({
            boundaryKey: event.key,
          });
          return;
        }

        resetTransliterationSession();
        return;
      }

      if (!ROMAN_LETTER_PATTERN.test(event.key)) {
        if (
          event.key.startsWith("Arrow") ||
          event.key === "Home" ||
          event.key === "End" ||
          event.key === "PageUp" ||
          event.key === "PageDown"
        ) {
          resetTransliterationSession();
        }
        return;
      }

      event.preventDefault();

      const targetRange = hasActiveSession ? session.range : currentRange;
      const nextRoman = `${hasActiveSession ? session.roman : ""}${event.key}`;
      const nextOutput = transliterateRomanInput(noteLanguage, nextRoman);
      const result = replaceEditorRangeText(targetRange, nextOutput);

      transliterationSessionRef.current = {
        language: noteLanguage,
        field: "content",
        start: 0,
        roman: nextRoman,
        output: nextOutput,
        range: result?.textRange ? result.textRange.cloneRange() : targetRange,
      };
      scheduleGoogleEditorTransliteration({
        roman: nextRoman,
      });
    },
    [
      finalizeContentScriptSession,
      getEditorSelectionRange,
      insertTextIntoEditor,
      isGoogleTransliterationEnabled,
      isPhysicalScriptTypingEnabled,
      isSaving,
      isSelectionAtEditorSessionEnd,
      languageDigitMap,
      noteLanguage,
      replaceEditorRangeText,
      resetTransliterationSession,
      runRichTextCommand,
      scheduleGoogleEditorTransliteration,
      tryAutoReplaceEditor,
    ]
  );

  const handleContentEditorInput = useCallback(() => {
    syncContentFromEditor();
    updateEditorFormatting();
  }, [syncContentFromEditor, updateEditorFormatting]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const selection = document.getSelection?.();
      if (!editor || !selection) return;

      const anchorInside =
        selection.anchorNode &&
        (selection.anchorNode === editor || editor.contains(selection.anchorNode));
      const focusInside =
        selection.focusNode &&
        (selection.focusNode === editor || editor.contains(selection.focusNode));

      if (!anchorInside && !focusInside) {
        return;
      }

      updateEditorFormatting();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateEditorFormatting]);

  // Hook 1: Synchronize DOM content from state (only when not typing or note changes)
  useLayoutEffect(() => {
    const editor = editorRef.current;
    const normalizedHtml = normalizeNoteHtml(contentHtml, content);

    if (editor) {
      const shouldSyncDom =
        lastSyncedNoteIdRef.current !== activeNoteId ||
        !isEditorFocusedRef.current ||
        activeFieldRef.current !== "content";

      if (shouldSyncDom && editor.innerHTML !== normalizedHtml) {
        editor.innerHTML = normalizedHtml;
      }
    }

    lastSyncedNoteIdRef.current = activeNoteId;
  }, [activeNoteId, content, contentHtml]);

  // Hook 2: Layout measurements, canvas drawing, and observers (bypasses keystroke typing entirely)
  useLayoutEffect(() => {
    const editor = editorRef.current;
    updateTextareaLayout();
    if (effectiveRuledLines) {
      drawRuledLines();
    }

    if (!editor) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        updateTextareaLayout();
        if (effectiveRuledLines) {
          drawRuledLines();
        }
      });
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(editor);
    const surface = editor.closest(".note-editor-surface");
    if (surface) {
      ro.observe(surface);
    }

    // Listen for dark/light mode switches to redraft notebook paper lines dynamically
    const themeObserver = new MutationObserver(() => {
      const scheduleDraw = () => {
        updateTextareaLayout();
        if (effectiveRuledLines) {
          drawRuledLines();
        }
      };
      
      // Multi-stage delay to align redrawing with the background theme transitions
      setTimeout(scheduleDraw, 50);
      setTimeout(scheduleDraw, 180);
      setTimeout(scheduleDraw, 360);
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [
    activeNoteId,
    drawRuledLines,
    effectiveRuledLines,
    noteFontStyle,
    noteLanguage,
    noteTextSize,
    updateTextareaLayout,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isLoadingNotes || isSaving) return;
      const key = event.key.toLowerCase();
      const isMod = event.ctrlKey || event.metaKey;

      if (isMod && key === "s") {
        event.preventDefault();
        if (activeNoteId) {
          onSave();
        }
        return;
      }

      if (isMod && key === "n") {
        event.preventDefault();
        onCreateNote();
        return;
      }

      if (key === "escape" && activeNoteId) {
        onFinishSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNoteId, isLoadingNotes, isSaving, onCreateNote, onFinishSave, onSave]);

  const handleToggleScriptKeyboard = useCallback((nextValue) => {
    setIsKeyboardOpen((current) => {
      const next =
        typeof nextValue === "function" ? nextValue(current) : Boolean(nextValue);

      if (
        next &&
        typeof window !== "undefined" &&
        window.matchMedia?.("(max-width: 1023px)").matches
      ) {
        window.requestAnimationFrame(() => setIsStudioMenuOpen(false));
      }

      return next;
    });
  }, []);

  if (isLoadingNotes) {
    return (
      <StatusState
        tone="loading"
        kicker="Note Studio"
        title="Loading notes"
        description="Your writing space is being restored into the editor."
        className="h-full"
      />
    );
  }

  if (!activeNoteId) {
    return hasNotes ? (
      <NoteEditorEmptyState
        title="No note selected"
        description="Pick a note from the sidebar or start a fresh writing window when a new idea shows up."
        actionLabel="Create a note"
        onAction={onCreateNote}
      />
    ) : (
      <NoteEditorEmptyState
        title="No notes yet"
        description="Build your first note and turn this workspace into a living project notebook."
        actionLabel="Create your first note"
        onAction={onCreateNote}
      />
    );
  }

  let statusLabel = "";
  if (saveStatus === "saving") statusLabel = "Saving...";
  if (saveStatus === "saved") statusLabel = "Saved";
  if (saveStatus === "error") statusLabel = "Save failed";

  const wordCount = getRichTextWordCount(contentHtml);
  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not saved yet";
  const showTemplateHint = !title && !content && !isEditorFocused;
  const googleTransliterationMessage = getLanguageTransliterationMessage({
    language: noteLanguage,
    languageLabel: noteLanguageOption.label,
    googleStatus: googleTransliterationStatus,
    isGoogleTransliterationEnabled,
  });

  return (
    <div
      className={`motion-scale-in panel note-editor-panel flex h-full flex-col gap-4 p-4 md:p-5 ${
        hasScriptKeyboard && isKeyboardOpen ? "note-editor-panel-keyboard-open" : ""
      }`}
      data-save-status={saveStatus}
    >
      <NoteEditorHeader
        wordCount={wordCount}
        lastSavedLabel={lastSavedLabel}
        noteLanguageOption={noteLanguageOption}
        statusLabel={statusLabel}
        isStudioMenuOpen={isStudioMenuOpen}
        onToggleStudioMenu={() => setIsStudioMenuOpen((current) => !current)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={onToggleFocusMode}
        isSaving={isSaving}
        onSave={onSave}
        onFinishSave={onFinishSave}
        isDirty={isDirty}
      />

      <div className="flex flex-1 gap-4 lg:gap-6 relative overflow-hidden">
        {/* Editor Area (Left Column) */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          <input
            ref={titleInputRef}
            value={title}
            onBlur={() =>
              handleTitleFieldBlur({
                fieldRef: titleInputRef,
                setValue: setTitle,
              })
            }
            onFocus={() => {
              activeFieldRef.current = "title";
            }}
            onKeyDown={(event) => {
              handleTitleFieldKeyDown({
                event,
                fieldRef: titleInputRef,
                value: title,
                setValue: setTitle,
              });
            }}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={noteLanguageOption.titlePlaceholder}
            className={`input text-base font-medium text-slate-900 ${noteFontClassName}`}
            disabled={isSaving}
            lang={noteLanguageOption.locale}
          />

          {hasScriptKeyboard && isKeyboardOpen ? (
            <div className="note-script-keyboard-inline motion-script-reveal w-full">
              <NoteScriptKeyboard
                language={noteLanguageOption.value}
                disabled={isSaving}
                onInsert={insertSymbol}
                interactionLabel={scriptKeyboardInteractionLabel}
                physicalHints={scriptKeyboardHints}
              />
            </div>
          ) : null}

          <div
            className={`note-editor-surface relative flex-1 overflow-auto rounded-[1.75rem] border ${isEditorResizing ? "note-editor-surface-resizing" : ""}`}
            style={noteSurfaceStyle}
            data-note-color={normalizedNoteColor}
          >
            <div className="note-editor-surface-inner relative min-h-full p-4 md:p-6">
              <div className="relative">
                {effectiveRuledLines ? (
                  <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-x-0 top-0 z-0"
                    aria-hidden="true"
                  />
                ) : null}

                <div
                  ref={editorRef}
                  contentEditable={!isSaving}
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  data-placeholder={noteLanguageOption.placeholder}
                  data-empty={content.trim() ? "false" : "true"}
                  onBlur={handleContentEditorBlur}
                  onFocus={() => {
                    activeFieldRef.current = "content";
                    isEditorFocusedRef.current = true;
                    setIsEditorFocused(true);
                    updateEditorFormatting();
                  }}
                  onInput={handleContentEditorInput}
                  onKeyDown={handleContentEditorKeyDown}
                  onKeyUp={updateEditorFormatting}
                  onMouseUp={updateEditorFormatting}
                  onPaste={() => {
                    window.requestAnimationFrame(() => {
                      handleContentEditorInput();
                    });
                  }}
                  spellCheck
                  className={`${noteFontClassName} notes-paper note-rich-editor relative z-10 min-h-[420px] w-full bg-transparent px-7 pb-8 pt-8 text-slate-800 md:px-10`}
                  style={{
                    "--note-editor-base-font-size": `${editorMetrics.fontSizeRem}rem`,
                    "--note-editor-base-line-height": `${editorMetrics.lineHeightRem}rem`,
                    fontSize: "var(--note-editor-base-font-size)",
                    lineHeight: "var(--note-editor-base-line-height)",
                  }}
                  lang={noteLanguageOption.locale}
                />
              </div>

              <div className="note-editor-resize-zone">
                <button
                  type="button"
                  className={`note-editor-resize-handle ${isEditorResizing ? "note-editor-resize-handle-active" : ""}`}
                  onPointerDown={handleEditorResizeStart}
                  onPointerMove={handleEditorResizeMove}
                  onPointerUp={finishEditorResize}
                  onPointerCancel={finishEditorResize}
                  onLostPointerCapture={finishEditorResize}
                  disabled={isSaving}
                  aria-label="Resize note editor height"
                  title="Drag to resize editor height"
                >
                  <span className="note-editor-resize-grip" />
                </button>
              </div>
            </div>
          </div>

          {showTemplateHint ? (
            <p className="text-sm text-slate-500">
              Tip: start with a one-line summary, then let the details stack
              underneath it.
            </p>
          ) : null}

        </div>

        {/* Note Studio Sidebar/Drawer (Right Column) */}
        <div
          className={`studio-drawer-backdrop ${isStudioMenuOpen ? "studio-drawer-backdrop-open" : ""}`}
          onClick={() => setIsStudioMenuOpen(false)}
        />
        <div
          className={`studio-drawer-panel ${isStudioMenuOpen ? "studio-drawer-panel-open" : ""}`}
        >
          <div className="studio-drawer-header">
            <h2 className="studio-drawer-title">Note Studio</h2>
            <button
              className="icon-button"
              onClick={() => setIsStudioMenuOpen(false)}
              aria-label="Close Note Studio"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="studio-drawer-content">
            <NoteStudioPanel
              isSaving={isSaving}
              effectiveRuledLines={effectiveRuledLines}
              onNoteRuledLinesChange={onNoteRuledLinesChange}
              normalizedNoteColor={normalizedNoteColor}
              isUpdatingNoteColor={isUpdatingNoteColor}
              onNoteColorChange={onNoteColorChange}
              editorFormatting={editorFormatting}
              onRunRichTextCommand={runRichTextCommand}
              onApplyBlockStyle={applyBlockStyle}
              hasScriptKeyboard={hasScriptKeyboard}
              noteLanguageOption={noteLanguageOption}
              googleTransliterationMessage={googleTransliterationMessage}
              isKeyboardOpen={isKeyboardOpen}
              onToggleKeyboard={handleToggleScriptKeyboard}
              insertSymbol={insertSymbol}
              scriptKeyboardInteractionLabel={scriptKeyboardInteractionLabel}
              scriptKeyboardHints={scriptKeyboardHints}
              noteLanguage={noteLanguage}
              onNoteLanguageChange={onNoteLanguageChange}
              isUpdatingNoteLanguage={isUpdatingNoteLanguage}
              noteFontStyle={noteFontStyle}
              noteFontOptions={noteFontOptions}
              onNoteFontStyleChange={onNoteFontStyleChange}
              isUpdatingNoteFont={isUpdatingNoteFont}
              noteTextSize={noteTextSize}
              onNoteTextSizeChange={onNoteTextSizeChange}
            />
          </div>
        </div>
      </div>

      <div className="note-editor-footer mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ui-chip">Ctrl/Cmd + S to save</span>
          <span className="ui-chip">Esc to finish</span>
          <span className="ui-chip">
            {effectiveRuledLines ? "Ruled paper mode" : "Plain paper mode"}
          </span>
          {hasScriptKeyboard ? (
            <span className="ui-chip">
              {isPhysicalScriptTypingEnabled
                ? "Native script typing ready"
                : "Native tap layout ready"}
            </span>
          ) : null}
        </div>

        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {title?.trim()
            ? "Ready to keep writing"
            : "Start with a title, then flow into the note"}
        </span>
      </div>

    </div>
  );
}

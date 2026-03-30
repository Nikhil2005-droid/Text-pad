import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  handleAutoReplaceBeforeInput,
  handleAutoReplaceKeyDown,
} from "../utils/autoReplace.js";

export default function NoteEditor({
  activeNoteId,
  isLoadingNotes,
  hasNotes,
  title,
  content,
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
}) {
  const isSaving = saveStatus === "saving";
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);

  const drawRuledLines = useCallback(() => {
    if (!ruledLinesEnabled) return;
    const ta = textareaRef.current;
    const canvas = canvasRef.current;
    if (!ta || !canvas) return;

    const cs = window.getComputedStyle(ta);
    const dpr = window.devicePixelRatio || 1;

    const w = ta.clientWidth;
    const h = ta.clientHeight;
    if (w <= 0 || h <= 0) return;

    // Resize the canvas to match the textarea box.
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Compute a reliable baseline using font metrics (canvas measureText).
    const font = cs.font || `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.font = font;
    const metrics = ctx.measureText("Hg");
    const ascent = metrics.actualBoundingBoxAscent || 0;
    const descent = metrics.actualBoundingBoxDescent || 0;

    const fontSize = parseFloat(cs.fontSize) || 16;
    const lineHeight =
      cs.lineHeight === "normal"
        ? fontSize * 1.4
        : parseFloat(cs.lineHeight) || fontSize * 1.4;

    const padTop = parseFloat(cs.paddingTop) || 0;
    const padLeft = parseFloat(cs.paddingLeft) || 0;
    const padRight = parseFloat(cs.paddingRight) || 0;

    const leading = Math.max(0, lineHeight - (ascent + descent));
    const baselineFromLineTop = leading / 2 + ascent;
    const baselineNudge = 5; // +down / -up: tiny manual tweak if a font looks off

    // Keep the rules "attached" to the content while scrolling.
    const scrollTop = ta.scrollTop || 0;
    const scrollOffset = ((scrollTop % lineHeight) + lineHeight) % lineHeight;

    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 1;

    // Start at the first visible line baseline.
    let y = padTop + baselineFromLineTop + baselineNudge - scrollOffset;
    const x1 = padLeft;
    const x2 = Math.max(x1, w - padRight);

    // Crisp 1px strokes: put them on half-pixels.
    const snap = (v) => Math.round(v) + 0.5;

    while (y <= h + lineHeight) {
      ctx.beginPath();
      ctx.moveTo(x1, snap(y));
      ctx.lineTo(x2, snap(y));
      ctx.stroke();
      y += lineHeight;
    }
  }, [ruledLinesEnabled]);

  useLayoutEffect(() => {
    if (!ruledLinesEnabled) return;
    // Draw once after the editor mounts/updates, then keep it updated on resize.
    drawRuledLines();

    const ta = textareaRef.current;
    if (!ta) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(drawRuledLines);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(ta);

    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [activeNoteId, drawRuledLines, ruledLinesEnabled]);

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
  }, [activeNoteId, isLoadingNotes, isSaving, onSave, onCreateNote, onFinishSave]);

  if (isLoadingNotes) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-slate-500">
        Loading notes...
      </div>
    );
  }

  if (!activeNoteId) {
    return hasNotes ? (
      <div className="flex h-full flex-col items-start justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-slate-600">
        <p className="text-lg font-semibold text-slate-900">No note selected</p>
        <p className="mt-1 text-sm text-slate-500">
          Select a note or create a new one to get started.
        </p>
        <button className="btn btn-primary mt-4" onClick={onCreateNote}>
          Create a note
        </button>
      </div>
    ) : (
      <div className="flex h-full flex-col items-start justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-slate-600">
        <p className="text-lg font-semibold text-slate-900">No notes yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first note to start capturing ideas.
        </p>
        <button className="btn btn-primary mt-4" onClick={onCreateNote}>
          Create your first note
        </button>
      </div>
    );
  }

  let statusLabel = "";
  if (saveStatus === "saving") statusLabel = "Saving...";
  if (saveStatus === "saved") statusLabel = "Saved";
  if (saveStatus === "error") statusLabel = "Save failed";

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;
  const lastSavedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : "Not saved yet";
  const showTemplateHint = !title && !content;

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Editor
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            {title || "Untitled note"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost" onClick={onSave} disabled={isSaving}>
            Save
          </button>
          <button
            className="btn btn-primary"
            onClick={onFinishSave}
            disabled={isSaving || !isDirty}
          >
            Finish and Save
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled note"
          className="input font-outfit text-base font-semibold"
          disabled={isSaving}
        />
        <div className="relative overflow-hidden rounded-2xl bg-white">
          {ruledLinesEnabled ? (
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 z-0"
              aria-hidden="true"
            />
          ) : null}
          <textarea
            ref={textareaRef}
            value={content}
            onBeforeInput={
              autoReplaceEnabled ? handleAutoReplaceBeforeInput : undefined
            }
            onKeyDown={autoReplaceEnabled ? handleAutoReplaceKeyDown : undefined}
            onChange={(e) => {
              setContent(e.target.value);
              // As content grows, scrollHeight changes; redraw so lines stay aligned.
              if (ruledLinesEnabled) drawRuledLines();
            }}
            onScroll={() => {
              if (ruledLinesEnabled) drawRuledLines();
            }}
            rows={15}
            placeholder="Start writing your note..."
            className="textarea notes-paper font-outfit relative z-10 min-h-[320px] bg-transparent text-base"
            disabled={isSaving}
          />
        </div>
        {showTemplateHint ? (
          <p className="text-sm text-slate-500">
            Tip: capture a quick summary first, then add details below.
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <div>
          Words: {wordCount} | Last saved: {lastSavedLabel}
        </div>
        {statusLabel ? (
          <span
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            aria-live="polite"
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

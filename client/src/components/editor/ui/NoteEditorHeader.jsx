import EditorFontSelect from "../../EditorFontSelect.jsx";
import {
  NOTE_LANGUAGE_OPTIONS,
} from "../../../languages/index.js";
import { NOTE_TEXT_SIZE_OPTIONS } from "../../../utils/noteStudio.js";

export default function NoteEditorHeader({
  wordCount,
  lastSavedLabel,
  noteLanguageOption,
  statusLabel,
  isStudioMenuOpen,
  onToggleStudioMenu,
  isFocusMode,
  onToggleFocusMode,
  isSaving,
  onSave,
  onFinishSave,
  isDirty,
}) {
  return (
    <div className="panel-inset flex flex-wrap items-center justify-between gap-4 p-3 md:px-5 md:py-3.5 z-20 relative">
      <div className="flex flex-wrap items-center gap-2">
        <p className="section-kicker hidden md:block">Note</p>
        <span className="ui-chip">{wordCount} words</span>
        <span className="ui-chip hidden sm:inline-flex">Saved {lastSavedLabel}</span>
        <span className="ui-chip">{noteLanguageOption.nativeLabel}</span>
        {statusLabel ? <span className="ui-chip">{statusLabel}</span> : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn btn-ghost px-3 hidden md:inline-flex"
          onClick={() => onToggleFocusMode?.(!isFocusMode)}
          disabled={!onToggleFocusMode}
        >
          {isFocusMode ? "Exit Focus" : "Focus Mode"}
        </button>

        <button className="btn btn-ghost px-3" onClick={onSave} disabled={isSaving}>
          Save
        </button>
        <button
          className="btn btn-primary px-3"
          onClick={onFinishSave}
          disabled={isSaving || !isDirty}
        >
          Finish
        </button>

        <div className="h-6 w-px bg-[rgba(104,84,58,0.16)] mx-1"></div>

        <button
          className={`icon-button ${isStudioMenuOpen ? "bg-[rgba(188,116,65,0.12)] border-[rgba(188,116,65,0.34)]" : ""}`}
          onClick={onToggleStudioMenu}
          aria-label="Toggle Note Studio"
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
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

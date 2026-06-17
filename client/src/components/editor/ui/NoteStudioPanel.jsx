import EditorFontSelect from "../../EditorFontSelect.jsx";
import {
  NOTE_LANGUAGE_OPTIONS,
  NOTE_COLOR_PRESETS,
  toNotePaperColor,
} from "../../../languages/index.js";
import { NOTE_TEXT_SIZE_OPTIONS } from "../../../utils/noteStudio.js";

function NoteColorSwatch({ color, label, isActive, disabled = false, onSelect }) {
  return (
    <button
      type="button"
      className={`note-color-swatch ${isActive ? "note-color-swatch-active" : ""}`}
      style={{ backgroundColor: color }}
      onClick={() => onSelect?.(color)}
      disabled={disabled || !onSelect}
      title={label}
      aria-label={label}
    />
  );
}

function ToolbarButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}) {
  const handlePress = (event) => {
    event.preventDefault();
    if (!disabled) {
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      className={`note-toolbar-button ${isActive ? "note-toolbar-button-active" : ""}`}
      onPointerDown={handlePress}
      onClick={handlePress}
      disabled={disabled}
      aria-pressed={isActive}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function ToolbarSwitch({ label, checked, disabled = false, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`note-toggle-switch ${checked ? "note-toggle-switch-on" : ""}`}
      onClick={() => onToggle?.(!checked)}
      disabled={disabled || !onToggle}
    >
      <span className="note-toggle-switch-copy">{label}</span>
      <span className="note-toggle-switch-track">
        <span className="note-toggle-switch-thumb" />
      </span>
    </button>
  );
}

const TEXT_STYLE_ACTIONS = [
  { value: "title", label: "Title", blockTag: "h1" },
  { value: "subtitle", label: "Subtitle", blockTag: "h2" },
  { value: "heading", label: "Heading", blockTag: "h3" },
  { value: "subheading", label: "Subheading", blockTag: "h4" },
];

export default function NoteStudioPanel({
  isSaving,
  effectiveRuledLines,
  onNoteRuledLinesChange,
  normalizedNoteColor,
  isUpdatingNoteColor,
  onNoteColorChange,
  editorFormatting,
  onRunRichTextCommand,
  onApplyBlockStyle,
  hasScriptKeyboard,
  noteLanguageOption,
  googleTransliterationMessage,
  isKeyboardOpen,
  onToggleKeyboard,
  noteLanguage,
  onNoteLanguageChange,
  isUpdatingNoteLanguage,
  noteFontStyle,
  noteFontOptions,
  onNoteFontStyleChange,
  isUpdatingNoteFont,
  noteTextSize,
  onNoteTextSizeChange,
}) {
  return (
    <>
      <div className="note-studio-panel">
        <div className="note-studio-panel-intro">
          <div className="min-w-0">
            <p className="section-kicker">Studio Controls</p>
            <h3 className="note-studio-panel-title">Tune the paper & typography</h3>
          </div>
        </div>

        <div className="note-studio-panel-grid">
          <section className="note-studio-section-card">
            <div className="note-studio-section-copy">
              <p className="section-kicker">Typography & Language</p>
              <h4 className="note-studio-section-title">Configure your canvas</h4>
            </div>

            <div className="flex flex-col gap-3">
              <EditorFontSelect
                label="Language"
                value={noteLanguage}
                options={NOTE_LANGUAGE_OPTIONS}
                onChange={onNoteLanguageChange}
                disabled={isSaving || isUpdatingNoteLanguage}
                countLabel={`${NOTE_LANGUAGE_OPTIONS.length} languages`}
                menuLabel="Note language"
                previewGlyph={noteLanguageOption.badgeText ?? "Aa"}
              />

              <EditorFontSelect
                label="Note Font"
                value={noteFontStyle}
                options={noteFontOptions}
                onChange={onNoteFontStyleChange}
                disabled={isSaving || isUpdatingNoteFont}
                kind="note"
                menuLabel="Note font"
                previewGlyph="Ag"
              />

              <EditorFontSelect
                label="Text Size"
                value={noteTextSize}
                options={NOTE_TEXT_SIZE_OPTIONS}
                onChange={onNoteTextSizeChange}
                disabled={isSaving}
                kind="note"
                menuLabel="Note text size"
                countLabel={`${NOTE_TEXT_SIZE_OPTIONS.length} sizes`}
                previewGlyph="16"
              />
            </div>
          </section>

          <section className="note-studio-section-card">
            <div className="note-studio-section-copy">
              <p className="section-kicker">Surface</p>
              <h4 className="note-studio-section-title">Paper feel</h4>
            </div>

            <div className="note-studio-surface-row">
              <ToolbarSwitch
                label={effectiveRuledLines ? "Ruled Paper" : "Plain Paper"}
                checked={effectiveRuledLines}
                disabled={isSaving}
                onToggle={onNoteRuledLinesChange}
              />
            </div>

            <div className="note-studio-palette">
              <div className="note-studio-palette-header">
                <p className="note-studio-mini-label">Paper tone</p>
                <span className="ui-chip">Custom color ready</span>
              </div>

              <div className="note-studio-palette-row">
                {NOTE_COLOR_PRESETS.map((preset) => (
                  <NoteColorSwatch
                    key={preset.value}
                    color={preset.value}
                    label={preset.label}
                    isActive={preset.value === normalizedNoteColor}
                    disabled={isSaving || isUpdatingNoteColor}
                    onSelect={onNoteColorChange}
                  />
                ))}

                <label className="note-color-wheel" title="Choose a custom note color">
                  <span
                    className="note-color-wheel-preview"
                    style={{ backgroundColor: normalizedNoteColor }}
                  />
                  <input
                    type="color"
                    value={normalizedNoteColor}
                    onChange={(event) =>
                      onNoteColorChange?.(toNotePaperColor(event.target.value))
                    }
                    disabled={isSaving || isUpdatingNoteColor || !onNoteColorChange}
                    aria-label="Choose a custom note color"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="note-studio-section-card">
            <div className="note-studio-section-copy">
              <p className="section-kicker">Formatting</p>
              <h4 className="note-studio-section-title">Quick structure</h4>
            </div>

            <div className="flex gap-2">
              <ToolbarButton
                label="Bold"
                isActive={editorFormatting.bold}
                disabled={isSaving}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onRunRichTextCommand("bold")}
              >
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton
                label="Italic"
                isActive={editorFormatting.italic}
                disabled={isSaving}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onRunRichTextCommand("italic")}
              >
                <em>I</em>
              </ToolbarButton>
            </div>

            <div className="note-studio-format-grid mt-1">
              {TEXT_STYLE_ACTIONS.map((action) => (
                <ToolbarButton
                  key={action.value}
                  label={action.label}
                  isActive={editorFormatting.blockTag === action.blockTag}
                  disabled={isSaving}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => onApplyBlockStyle(action.blockTag)}
                >
                  {action.label}
                </ToolbarButton>
              ))}
            </div>
          </section>

          {hasScriptKeyboard ? (
            <section className="note-studio-section-card">
              <div className="note-studio-section-copy">
                <p className="section-kicker">Keyboard</p>
                <h4 className="note-studio-section-title">
                  {noteLanguageOption.nativeLabel} input layout
                </h4>
                {googleTransliterationMessage ? (
                  <p className="note-studio-section-note">
                    {googleTransliterationMessage}
                  </p>
                ) : null}
              </div>

              <div className="note-studio-keyboard-actions">
                <span className="ui-chip">Active only for this script</span>
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-xs"
                  onClick={() => onToggleKeyboard((current) => !current)}
                >
                  {isKeyboardOpen ? "Hide Layout" : "Show Layout"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

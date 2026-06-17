import { getNoteScriptKeyboard } from "../languages/index.js";

export default function NoteScriptKeyboard({
  language,
  disabled = false,
  onInsert,
  interactionLabel,
  physicalHints,
  variant = "full",
}) {
  const keyboard = getNoteScriptKeyboard(language);
  const resolvedInteractionLabel =
    interactionLabel ?? keyboard?.interactionLabel ?? "Tap to insert";
  const resolvedPhysicalHints = physicalHints ?? keyboard?.physicalHints;
  const isDock = variant === "dock";

  if (!keyboard) {
    return null;
  }

  return (
    <div
      className={`panel-inset note-script-keyboard note-script-keyboard-${variant} p-3.5 md:p-4`}
    >
      <div className="note-script-keyboard-header flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-kicker">Script Layout</p>
          <h3
            className={`mt-2 text-xl font-semibold text-slate-900 ${keyboard.className}`}
          >
            {keyboard.title}
          </h3>
          {!isDock ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {keyboard.description}
            </p>
          ) : null}
        </div>

        <span className="ui-chip">{resolvedInteractionLabel}</span>
      </div>

      {!isDock && resolvedPhysicalHints?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {resolvedPhysicalHints.map((hint) => (
            <span key={hint} className="note-keyboard-hint-chip">
              {hint}
            </span>
          ))}
        </div>
      ) : null}

      <div className="note-script-keyboard-sections mt-4 grid gap-3">
        {keyboard.sections.map((section) => (
          <div key={section.title} className="note-keyboard-section">
            <p className="note-keyboard-section-title">{section.title}</p>

            <div className="mt-3 space-y-2">
              {section.rows.map((row, rowIndex) => (
                <div key={`${section.title}-${rowIndex}`} className="note-keyboard-row">
                  {row.map((entry) => {
                    const item =
                      typeof entry === "string"
                        ? { symbol: entry, hint: "" }
                        : entry;

                    const handlePress = (event) => {
                      event.preventDefault();
                      if (!disabled && onInsert) {
                        onInsert(item.symbol);
                      }
                    };

                    return (
                    <button
                      key={`${section.title}-${item.symbol}-${item.hint ?? "plain"}`}
                      type="button"
                      className={`note-keyboard-key ${keyboard.className}`}
                      onPointerDown={handlePress}
                      onClick={handlePress}
                      disabled={disabled || !onInsert}
                      title={
                        item.hint
                          ? `Insert ${item.symbol} using ${item.hint}`
                          : `Insert ${item.symbol}`
                      }
                      aria-label={
                        item.hint
                          ? `Insert ${item.symbol}. Physical key hint ${item.hint}`
                          : `Insert ${item.symbol}`
                      }
                    >
                      <span className="note-keyboard-key-symbol">{item.symbol}</span>
                      {item.hint ? (
                        <span className="note-keyboard-key-hint">{item.hint}</span>
                      ) : null}
                    </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

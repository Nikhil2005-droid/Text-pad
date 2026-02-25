const DEFAULT_REPLACEMENTS = [
  // Sort longest-to-shortest so we match >= before >, etc (if you add more later).
  ["->", "→"],
  ["<=", "≤"],
  [">=", "≥"],
  ["!=", "≠"],
];

function getNativeEvent(event) {
  return event?.nativeEvent ?? event;
}

function getEventTarget(event) {
  return event?.target ?? event?.currentTarget ?? getNativeEvent(event)?.target;
}

function getEventData(event) {
  const native = getNativeEvent(event);
  return native?.data ?? event?.data;
}

function getEventInputType(event) {
  const native = getNativeEvent(event);
  return native?.inputType ?? event?.inputType;
}

function isEventComposing(event) {
  const native = getNativeEvent(event);
  return Boolean(native?.isComposing ?? event?.isComposing);
}

function tryReplaceAtCaret({ event, target, data, replacements }) {
  if (!target) return false;
  if (typeof data !== "string" || data.length === 0) return false;

  if (typeof target.selectionStart !== "number" || typeof target.selectionEnd !== "number") {
    return false;
  }
  if (target.selectionStart !== target.selectionEnd) return false;

  const start = target.selectionStart;
  const lookBehind = target.value.slice(Math.max(0, start - 6), start) + data;

  const sorted = Array.isArray(replacements)
    ? [...replacements].sort((a, b) => b[0].length - a[0].length)
    : [];

  let match = null;
  for (const [pattern, replacement] of sorted) {
    if (lookBehind.endsWith(pattern)) {
      match = { pattern, replacement };
      break;
    }
  }
  if (!match) return false;

  const replaceStart = start - (match.pattern.length - data.length);
  const replaceEnd = start;

  // Select the range to replace, then insert replacement text so undo/redo works.
  try {
    target.focus();
    target.setSelectionRange(replaceStart, replaceEnd);
    const ok = document.execCommand?.("insertText", false, match.replacement);
    if (ok) return true;
  } catch {
    // fall through
  }

  // Fallback: mutate value and manually dispatch input so React sees it.
  try {
    target.setRangeText(match.replacement, replaceStart, replaceEnd, "end");
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Auto-replace short operator sequences as the user types.
 *
 * Goals:
 * - Instant replacement
 * - Cursor stays correct
 * - Undo/redo works (use `execCommand('insertText')` when possible)
 */
export function handleAutoReplaceBeforeInput(event, replacements = DEFAULT_REPLACEMENTS) {
  const target = getEventTarget(event);
  if (!target) return;

  // Only text insertion (not delete, paste, drag/drop, etc).
  if (isEventComposing(event)) return;
  const inputType = getEventInputType(event);
  if (inputType && inputType !== "insertText") return;

  const data = getEventData(event);
  if (typeof data !== "string" || data.length === 0) return;

  // Stop the browser from inserting `data` so we can replace the full sequence.
  // (If no match happens, we'll just do nothing and the browser continues normally.)
  const matched = (() => {
    // We only preventDefault if we know we will apply a replacement.
    // So first check if a replacement is possible, then preventDefault and apply.
    const start = target.selectionStart;
    const lookBehind = target.value.slice(Math.max(0, start - 6), start) + data;
    for (const [pattern] of [...replacements].sort((a, b) => b[0].length - a[0].length)) {
      if (lookBehind.endsWith(pattern)) return true;
    }
    return false;
  })();

  if (!matched) return;
  event.preventDefault();
  tryReplaceAtCaret({ event, target, data, replacements });
}

export const AUTO_REPLACE_DEFAULTS = DEFAULT_REPLACEMENTS;

/**
 * Fallback for environments where `beforeinput` is unreliable.
 * Attach to `onKeyDown` alongside `onBeforeInput`.
 */
export function handleAutoReplaceKeyDown(event, replacements = DEFAULT_REPLACEMENTS) {
  const target = getEventTarget(event);
  if (!target) return;
  if (isEventComposing(event)) return;

  // Ignore shortcuts / navigation keys.
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key !== "Dead" && typeof event.key === "string" && event.key.length !== 1) return;

  const data = event.key;
  if (typeof data !== "string" || data.length !== 1) return;

  // Same "only if a match exists" gating to avoid breaking normal typing.
  const start = target.selectionStart;
  const lookBehind = target.value.slice(Math.max(0, start - 6), start) + data;
  let matched = false;
  for (const [pattern] of [...replacements].sort((a, b) => b[0].length - a[0].length)) {
    if (lookBehind.endsWith(pattern)) {
      matched = true;
      break;
    }
  }
  if (!matched) return;

  event.preventDefault();
  tryReplaceAtCaret({ event, target, data, replacements });
}

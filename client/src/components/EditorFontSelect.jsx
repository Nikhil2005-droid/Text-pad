import { useEffect, useId, useRef, useState } from "react";

export default function EditorFontSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  kind = "note",
  countLabel,
  menuLabel,
  previewGlyph,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();
  const activeOption =
    options.find((option) => option.value === value) ?? options[0];
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === activeOption.value)
  );
  const activePreviewGlyph =
    previewGlyph ??
    activeOption.previewGlyph ??
    (kind === "code" ? "</>" : "Aa");
  const styleCountLabel = countLabel ?? `${options.length} styles`;

  useEffect(() => {
    setHighlightedIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const nextOption = optionRefs.current[highlightedIndex];
    if (!nextOption) return undefined;

    const rafId = window.requestAnimationFrame(() => {
      nextOption.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [highlightedIndex, isOpen]);

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  const openMenu = (nextIndex = activeIndex) => {
    if (disabled || !onChange) return;
    setHighlightedIndex(nextIndex);
    setIsOpen(true);
  };

  const selectOption = (nextValue) => {
    if (disabled || !onChange) return;
    onChange(nextValue);
    closeMenu(true);
  };

  const moveHighlight = (direction) => {
    setHighlightedIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0) return options.length - 1;
      if (nextIndex >= options.length) return 0;
      return nextIndex;
    });
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled || !onChange) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) openMenu(activeIndex);
      else moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) openMenu(activeIndex);
      else moveHighlight(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      openMenu(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      openMenu(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) closeMenu();
      else openMenu(activeIndex);
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleOptionKeyDown = (event, optionIndex, optionValue) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(optionValue);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      closeMenu();
      return;
    }

    if (event.key.length === 1) {
      const typedKey = event.key.toLowerCase();
      const nextIndex = options.findIndex((option, index) => {
        if (index === optionIndex) return false;
        return option.label.toLowerCase().startsWith(typedKey);
      });

      if (nextIndex >= 0) {
        setHighlightedIndex(nextIndex);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className={`editor-select ${isOpen ? "editor-select-open" : ""} ${
        disabled || !onChange ? "editor-select-disabled" : ""
      }`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="editor-select-trigger"
        onClick={() => {
          if (isOpen) closeMenu();
          else openMenu(activeIndex);
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled || !onChange}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        <span
          className={`editor-select-badge ${activeOption.className}`}
          aria-hidden="true"
        >
          {activePreviewGlyph}
        </span>

        <span className="editor-select-main">
          <span className="editor-select-kicker">{label}</span>
          <span className="editor-select-value-row">
            <span className="editor-select-value">{activeOption.label}</span>
            <span className="editor-select-pill">{styleCountLabel}</span>
          </span>
        </span>

        <span className="editor-select-icon-wrap" aria-hidden="true">
          <svg
            className="editor-select-icon"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div className="editor-select-menu-shell" aria-hidden={!isOpen}>
        <ul
          id={listboxId}
          className="editor-select-menu"
          role="listbox"
          aria-label={menuLabel ?? label}
        >
          {options.map((option, index) => {
            const isSelected = option.value === activeOption.value;
            const isHighlighted = index === highlightedIndex;

            return (
              <li key={option.value} role="presentation">
                <button
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isOpen && isHighlighted ? 0 : -1}
                  className={`editor-select-option ${
                    isSelected ? "editor-select-option-selected" : ""
                  } ${
                    isHighlighted ? "editor-select-option-highlighted" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option.value)}
                  onKeyDown={(event) =>
                    handleOptionKeyDown(event, index, option.value)
                  }
                >
                  <span
                    className={`editor-select-option-preview ${option.className}`}
                    aria-hidden="true"
                  >
                    {option.previewGlyph ?? activePreviewGlyph}
                  </span>

                  <span className="editor-select-option-copy">
                    <span
                      className={`editor-select-option-title ${option.className}`}
                    >
                      {option.label}
                    </span>
                    <span className="editor-select-option-text">
                      {option.description}
                    </span>
                  </span>

                  <span
                    className={`editor-select-option-check ${
                      isSelected ? "editor-select-option-check-visible" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 10.5L8.25 13.75L15 7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

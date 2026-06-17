import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const AppFeedbackContext = createContext(null);
const DEFAULT_TOAST_DURATION = 3600;

function toneClasses(tone) {
  if (tone === "error") {
    return "border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,248,248,0.96)_0%,rgba(254,236,236,0.92)_100%)] text-rose-700";
  }

  if (tone === "success") {
    return "border-emerald-200/90 bg-[linear-gradient(180deg,rgba(247,255,250,0.96)_0%,rgba(232,250,239,0.92)_100%)] text-emerald-700";
  }

  return "border-[rgba(104,84,58,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,239,229,0.92)_100%)] text-slate-700";
}

export function AppFeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const toastTimeoutsRef = useRef(new Map());
  const dialogResolverRef = useRef(null);
  const returnFocusRef = useRef(null);
  const confirmButtonRef = useRef(null);

  const dismissToast = useCallback((id) => {
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title = "", message = "", tone = "info", duration = DEFAULT_TOAST_DURATION }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const nextToast = { id, title, message, tone };

      setToasts((current) => [...current, nextToast]);

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, duration);

      toastTimeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [dismissToast]
  );

  const closeDialog = useCallback((result) => {
    const resolver = dialogResolverRef.current;
    dialogResolverRef.current = null;
    setDialog(null);

    if (resolver) {
      resolver(result);
    }

    const previousFocus = returnFocusRef.current;
    returnFocusRef.current = null;
    if (previousFocus && typeof previousFocus.focus === "function") {
      window.requestAnimationFrame(() => {
        previousFocus.focus();
      });
    }
  }, []);

  const confirm = useCallback((options = {}) => {
    if (dialogResolverRef.current) {
      dialogResolverRef.current(false);
      dialogResolverRef.current = null;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return new Promise((resolve) => {
      dialogResolverRef.current = resolve;
      setDialog({
        title: options.title || "Please confirm",
        message: options.message || "",
        confirmLabel: options.confirmLabel || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
        tone: options.tone || "default",
      });
    });
  }, []);

  useEffect(() => {
    const toastTimeouts = toastTimeoutsRef.current;

    return () => {
      for (const timeoutId of toastTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      toastTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(false);
      }
    };

    const rafId = window.requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDialog, dialog]);

  return (
    <AppFeedbackContext.Provider value={{ confirm, notify, dismissToast }}>
      {children}

      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-4 sm:px-4 md:px-6">
          <div className="flex w-full max-w-[1480px] justify-end">
            <div className="flex w-full max-w-[380px] flex-col gap-3">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={`pointer-events-auto rounded-[1.6rem] border px-4 py-3 shadow-[0_24px_48px_rgba(76,58,38,0.16)] backdrop-blur-xl tp-enter ${toneClasses(
                    toast.tone
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      {toast.title ? (
                        <p className="text-sm font-semibold text-slate-900">
                          {toast.title}
                        </p>
                      ) : null}
                      <p className="text-sm leading-6">{toast.message}</p>
                    </div>
                    <button
                      type="button"
                      className="icon-button h-9 w-9 shrink-0"
                      onClick={() => dismissToast(toast.id)}
                      aria-label="Dismiss notification"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {dialog ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(28,39,56,0.24)] backdrop-blur-sm"
            onClick={() => closeDialog(false)}
            aria-label="Close dialog"
          />
          <div className="relative flex min-h-full items-center justify-center p-4">
            <div
              role={dialog.tone === "danger" ? "alertdialog" : "dialog"}
              aria-modal="true"
              className="panel tp-enter relative w-full max-w-[30rem] p-6 md:p-7"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${
                    dialog.tone === "danger"
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-[rgba(188,116,65,0.18)] bg-[rgba(242,218,193,0.52)] text-[var(--tp-accent-strong)]"
                  }`}
                  aria-hidden="true"
                >
                  {dialog.tone === "danger" ? "!" : "?"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="section-kicker">
                    {dialog.tone === "danger" ? "Confirm Delete" : "Confirm Action"}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    {dialog.title}
                  </h2>
                  {dialog.message ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {dialog.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => closeDialog(false)}
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  className={dialog.tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
                  onClick={() => closeDialog(true)}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);

  if (!context) {
    throw new Error("useAppFeedback must be used within AppFeedbackProvider");
  }

  return context;
}

export default function StatusState({
  tone = "info",
  kicker = "Status",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) {
  const isError = tone === "error";
  const isLoading = tone === "loading";
  const iconLabel = isError ? "!" : isLoading ? "" : "?";

  return (
    <div
      className={`panel-muted flex min-h-[18rem] flex-col items-start justify-center p-6 text-slate-600 md:p-8 ${className}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl border ${
          isError
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-[rgba(188,116,65,0.18)] bg-[rgba(242,218,193,0.52)] text-[var(--tp-accent-strong)]"
        }`}
        aria-hidden="true"
      >
        {isLoading ? (
          <span className="status-spinner" />
        ) : (
          <span className="text-lg font-semibold">{iconLabel}</span>
        )}
      </div>
      <p className="section-kicker mt-5">{kicker}</p>
      <h1 className="font-display mt-3 max-w-2xl text-3xl font-semibold text-slate-900 md:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
          {description}
        </p>
      ) : null}
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {actionLabel && onAction ? (
            <button type="button" className="btn btn-primary" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <button type="button" className="btn btn-soft" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

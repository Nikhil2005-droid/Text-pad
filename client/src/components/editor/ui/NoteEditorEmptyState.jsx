export default function NoteEditorEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="panel-muted flex h-full flex-col items-start justify-center p-8 text-slate-600">
      <p className="section-kicker">Note Studio</p>
      <h2 className="font-display mt-3 text-3xl font-semibold text-slate-900">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      <button className="btn btn-primary mt-5" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

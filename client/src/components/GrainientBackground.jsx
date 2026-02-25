export default function GrainientBackground() {
  return (
    <div
      aria-hidden="true"
      className="grainient-shell pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="grainient-base" />
      <div className="grainient-blob grainient-blob-a" />
      <div className="grainient-blob grainient-blob-b" />
      <div className="grainient-blob grainient-blob-c" />
      <div className="grainient-noise" />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/80 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-4 text-xs leading-tight text-slate-500 md:flex-row md:px-8 md:text-sm">
        <span>Developed by ....</span>
        <span>&copy; {new Date().getFullYear()} Notes Suite</span>
      </div>
    </footer>
  );
}

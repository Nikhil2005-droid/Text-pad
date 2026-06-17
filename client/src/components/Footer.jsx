export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto px-4 pt-2 md:px-8 md:pt-3">
      <div className="mx-auto h-[46px] w-full max-w-[72rem] overflow-visible md:h-[54px]">
        <div className="panel relative flex h-[96px] w-full items-start justify-between overflow-hidden rounded-[2.5rem] border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,248,241,0.82)_48%,rgba(245,236,223,0.74)_100%)] px-5 pt-3 text-[11px] leading-tight text-slate-500 shadow-[0_28px_60px_-36px_rgba(71,57,40,0.7)] md:h-[108px] md:px-7 md:pt-4 md:text-sm">
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/35 via-white/12 to-transparent" />
          <span className="section-kicker relative z-10 whitespace-nowrap !text-[10px] !tracking-[0.26em] text-slate-500/90">
            Developed by{" "}
            <a
              className="footer-nikhil-link"
              href="https://nikhils-portfolio-mauve.vercel.app/"
              target="_blank"
              rel="noreferrer"
              title="View Nikhil's portfolio"
              aria-label="View Nikhil's portfolio"
            >
              Nikhil
              <span className="footer-nikhil-tooltip" aria-hidden="true">
                
              </span>
            </a>
          </span>
          <span className="font-display relative z-10 whitespace-nowrap text-sm text-slate-700 md:text-base">
            &copy; {new Date().getFullYear()} Text Pad
          </span>
        </div>
      </div>
    </footer>
  );
}

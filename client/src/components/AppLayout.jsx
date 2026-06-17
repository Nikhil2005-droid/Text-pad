import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import GrainientBackground from "./GrainientBackground.jsx";

export default function AppLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    // Show splash screen for 1.8 seconds, then trigger exit transition
    const timer = setTimeout(() => {
      setFadeSplash(true);
      const exitTimer = setTimeout(() => {
        setShowSplash(false);
      }, 600); // 600ms match transition duration
      return () => clearTimeout(exitTimer);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <GrainientBackground />
      {showSplash && (
        <div 
          className={`splash-screen ${fadeSplash ? "splash-exit" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Loading Text Pad"
        >
          <div className="splash-glow-container">
            <div className="splash-glow splash-glow-1" />
            <div className="splash-glow splash-glow-2" />
            <div className="splash-glow splash-glow-3" />
          </div>
          <div className="splash-content">
            <div className="splash-logo-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="splash-logo"
                draggable="false"
                aria-label="Text Pad Logo"
              >
                <rect x="4" y="4" width="56" height="56" rx="16" fill="#0f172a"/>
                <rect className="splash-logo-caret" x="31" y="18" width="2" height="28" rx="1" fill="#e5e7eb"/>
              </svg>
            </div>
            <h1 className="splash-title">Text Pad</h1>
            <p className="splash-subtitle">Notes & code, together</p>
            <div className="splash-loader">
              <div className="splash-loader-bar" />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="w-full flex-1 px-3 pb-12 pt-4 sm:px-4 md:px-6 md:pb-14 md:pt-6 xl:px-8">
          <div className="motion-rise-in mx-auto w-full max-w-[1480px]">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

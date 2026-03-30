import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import GrainientBackground from "./GrainientBackground.jsx";

export default function AppLayout() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <GrainientBackground />
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="w-full flex-1 px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

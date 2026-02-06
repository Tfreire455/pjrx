import React from "react";
import { useLocation, Outlet, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLogout } from "../../hooks/useLogout";

// --- GLOBAL ATMOSPHERE BACKGROUND ---
function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#030014] overflow-hidden pointer-events-none">
      {/* Luzes Ambiente Sutis (Menos intensas que a Landing para focar no conteúdo) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-900/10 blur-[100px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-indigo-900/10 blur-[100px] mix-blend-screen" />
      
      {/* Noise Texture para evitar color banding */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-violet-500/30">
      <AppBackground />
      
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:h-screen lg:overflow-hidden flex flex-col">
        <Topbar onLogout={handleLogout} />

        <div className="mt-6 flex-1 grid grid-cols-12 gap-6 lg:overflow-hidden">
          {/* Sidebar Area */}
          <div className="col-span-12 lg:col-span-2 hidden lg:flex flex-col h-full overflow-y-auto">
            <Sidebar />
            
            {/* Footer Links (Moved to Sidebar bottom for Desktop) */}
            <div className="mt-auto pt-6 text-xs text-zinc-500/60 font-medium">
              <span className="opacity-80">PRJX OS v2.0</span>
              <div className="mt-1 flex gap-2">
                 <Link to="/" className="hover:text-violet-400 transition-colors">Landing</Link>
                 <span>•</span>
                 <Link to="/legal" className="hover:text-violet-400 transition-colors">Termos</Link>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="col-span-12 lg:col-span-10 relative h-full lg:overflow-y-auto lg:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8, scale: 0.99, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, scale: 0.99, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
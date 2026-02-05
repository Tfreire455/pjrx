import React from "react";
import { useLocation, Outlet, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLogout } from "../../hooks/useLogout";

export function AppShell() {
  const location = useLocation();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        <Topbar onLogout={handleLogout} />

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3">
            <Sidebar />
          </div>

          <main className="col-span-12 lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <div className="mt-8 text-center text-xs text-muted">
          <span className="opacity-80">PRJX</span>{" "}
          <span className="opacity-50">
            • Projetos em movimento. Sem caos.
          </span>{" "}
          <Link
            to="/"
            className="underline underline-offset-4 opacity-70 hover:opacity-100"
          >
            Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
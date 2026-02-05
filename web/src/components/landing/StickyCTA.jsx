import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

export function StickyCTA({ visible }) {
  const location = useLocation();
  const hideOnAuth = ["/login", "/register", "/app"].some((p) => location.pathname.startsWith(p));

  if (hideOnAuth) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed bottom-4 left-0 right-0 z-40 px-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-xl shadow-soft px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/25 flex items-center justify-center">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text">PRJX pronto pra rodar</div>
                <div className="text-xs text-muted">Crie seu workspace e teste o fluxo com IA + WhatsApp</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost">Ver demo</Button></Link>
              <Link to="/register"><Button>Começar</Button></Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

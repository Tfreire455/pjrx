import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

export function Drawer({ open, onClose, title, children, className, side = "right" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const fromX = side === "right" ? 28 : -28;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl"
            initial={{ x: fromX, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: fromX, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.8}}
          >
            <div className={cn("h-full border-l border-border bg-card shadow-soft flex flex-col", className)}>
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="text-base font-semibold text-text">{title}</div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/5 border border-white/10"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-auto">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

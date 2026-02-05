import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

export function TaskCard({ task, onClick, dragging }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border border-white/10 bg-white/3 p-4",
        "transition hover:-translate-y-0.5 hover:border-white/20",
        dragging ? "opacity-60" : ""
      ].join(" ")}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text truncate">{task.title}</div>
          <div className="mt-1 text-xs text-muted truncate">{task.description || "—"}</div>
        </div>

        <Badge
          tone={
            task.status === "done" ? "success" :
            task.status === "blocked" ? "warning" :
            task.status === "doing" ? "secondary" : "neutral"
          }
          className="shrink-0"
        >
          {task.status}
        </Badge>
      </div>

      <div className="mt-2 text-xs text-muted opacity-80">
        {task.dueAt ? `Prazo: ${new Date(task.dueAt).toLocaleString()}` : "Sem prazo"}
      </div>
    </motion.button>
  );
}

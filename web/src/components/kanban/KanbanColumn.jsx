import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

export function KanbanColumn({ id, title, tone, tasks, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text">{title}</div>
        <Badge tone={tone}>{tasks.length}</Badge>
      </div>

      <motion.div
        ref={setNodeRef}
        className={[
          "mt-3 min-h-[220px] rounded-2xl border border-white/10 p-2 space-y-2",
          isOver ? "bg-primary/10 border-primary/25" : "bg-black/10"
        ].join(" ")}
        layout
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </motion.div>
    </div>
  );
}

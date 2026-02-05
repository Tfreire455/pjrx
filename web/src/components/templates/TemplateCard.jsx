import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function TemplateCard({ tpl, onEdit, onDelete }) {
  const count = (tpl.items || []).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-white/10 bg-white/3 p-5 hover:-translate-y-1 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text truncate">{tpl.title}</div>
          <div className="mt-1 text-xs text-muted truncate">
            {(tpl.items || []).slice(0, 3).map((i) => i.text).join(" • ") || "—"}
          </div>
        </div>
        <Badge tone="secondary">{count} itens</Badge>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onEdit}>Editar</Button>
        <Button variant="ghost" className="flex-1" onClick={onDelete}>Excluir</Button>
      </div>
    </motion.div>
  );
}

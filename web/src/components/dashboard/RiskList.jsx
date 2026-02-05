import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

function Item({ t }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-white/10 bg-white/3 p-4 flex items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text truncate">{t.title}</div>
        <div className="mt-1 text-xs text-muted flex items-center gap-2">
          <Clock size={14} className="opacity-80" />
          <span className="opacity-90">Prazo:</span>
          <span className="text-text/90">{new Date(t.dueAt).toLocaleString()}</span>
        </div>
      </div>
      <Badge tone="danger" className="shrink-0">
        <AlertTriangle size={14} /> risco
      </Badge>
    </motion.div>
  );
}

export function RiskList({ loading, tasks }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarefas em risco</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : tasks?.length ? (
          tasks.slice(0, 5).map((t) => <Item key={t.id} t={t} />)
        ) : (
          <div className="text-sm text-muted">
            Nenhuma tarefa em risco agora. 👌
          </div>
        )}
      </CardContent>
    </Card>
  );
}

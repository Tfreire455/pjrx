import React from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

function typeTone(type) {
  if (type === "task") return "primary";
  if (type === "project") return "secondary";
  if (type === "sprint") return "warning";
  if (type === "ai") return "success";
  return "neutral";
}

export function ActivityList({ loading, items }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Atividade recente</CardTitle>
        <Badge tone="neutral"><Bell size={14} /> in-app</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : items?.length ? (
          items.slice(0, 6).map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/3 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text truncate">{n.title}</div>
                <Badge tone={typeTone(n.type)} className="shrink-0">{n.type}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted">{n.body}</div>
              <div className="mt-2 text-xs text-muted opacity-80">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-sm text-muted">Sem notificações ainda.</div>
        )}
      </CardContent>
    </Card>
  );
}

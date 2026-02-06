import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, User } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function ActivityList({ activities = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted">
        Sem atividades recentes.
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Linha vertical conectora */}
      <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-white/5 -z-10" />

      {activities.map((log) => (
        <div key={log.id} className="flex gap-3 items-start relative group">
          <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:border-primary/50 transition-colors">
            {log.actor?.avatarUrl ? (
              <img src={log.actor.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={14} className="text-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm text-text truncate">
              <span className="font-semibold text-primary">{log.actor?.name || "Sistema"}</span>
              <span className="text-muted-foreground mx-1">
                {formatAction(log.action)}
              </span>
              <span className="text-text">{log.details || log.entityType}</span>
            </p>
            <p className="text-[10px] text-muted">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAction(action) {
  const map = {
    "task.create": "criou a tarefa",
    "task.update": "atualizou",
    "task.delete": "removeu",
    "project.create": "criou o projeto",
    "sprint.create": "iniciou a sprint"
  };
  return map[action] || action;
}
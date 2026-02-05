import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { CheckSquare } from "lucide-react";

export function ChecklistPanel({ checklistQ, onToggle, toggling }) {
  // Hook useChecklist agora usa 'select' para retornar direto o array de checklists
  const data = checklistQ?.data || [];
  const loading = checklistQ?.isLoading;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-sm text-muted p-4 text-center border border-dashed border-white/10 rounded-xl">
        Nenhuma checklist criada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((cl) => {
        const items = cl.items || [];
        // DB usa 'done', não 'checked'
        const doneCount = items.filter((i) => i.done).length;

        return (
          <div key={cl.id} className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-primary" />
                <div className="text-sm font-semibold text-text">{cl.title || "Checklist"}</div>
              </div>
              <Badge tone={doneCount === items.length && items.length > 0 ? "success" : "secondary"}>
                {doneCount}/{items.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {items.map((it) => (
                <button
                  key={it.id}
                  // Passamos o item inteiro ou ID para o pai tratar o toggle
                  onClick={() => onToggle(it.id, !it.done)}
                  disabled={toggling}
                  className="w-full text-left rounded-xl border border-white/5 bg-black/20 p-3 hover:bg-white/5 transition disabled:opacity-50 flex items-start gap-3 group"
                >
                  <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition ${it.done ? "bg-primary border-primary" : "border-white/30 group-hover:border-white/50"}`}>
                    {it.done && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  
                  <div className="text-sm text-text flex-1 break-words">
                    <span className={it.done ? "line-through opacity-50" : ""}>
                      {it.content} {/* DB usa 'content' */}
                    </span>
                  </div>
                </button>
              ))}
              {items.length === 0 && <div className="text-xs text-muted italic">Lista vazia.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
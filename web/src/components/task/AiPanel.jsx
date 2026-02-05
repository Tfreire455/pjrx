import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export function AiPanel({ task, aiPlan }) {
  const [result, setResult] = useState(null);

  const context = useMemo(() => {
    if (!task) return "";
    return `
Tarefa: ${task.title}
Descrição: ${task.description || "—"}
Status: ${task.status}
Prioridade: ${task.priority}
Prazo: ${task.dueAt || "—"}
Objetivo: gerar um plano de implementação detalhado.
`.trim();
  }, [task]);

  async function run() {
    // O hook useAiTaskPlan espera { title, context } e mapeia para 'feature'
    const res = await aiPlan.mutateAsync({
      title: `Plano para: ${task.title}`,
      context
    });
    // O backend retorna { insightId, result: ... }
    setResult(res?.result || res?.data || res);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-muted">
        A IA analisará o contexto desta tarefa para sugerir <span className="text-text">riscos</span> e <span className="text-text">próximas ações</span>.
      </div>

      <Button variant="secondary" className="w-full" disabled={aiPlan.isPending || !task} onClick={run}>
        {aiPlan.isPending ? "Gerando plano..." : "Gerar Plano com IA"}
      </Button>

      {aiPlan.isPending ? <Skeleton className="h-32 w-full" /> : null}

      {result ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-auto max-h-[400px]">
          <pre className="text-xs text-text font-mono whitespace-pre-wrap">
            {pretty(result)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
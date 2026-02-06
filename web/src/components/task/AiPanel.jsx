import React, { useState } from "react";
import { Sparkles, Plus, AlertTriangle, ListTodo } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

export function AiPanel({ workspaceId, projectId, taskId, taskTitle, taskDescription }) {
  const [plan, setPlan] = useState(null);
  const qc = useQueryClient();

  // 1. Gerar Plano (API de IA)
  const generate = useMutation({
    mutationFn: async () => {
      return apiFetch("/ai/feature-implementation-plan", {
        method: "POST",
        body: {
          workspaceId,
          projectId: projectId || undefined,
          feature: taskTitle,
          context: taskDescription || "Implementação padrão."
        }
      });
    },
    onSuccess: (res) => {
      const data = res.result || res.data?.result;
      if (data && (data.steps?.length > 0 || data.risks?.length > 0)) {
        setPlan(data);
        toast.success("Plano gerado!");
      } else {
        toast.error("Sem sugestões da IA.");
      }
    },
    onError: (e) => toast.error("Erro na IA: " + e.message)
  });

  // 2. Adicionar Item (API de Checklists)
  const addChecklistItem = useMutation({
    mutationFn: async (content) => {
      let checklistId;
      
      // Busca dados atuais da tarefa
      const taskData = qc.getQueryData(["task", workspaceId, taskId]);
      // Extrai checklists com segurança (suporta { data: { task: ... } } ou { task: ... })
      const t = taskData?.data?.task || taskData?.task || {};
      const checklists = t.checklists || [];
      
      if (checklists.length > 0) {
        checklistId = checklists[0].id;
      } else {
        // Cria nova se não existir
        const res = await apiFetch(`/w/${workspaceId}/checklists`, {
          method: "POST",
          body: { taskId, title: "Plano de Implementação" }
        });
        // Extrai o ID da nova lista com segurança
        checklistId = res.checklist?.id || res.data?.checklist?.id;
      }

      if (!checklistId) throw new Error("Falha ao identificar checklist ID");

      // Adiciona o item
      return apiFetch(`/w/${workspaceId}/checklists/${checklistId}/items`, {
        method: "POST",
        body: { content }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskId] });
      toast.success("Item adicionado!");
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message)
  });

  if (generate.isPending) {
    return (
      <div className="space-y-4 p-4 text-center">
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-20 w-full mb-2" />
        <p className="text-xs text-muted animate-pulse">Analisando tarefa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {!plan && (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted mb-4">
            Gerar checklist técnica e riscos para esta tarefa.
          </p>
          <Button onClick={() => generate.mutate()} className="w-full">
            Gerar Plano com IA
          </Button>
        </div>
      )}

      {plan && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-sm font-medium text-muted">Complexidade</span>
            <span className={`text-sm font-bold ${plan.complexity === 'High' ? 'text-red-400' : 'text-green-400'}`}>
              {plan.complexity}
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <ListTodo size={16} /> Sugestões
            </h4>
            {plan.steps?.map((step, i) => (
              <Card key={i} className="bg-surface border-white/10">
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <span className="text-sm text-text mt-0.5">{step}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 shrink-0 hover:text-primary"
                    onClick={() => addChecklistItem.mutate(step)}
                    disabled={addChecklistItem.isPending}
                  >
                    <Plus size={14} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {plan.risks?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} /> Riscos
              </h4>
              {plan.risks.map((risk, i) => (
                <div key={i} className="p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  {risk}
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setPlan(null)} className="w-full text-xs">
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
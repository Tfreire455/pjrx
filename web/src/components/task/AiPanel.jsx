import React, { useState } from "react";
import { Sparkles, Plus, AlertTriangle, CheckSquare, ListTodo } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

export function AiPanel({ workspaceId, taskId, taskTitle, taskDescription }) {
  const [plan, setPlan] = useState(null);
  const qc = useQueryClient();

  // 1. Gerar Plano
  const generate = useMutation({
    mutationFn: async () => {
      // Envia dados ricos para a IA não retornar vazio
      return apiFetch("/ai/feature-implementation-plan", {
        method: "POST",
        body: {
          workspaceId,
          projectId: "ignore", // O backend precisa, mas não usa para feature
          feature: taskTitle,
          context: taskDescription || "Implementação padrão de software web."
        }
      });
    },
    onSuccess: (res) => {
      // O backend retorna { insightId, result: { risks, steps, complexity } }
      const data = res.result || res.data?.result;
      
      if (data && (data.steps?.length > 0 || data.risks?.length > 0)) {
        setPlan(data);
        toast.success("Plano gerado com sucesso!");
      } else {
        toast.error("A IA não retornou sugestões. Tente adicionar mais detalhes ao título.");
      }
    },
    onError: (e) => toast.error(e.message)
  });

  // 2. Adicionar Item à Checklist
  const addChecklistItem = useMutation({
    mutationFn: async (content) => {
      // Primeiro descobre ou cria uma checklist padrão
      let checklistId;
      
      // Busca checklists atuais do cache
      const taskData = qc.getQueryData(["task", workspaceId, taskId]);
      const checklists = taskData?.data?.task?.checklists || taskData?.task?.checklists || [];
      
      if (checklists.length > 0) {
        checklistId = checklists[0].id;
      } else {
        // Cria uma checklist nova se não existir
        const newList = await apiFetch("/checklists", {
          method: "POST",
          body: { workspaceId, taskId, title: "Plano de Implementação" }
        });
        checklistId = newList.checklist.id;
      }

      // Adiciona o item
      return apiFetch(`/checklists/${checklistId}/items`, {
        method: "POST",
        body: { workspaceId, content }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskId] });
      toast.success("Item adicionado à checklist!");
    }
  });

  if (generate.isPending) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <p className="text-center text-xs text-muted animate-pulse">A IA está pensando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {!plan && (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted mb-4">
            Gere um passo-a-passo técnico e análise de riscos para esta tarefa.
          </p>
          <Button onClick={() => generate.mutate()} className="w-full">
            Gerar Plano com IA
          </Button>
        </div>
      )}

      {plan && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Complexidade */}
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-sm font-medium text-muted">Complexidade Estimada</span>
            <span className={`text-sm font-bold ${plan.complexity === 'High' ? 'text-red-400' : 'text-green-400'}`}>
              {plan.complexity}
            </span>
          </div>

          {/* Passos de Implementação */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <ListTodo size={16} /> Checklist Sugerida
            </h4>
            {plan.steps?.map((step, i) => (
              <Card key={i} className="bg-surface border-white/10">
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <span className="text-sm text-text mt-0.5">{step}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 shrink-0 hover:bg-primary/20 hover:text-primary"
                    onClick={() => addChecklistItem.mutate(step)}
                    disabled={addChecklistItem.isPending}
                  >
                    <Plus size={14} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Riscos */}
          {plan.risks?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Riscos Técnicos
              </h4>
              {plan.risks.map((risk, i) => (
                <div key={i} className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  {risk}
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setPlan(null)} className="w-full text-xs">
            Limpar / Gerar Novo
          </Button>
        </div>
      )}
    </div>
  );
}
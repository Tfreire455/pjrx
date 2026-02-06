import React, { useState } from "react";
import { Sparkles, AlertTriangle, Plus, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

import { useCreateTask } from "../../hooks/useCreateTask";
import { useCreateSprint } from "../../hooks/useSprints";

// Helper de data
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function AiProjectPanel({ workspaceId, project }) {
  const [plan, setPlan] = useState(null);
  const [addedItems, setAddedItems] = useState({});

  const createTask = useCreateTask(workspaceId);
  const createSprint = useCreateSprint(workspaceId);

  const generatePlan = useMutation({
    mutationFn: async () => {
      return apiFetch("/ai/generate-project-plan", {
        method: "POST",
        body: {
          workspaceId,
          projectId: project.id,
          projectName: project.name,
          projectDescription: project.description,
          context: "Gerar plano executável."
        }
      });
    },
    onSuccess: (res) => {
      // Lê o resultado onde quer que ele esteja
      const payload = res.data || res;
      if (payload?.result) {
        setPlan(payload.result);
        setAddedItems({});
        toast.success("Plano gerado e registrado!");
      } else {
        toast.error("IA retornou vazio.");
      }
    },
    onError: (err) => toast.error("Erro na IA: " + err.message)
  });

  // Ação: Criar Tarefa (Risco ou Ação)
  async function handleAddTask(item, type, index) {
    const key = `${type}-${index}`;
    if (addedItems[key]) return;

    const dueAt = item.dueInDays ? addDays(new Date(), item.dueInDays).toISOString() : null;
    const title = type === 'risk' ? `Mitigar: ${item.risk}` : item.title;
    
    try {
      await createTask.mutateAsync({
        projectId: project.id,
        title,
        description: type === 'risk' ? item.mitigation : "Sugestão da IA",
        status: "todo",
        priority: item.priority === 'high' || item.impact === 'High' ? 'high' : 'medium',
        dueAt
      });
      setAddedItems(prev => ({ ...prev, [key]: true }));
      toast.success("Adicionado à lista!");
    } catch (e) {
      toast.error("Falha ao criar tarefa.");
    }
  }

  // Ação: Criar Sprint
  async function handleCreateSprint(sprint, index) {
    const key = `sprint-${index}`;
    if (addedItems[key]) return;

    const start = new Date();
    const end = addDays(start, sprint.durationDays || 14);

    try {
      await createSprint.mutateAsync({
        projectId: project.id,
        name: sprint.name,
        goal: sprint.goal,
        startAt: start.toISOString(),
        endAt: end.toISOString()
      });
      setAddedItems(prev => ({ ...prev, [key]: true }));
      toast.success("Sprint criada!");
    } catch (e) {
      toast.error("Falha ao criar sprint.");
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-primary" size={20} />
            Copiloto de Planejamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted mb-4">
            A IA vai gerar sugestões de <strong>Riscos</strong>, <strong>Ações</strong> e <strong>Sprints</strong>. 
            Clique nos botões abaixo dos cards para efetivar as sugestões.
          </p>
          <Button onClick={() => generatePlan.mutate()} disabled={generatePlan.isPending}>
            {generatePlan.isPending ? "Gerando..." : "Gerar Plano do Projeto"}
          </Button>
        </CardContent>
      </Card>

      {generatePlan.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
        </div>
      )}

      {plan && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Sprints */}
          {plan.sprintSuggestions && (
            <Card>
              <CardHeader><CardTitle className="text-base text-blue-400">Sugestão de Sprints</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {plan.sprintSuggestions.map((s, i) => {
                    const isAdded = addedItems[`sprint-${i}`];
                    return (
                      <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/5 flex flex-col justify-between gap-3">
                        <div>
                          <div className="font-bold text-text">{s.name}</div>
                          <div className="text-xs text-muted mt-1">{s.goal}</div>
                          <div className="mt-2"><Badge tone="secondary">{s.durationDays} dias</Badge></div>
                        </div>
                        <Button size="sm" variant={isAdded ? "ghost" : "secondary"} disabled={isAdded} onClick={() => handleCreateSprint(s, i)}>
                          {isAdded ? "Criada" : "Criar Sprint"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Riscos */}
            <Card>
              <CardHeader><CardTitle className="text-base text-red-400">Riscos (Gerar Tarefas)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.risks?.map((r, i) => {
                    const isAdded = addedItems[`risk-${i}`];
                    return (
                      <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/5">
                        <div className="flex justify-between">
                          <span className="font-semibold text-text text-sm">{r.risk}</span>
                          <Badge tone="danger">{r.impact || "High"}</Badge>
                        </div>
                        <p className="text-xs text-muted mt-1">{r.mitigation}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-[10px] text-muted">Prazo: {r.dueInDays} dias</span>
                          <Button size="sm" variant="ghost" disabled={isAdded} onClick={() => handleAddTask(r, 'risk', i)}>
                            {isAdded ? <CheckCircle2 size={14}/> : <Plus size={14}/>}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardHeader><CardTitle className="text-base text-green-400">Próximos Passos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.nextActions?.map((a, i) => {
                    const title = a.title || a; // Compatibilidade
                    const due = a.dueInDays || 2;
                    const isAdded = addedItems[`action-${i}`];
                    return (
                      <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-text">{title}</div>
                          <div className="text-[10px] text-muted">Prazo sugerido: {due} dias</div>
                        </div>
                        <Button size="sm" variant="secondary" disabled={isAdded} onClick={() => handleAddTask({ title, dueInDays: due }, 'action', i)}>
                          {isAdded ? "Adicionado" : "Adicionar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
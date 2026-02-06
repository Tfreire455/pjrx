import React, { useState } from "react";
import { Sparkles, Plus, CheckCircle2, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { useCreateTask } from "../../hooks/useCreateTask";
import { useCreateSprint } from "../../hooks/useSprints";

function addDays(d, days) { const date = new Date(d); date.setDate(date.getDate() + days); return date; }

export function AiProjectPanel({ workspaceId, project }) {
  const [plan, setPlan] = useState(null);
  const [added, setAdded] = useState({});
  const createTask = useCreateTask(workspaceId);
  const createSprint = useCreateSprint(workspaceId);

  const generate = useMutation({
    mutationFn: () => apiFetch("/ai/generate-project-plan", {
      method: "POST",
      body: { workspaceId, projectId: project.id, projectName: project.name, projectDescription: project.description }
    }),
    onSuccess: (res) => {
      const data = res.data?.result || res.result; // Tenta extrair de múltiplos lugares
      if (data) { setPlan(data); toast.success("Plano gerado!"); } 
      else toast.error("Erro ao ler resposta da IA");
    },
    onError: (e) => toast.error(e.message)
  });

  async function addT(item, type, idx) {
    if (added[`${type}${idx}`]) return;
    try {
      await createTask.mutateAsync({
        projectId: project.id,
        title: type === 'risk' ? `Risco: ${item.risk}` : item.title || item,
        description: type === 'risk' ? item.mitigation : "Sugestão IA",
        dueAt: item.dueInDays ? addDays(new Date(), item.dueInDays).toISOString() : null
      });
      setAdded(prev => ({ ...prev, [`${type}${idx}`]: true }));
      toast.success("Adicionado!");
    } catch (e) { toast.error("Erro ao criar"); }
  }

  async function addS(sprint, idx) {
    if (added[`sprint${idx}`]) return;
    try {
      await createSprint.mutateAsync({
        projectId: project.id,
        name: sprint.name,
        goal: sprint.goal,
        startAt: new Date().toISOString(),
        endAt: addDays(new Date(), sprint.durationDays || 14).toISOString()
      });
      setAdded(prev => ({ ...prev, [`sprint${idx}`]: true }));
      toast.success("Sprint criada!");
    } catch (e) { toast.error("Erro ao criar sprint"); }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader><CardTitle className="flex gap-2"><Sparkles size={18}/> Copilot</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted">A IA vai analisar o projeto <strong>{project.name}</strong>.</p>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? "Gerando..." : "Gerar Plano"}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2">
          {plan.sprintSuggestions && (
            <Card><CardHeader><CardTitle>Sprints</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
              {plan.sprintSuggestions.map((s, i) => (
                <div key={i} className="p-3 border border-white/10 rounded flex flex-col gap-2">
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-muted">{s.goal}</div>
                  <Button size="sm" variant="secondary" onClick={() => addS(s, i)} disabled={added[`sprint${i}`]}>
                    {added[`sprint${i}`] ? "Criada" : "Criar Sprint"}
                  </Button>
                </div>
              ))}
            </CardContent></Card>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Riscos</CardTitle></CardHeader><CardContent className="space-y-2">
              {plan.risks?.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-2 border-b border-white/5">
                  <div className="text-sm">
                    <div className="font-semibold text-red-400">{r.risk}</div>
                    <div className="text-xs text-muted">{r.mitigation}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => addT(r, 'risk', i)} disabled={added[`risk${i}`]}>
                    {added[`risk${i}`] ? <CheckCircle2 size={16}/> : <Plus size={16}/>}
                  </Button>
                </div>
              ))}
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Ações</CardTitle></CardHeader><CardContent className="space-y-2">
              {plan.nextActions?.map((a, i) => (
                <div key={i} className="flex justify-between items-center p-2 border-b border-white/5">
                  <span className="text-sm">{a.title || a}</span>
                  <Button size="icon" variant="ghost" onClick={() => addT(a, 'action', i)} disabled={added[`action${i}`]}>
                    {added[`action${i}`] ? <CheckCircle2 size={16}/> : <Plus size={16}/>}
                  </Button>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

export function AiProjectPanel({ workspaceId, project }) {
  const [plan, setPlan] = useState(null);

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
      // CORREÇÃO CRÍTICA: O backend manda { ok: true, data: { result: ... } }
      // Precisamos pegar 'res.data.result' ou 'res.result' dependendo do parser
      const payload = res.data || res; 
      
      if (payload?.result) {
        setPlan(payload.result);
        toast.success("Estratégia gerada!");
      } else {
        console.error("Resposta da IA inesperada:", res);
        toast.error("IA respondeu, mas sem dados.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro de conexão com a IA");
    }
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-primary" size={20} />
            Copiloto de Planejamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted mb-4">
            Gerar análise de riscos, próximos passos e sugestão de sprints para: <strong>{project.name}</strong>
          </p>
          <Button onClick={() => generatePlan.mutate()} disabled={generatePlan.isPending}>
            {generatePlan.isPending ? "Analisando..." : "Gerar Plano"}
          </Button>
        </CardContent>
      </Card>

      {generatePlan.isError && (
        <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle size={14}/> Erro</div>
          {generatePlan.error?.message}
        </div>
      )}

      {generatePlan.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {plan && (
        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardHeader><CardTitle className="text-base text-red-400">Riscos</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.risks?.map((r, i) => (
                  <li key={i} className="text-sm border-l-2 border-red-500/30 pl-3">
                    <div className="font-semibold text-text">{r.risk}</div>
                    <div className="text-muted opacity-80">{r.mitigation}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base text-blue-400">Sprints Sugeridas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plan.sprintSuggestions?.map((s, i) => (
                  <div key={i} className="p-2 rounded bg-white/5 border border-white/10 text-sm">
                    <span className="font-bold text-text">{s.name}:</span> <span className="text-muted">{s.goal}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base text-green-400">Próximas Ações</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-decimal pl-5 space-y-1 text-sm text-muted">
                {plan.nextActions?.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
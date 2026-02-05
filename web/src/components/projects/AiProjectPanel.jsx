import React, { useState } from "react";
import { Sparkles, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function AiProjectPanel({ workspaceId, project }) {
  const [plan, setPlan] = useState(null);

  // Hook inline para chamar a API de IA do Projeto
  const generatePlan = useMutation({
    mutationFn: async () => {
      return apiFetch("/ai/generate-project-plan", {
        method: "POST",
        body: {
          workspaceId,
          projectId: project.id,
          projectName: project.name,
          projectDescription: project.description || "Projeto de software",
          context: "Gere um plano com riscos e milestones."
        }
      });
    },
    onSuccess: (data) => {
      setPlan(data.result); // O backend retorna { result: { ... } }
    }
  });

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Copiloto de Planejamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted mb-4">
            A IA vai analisar o nome e descrição do seu projeto para sugerir uma estrutura de Sprints, Riscos e Próximos Passos.
          </p>
          <Button 
            onClick={() => generatePlan.mutate()} 
            disabled={generatePlan.isPending}
          >
            {generatePlan.isPending ? "Gerando estratégia..." : "Gerar Plano do Projeto"}
          </Button>
        </CardContent>
      </Card>

      {generatePlan.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {plan && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Exibição simples do JSON gerado - Você pode melhorar a UI aqui */}
          <Card>
            <CardHeader><CardTitle>Riscos Detectados</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted">
                {plan.risks?.map((risk, i) => (
                  <li key={i}><span className="text-text font-medium">{risk.risk}:</span> {risk.mitigation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Próximas Ações</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-decimal pl-5 space-y-2 text-sm text-muted">
                {plan.nextActions?.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
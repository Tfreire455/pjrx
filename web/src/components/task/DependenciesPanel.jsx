import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Link2, Ban, ArrowRightCircle } from "lucide-react";

export function DependenciesPanel({ depsQ }) {
  // Hook useDependencies retorna objeto: { dependenciesFrom: [], dependenciesTo: [] }
  const { dependenciesFrom = [], dependenciesTo = [] } = depsQ?.data || {};
  const loading = depsQ?.isLoading;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const hasDeps = dependenciesFrom.length > 0 || dependenciesTo.length > 0;

  if (!hasDeps) {
    return <div className="text-sm text-muted p-4 text-center border border-dashed border-white/10 rounded-xl">Sem dependências.</div>;
  }

  // Helper para renderizar item
  const renderItem = (dep, type) => {
    // Nota: O backend precisa incluir o titulo da tarefa relacionada para exibir aqui.
    // Se vier só IDs, exibiremos o ID como fallback.
    const label = type === "blocking" ? "Bloqueia" : "Bloqueado por";
    const icon = type === "blocking" ? <ArrowRightCircle size={16} className="text-warning" /> : <Ban size={16} className="text-danger" />;
    
    // Tentativa de pegar titulo se o backend mandar 'task' ou 'dependsOnTask' populado
    const title = dep.task?.title || dep.dependsOnTask?.title || `Tarefa #${dep.id.slice(0,5)}`;

    return (
      <div key={dep.id} className="rounded-2xl border border-white/10 bg-white/3 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="opacity-80">{icon}</div>
          <div className="min-w-0">
             <div className="text-xs text-muted uppercase tracking-wider font-bold mb-0.5">{label}</div>
             <div className="text-sm font-medium text-text truncate">{title}</div>
          </div>
        </div>
        <Badge tone="neutral">{dep.type || "blocks"}</Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Dependências TO (O que esta tarefa precisa para andar -> Bloqueada por) */}
      {dependenciesFrom.length > 0 && (
        <div className="space-y-2">
          {dependenciesFrom.map(d => renderItem(d, "blocked"))}
        </div>
      )}

      {/* Dependências FROM (O que esta tarefa bloqueia -> Bloqueia) */}
      {dependenciesTo.length > 0 && (
        <div className="space-y-2">
          {dependenciesTo.map(d => renderItem(d, "blocking"))}
        </div>
      )}
    </div>
  );
}
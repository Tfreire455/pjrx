import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProjectTasks(workspaceId, projectId) {
  return useQuery({
    queryKey: ["tasks", "project", workspaceId, projectId],
    enabled: Boolean(workspaceId && projectId),
    // CORREÇÃO: Rota correta para buscar tarefas do projeto
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks?projectId=${projectId}`),
    staleTime: 5000 // Reduzido para atualizar mais rápido
  });
}
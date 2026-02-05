import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useDependencies(workspaceId, taskId) {
  return useQuery({
    queryKey: ["dependencies", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // O backend retorna as dependências dentro do GET /tasks/:id
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks/${taskId}`),
    // Opcional: Se quiser filtrar aqui, mas geralmente o componente faz isso
    select: (res) => {
      const task = res.data?.task || res.task || res;
      return { 
        dependenciesFrom: task?.dependenciesFrom || [], 
        dependenciesTo: task?.dependenciesTo || [] 
      };
    },
    staleTime: 10_000
  });
}
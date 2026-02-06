import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useTask(workspaceId, taskId) {
  return useQuery({
    queryKey: ["task", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // A rota DEVE ser /w/:id/tasks/:id
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks/${taskId}`),
    staleTime: 1000 * 5 // 5 segundos de cache
  });
}
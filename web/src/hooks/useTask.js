import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useTask(workspaceId, taskId) {
  return useQuery({
    queryKey: ["task", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // CORREÇÃO: Rota correta /w/:id/tasks/:id
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks/${taskId}`),
    staleTime: 5000
  });
}
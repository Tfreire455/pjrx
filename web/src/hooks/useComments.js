import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useComments(workspaceId, taskId) {
  return useQuery({
    queryKey: ["comments", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // Rota ajustada para o padrão scoped
    queryFn: () => apiFetch(`/w/${workspaceId}/comments?taskId=${encodeURIComponent(taskId)}`),
    staleTime: 6_000
  });
}
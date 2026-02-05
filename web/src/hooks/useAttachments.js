import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAttachments(workspaceId, taskId) {
  return useQuery({
    queryKey: ["attachments", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // Rota ajustada para padrão scoped
    queryFn: () => apiFetch(`/w/${workspaceId}/attachments?taskId=${encodeURIComponent(taskId)}`),
    staleTime: 10_000
  });
}
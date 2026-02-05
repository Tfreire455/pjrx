import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProjectTasks(workspaceId, projectId) {
  return useQuery({
    queryKey: ["tasks", "project", workspaceId, projectId],
    enabled: Boolean(workspaceId && projectId),
    // Rota ajustada
    queryFn: () =>
      apiFetch(`/w/${workspaceId}/tasks?projectId=${encodeURIComponent(projectId)}`),
    staleTime: 10_000
  });
}
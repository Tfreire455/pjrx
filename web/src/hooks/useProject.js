import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProject(workspaceId, projectId) {
  return useQuery({
    queryKey: ["project", workspaceId, projectId],
    enabled: Boolean(workspaceId && projectId),
    // A rota deve ser essa:
    queryFn: () => apiFetch(`/w/${workspaceId}/projects/${projectId}`),
    staleTime: 15_000
  });
}
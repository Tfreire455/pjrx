import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProject(workspaceId, projectId) {
  return useQuery({
    queryKey: ["project", workspaceId, projectId],
    // Só executa se tiver ambos os IDs
    enabled: Boolean(workspaceId && projectId),
    // URL ajustada para o padrão scoped do backend
    queryFn: () => apiFetch(`/w/${workspaceId}/projects/${projectId}`),
    staleTime: 15_000
  });
}
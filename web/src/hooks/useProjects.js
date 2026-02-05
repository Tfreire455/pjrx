import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useProjects(workspaceId) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    // Só executa se tiver ID do workspace
    enabled: Boolean(workspaceId),
    // URL ajustada para o padrão scoped do backend
    queryFn: () => apiFetch(`/w/${workspaceId}/projects`),
    staleTime: 20_000
  });
}
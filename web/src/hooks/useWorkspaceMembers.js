import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useWorkspaceMembers(workspaceId) {
  return useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    enabled: Boolean(workspaceId),
    // Rota ajustada para /w/:workspaceId/members
    queryFn: () => apiFetch(`/w/${workspaceId}/members`),
    staleTime: 10_000
  });
}
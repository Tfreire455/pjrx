import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAuditLogs(workspaceId) {
  return useQuery({
    queryKey: ["audit", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: () => apiFetch(`/w/${workspaceId}/audit`),
    staleTime: 1000 * 30 // Cache de 30s
  });
}
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useAtRiskTasks(workspaceId) {
  return useQuery({
    queryKey: ["tasks", "atRisk", workspaceId],
    enabled: Boolean(workspaceId),
    // Rota ajustada
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks?atRisk=1`),
    staleTime: 10_000
  });
}
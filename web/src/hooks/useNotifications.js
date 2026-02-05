import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useNotifications(workspaceId, limit = 10) {
  return useQuery({
    queryKey: ["notifications", workspaceId, limit],
    enabled: Boolean(workspaceId),
    // Rota ajustada
    queryFn: () =>
      apiFetch(`/w/${workspaceId}/notifications?limit=${limit}`),
    staleTime: 10_000
  });
}
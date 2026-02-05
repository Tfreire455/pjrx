import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useWhatsappPrefs(workspaceId) {
  return useQuery({
    queryKey: ["whatsappPrefs", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: () => apiFetch(`/whatsapp/prefs?workspaceId=${encodeURIComponent(workspaceId)}`),
    staleTime: 15_000
  });
}
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useNotificationsFeed(workspaceId, { limit = 20, cursor = null, unread = null } = {}) {
  return useQuery({
    queryKey: ["notificationsFeed", workspaceId, limit, cursor, unread],
    enabled: Boolean(workspaceId),
    queryFn: () => {
      const qs = new URLSearchParams();
      // workspaceId agora vai na URL, não na query
      qs.set("limit", String(limit));
      if (cursor) qs.set("cursor", cursor);
      if (unread !== null) qs.set("unread", unread ? "1" : "0");
      
      // Rota ajustada: /w/:id/notifications
      return apiFetch(`/w/${workspaceId}/notifications?${qs.toString()}`);
    },
    staleTime: 8_000
  });
}
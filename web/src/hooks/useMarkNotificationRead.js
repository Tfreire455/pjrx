import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useMarkNotificationRead(workspaceId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }) => {
      // Rota ajustada: /w/:id/notifications/:id/read
      return apiFetch(`/w/${workspaceId}/notifications/${id}/read`, {
        method: "POST"
        // workspaceId já está na URL
      });
    },

    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["notificationsFeed"] });

      const keys = qc.getQueriesData({ queryKey: ["notificationsFeed"] });
      const prev = keys.map(([key, data]) => [key, data]);

      keys.forEach(([key]) => {
        qc.setQueryData(key, (old) => {
          // Normalização para suportar { data: { items: [] } } ou { items: [] }
          const payload = old?.data || old; 
          const items = payload?.items || (Array.isArray(payload) ? payload : []) || [];
          
          const nextItems = items.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
          
          // Reconstrói a estrutura original
          const nextPayload = payload?.items ? { ...payload, items: nextItems } : nextItems;
          return old?.data ? { ...old, data: nextPayload } : nextPayload;
        });
      });

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx?.prev) return;
      ctx.prev.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notificationsFeed"] });
    }
  });
}
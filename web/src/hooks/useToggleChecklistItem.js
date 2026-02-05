import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useToggleChecklistItem(workspaceId, taskId) {
  const qc = useQueryClient();

  return useMutation({
    // Recebe 'checked' (boolean) para enviar ao backend
    mutationFn: async ({ itemId, checked }) => {
      // Rota definida no checklistRoutes: PATCH /checklist-items/:itemId
      return apiFetch(`/w/${workspaceId}/checklist-items/${itemId}`, {
        method: "PATCH",
        body: { done: checked } // Backend espera 'done'
      });
    },

    onMutate: async ({ itemId }) => {
      const key = ["checklist", workspaceId, taskId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      qc.setQueryData(key, (old) => {
        // Normalização de dados
        const data = Array.isArray(old) ? old : (old?.data || []);
        
        // Atualização otimista
        const next = data.map((cl) => ({
          ...cl,
          items: (cl.items || []).map((it) =>
            it.id === itemId ? { ...it, done: !it.done, checked: !it.checked } : it
          )
        }));
        return old?.data ? { ...old, data: next } : next;
      });

      return { prev, key };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },

    onSettled: (_d, _e, _v, ctx) => {
      // Invalida também a task, pois a checklist faz parte dela
      if (ctx?.key) qc.invalidateQueries({ queryKey: ctx.key });
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskId] });
    }
  });
}
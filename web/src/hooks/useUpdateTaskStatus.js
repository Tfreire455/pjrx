import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useUpdateTaskStatus(workspaceId, projectId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }) => {
      // Rota ajustada: /w/:id/tasks/:id
      return apiFetch(`/w/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        body: { status } // workspaceId já está na URL
      });
    },

    onMutate: async ({ taskId, status }) => {
      const key = ["tasks", "project", workspaceId, projectId];
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData(key);

      qc.setQueryData(key, (old) => {
        // Normalização segura
        const payload = old?.data || old;
        const tasks = payload?.tasks || (Array.isArray(payload) ? payload : []) || [];
        
        const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
        
        // Reconstrói estrutura
        const nextPayload = payload?.tasks ? { ...payload, tasks: nextTasks } : nextTasks;
        return old?.data ? { ...old, data: nextPayload } : nextPayload;
      });

      return { prev, key };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },

    onSettled: (_data, _err, _vars, ctx) => {
      if (ctx?.key) qc.invalidateQueries({ queryKey: ctx.key });
      qc.invalidateQueries({ queryKey: ["task", workspaceId, _vars.taskId] });
    }
  });
}
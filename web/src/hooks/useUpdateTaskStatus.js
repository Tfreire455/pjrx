import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useUpdateTaskStatus(workspaceId, projectId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }) => {
      // CORREÇÃO: URL Escopada corretamente
      return apiFetch(`/w/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        body: { status }
      });
    },
    onMutate: async ({ taskId, status }) => {
      // Atualização Otimista (Move o card na hora sem esperar o servidor)
      const key = ["tasks", "project", workspaceId, projectId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      qc.setQueryData(key, (old) => {
        // Lógica robusta para encontrar o array de tarefas onde quer que ele esteja
        const list = old?.data?.tasks || old?.tasks || (Array.isArray(old) ? old : []);
        const updatedList = list.map((t) => (t.id === taskId ? { ...t, status } : t));

        // Reconstrói a estrutura original do objeto
        if (old?.data?.tasks) return { ...old, data: { ...old.data, tasks: updatedList } };
        if (old?.tasks) return { ...old, tasks: updatedList };
        return updatedList;
      });

      return { prev, key };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "project", workspaceId, projectId] });
    }
  });
}
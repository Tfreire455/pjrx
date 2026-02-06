import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useCreateComment(workspaceId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, content }) => {
      // POST /w/:wid/tasks/:tid/comments
      return apiFetch(`/w/${workspaceId}/comments`, {
        method: "POST",
        body: { taskId, content }
      });
    },
    onSuccess: (_, vars) => {
      // Invalida a tarefa para recarregar os comentários
      qc.invalidateQueries({ queryKey: ["task", workspaceId, vars.taskId] });
    }
  });
}
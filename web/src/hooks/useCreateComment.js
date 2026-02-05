import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useCreateComment(workspaceId, taskId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }) => {
      return apiFetch(`/w/${workspaceId}/comments`, {
        method: "POST",
        body: { taskId, body: content } // Backend espera 'body', não 'content'
      });
    },
    onSuccess: () => {
      // O backend retorna comentários em queries de task ou lista de comments
      qc.invalidateQueries({ queryKey: ["comments", workspaceId, taskId] });
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskId] });
    }
  });
}
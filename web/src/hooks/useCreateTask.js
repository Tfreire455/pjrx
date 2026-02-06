import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useCreateTask(workspaceId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // CORREÇÃO: A URL deve incluir /w/${workspaceId}
      return apiFetch(`/w/${workspaceId}/tasks`, {
        method: "POST",
        body: { ...data, workspaceId }
      });
    },
    onSuccess: (_, vars) => {
      // Atualiza as listas imediatamente
      if (vars.projectId) {
        qc.invalidateQueries({ queryKey: ["tasks", "project", workspaceId, vars.projectId] });
      }
      qc.invalidateQueries({ queryKey: ["tasks", "atRisk", workspaceId] });
    }
  });
}
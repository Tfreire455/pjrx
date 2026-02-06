import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useCreateTask(workspaceId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // O backend espera { workspaceId, projectId, title, ... }
      return apiFetch("/tasks", {
        method: "POST",
        body: { workspaceId, ...data }
      });
    },
    onSuccess: (_, vars) => {
      // Atualiza Kanban e Listas
      if (vars.projectId) {
        qc.invalidateQueries({ queryKey: ["tasks", "project", workspaceId, vars.projectId] });
      }
      qc.invalidateQueries({ queryKey: ["tasks", "atRisk", workspaceId] });
    }
  });
}
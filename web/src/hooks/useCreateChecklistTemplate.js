import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useCreateChecklistTemplate(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => 
      // Rota ajustada
      apiFetch(`/w/${workspaceId}/checklist-templates`, { 
        method: "POST", 
        body: payload 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklistTemplates", workspaceId] })
  });
}
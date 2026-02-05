import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useDeleteChecklistTemplate(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => 
      // Rota ajustada
      apiFetch(`/w/${workspaceId}/checklist-templates/${id}`, { 
        method: "DELETE" 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklistTemplates", workspaceId] })
  });
}
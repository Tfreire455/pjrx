import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useUpdateChecklistTemplate(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      // Rota ajustada para /w/:id/checklist-templates/:templateId
      apiFetch(`/w/${workspaceId}/checklist-templates/${id}`, { 
        method: "PATCH", 
        body: payload 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklistTemplates", workspaceId] })
  });
}
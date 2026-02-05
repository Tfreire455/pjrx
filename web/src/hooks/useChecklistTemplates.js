import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useChecklistTemplates(workspaceId) {
  return useQuery({
    queryKey: ["checklistTemplates", workspaceId],
    enabled: Boolean(workspaceId),
    // CORREÇÃO: Rota ajustada para /w/:id/checklist-templates
    queryFn: () => apiFetch(`/w/${workspaceId}/checklist-templates`),
    staleTime: 15_000
  });
}
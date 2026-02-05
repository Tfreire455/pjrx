import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useApplyChecklistTemplate(workspaceId, taskId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId }) =>
      // Usamos a rota de CRIAR checklist, passando o templateId
      apiFetch(`/w/${workspaceId}/checklists`, {
        method: "POST",
        body: { 
          taskId, 
          templateId,
          title: "Checklist" // Título padrão obrigatório pelo schema
        }
      }),
    onSuccess: () => {
      // Invalida a query da TASK, pois as checklists vêm dentro dela
      qc.invalidateQueries({ queryKey: ["task", workspaceId, taskId] });
      // Ou se você tiver uma query específica de checklists
      qc.invalidateQueries({ queryKey: ["checklists", workspaceId, taskId] });
    }
  });
}
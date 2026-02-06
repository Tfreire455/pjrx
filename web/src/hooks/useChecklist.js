import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useChecklist(workspaceId, taskId) {
  return useQuery({
    // CORREÇÃO CRÍTICA: Mudamos a chave de 'checklist' para 'task'.
    // Agora, quando você cria um item e o sistema invalida a 'task', 
    // este hook atualiza automaticamente.
    queryKey: ["task", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks/${taskId}`),
    // Selecionamos apenas as checklists para o componente
    select: (res) => {
      const task = res.data?.task || res.task || res;
      return task?.checklists || [];
    },
    // Removemos staleTime para garantir dados frescos após interações
    staleTime: 0
  });
}
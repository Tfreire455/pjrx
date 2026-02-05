import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useChecklist(workspaceId, taskId) {
  return useQuery({
    queryKey: ["checklist", workspaceId, taskId],
    enabled: Boolean(workspaceId && taskId),
    // O backend retorna as checklists dentro do GET /tasks/:id
    queryFn: () => apiFetch(`/w/${workspaceId}/tasks/${taskId}`),
    // Filtramos apenas as checklists da resposta
    select: (res) => {
      const task = res.data?.task || res.task || res;
      return task?.checklists || [];
    },
    staleTime: 8_000
  });
}
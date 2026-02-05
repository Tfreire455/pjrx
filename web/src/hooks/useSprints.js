import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export function useSprints(workspaceId, projectId) {
  return useQuery({
    queryKey: ["sprints", workspaceId, projectId],
    enabled: Boolean(workspaceId && projectId),
    queryFn: () => apiFetch(`/w/${workspaceId}/sprints?projectId=${projectId}`),
    staleTime: 10_000,
  });
}

export function useCreateSprint(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiFetch(`/w/${workspaceId}/sprints`, { method: "POST", body: data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sprints", workspaceId, vars.projectId] });
    },
  });
}